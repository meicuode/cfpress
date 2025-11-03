/**
 * Cloudflare Pages Function - Admin Comments API
 * GET /api/admin/comments - 获取所有评论（管理员）
 */

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  const status = url.searchParams.get('status') || 'all';
  const search = url.searchParams.get('search');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    let query = `
      SELECT
        c.*,
        t.title as thread_title,
        t.id as thread_id
      FROM comments c
      LEFT JOIN threads t ON c.thread_id = t.id
    `;

    const conditions = [];
    const params = [];

    // 状态筛选
    if (status !== 'all') {
      conditions.push('c.status = ?');
      params.push(status);
    }

    // 搜索
    if (search) {
      conditions.push('(c.content LIKE ? OR c.author_name LIKE ? OR c.author_email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results: comments } = await env.DB.prepare(query).bind(...params).all();

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM comments c';
    const countParams = [];

    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      countParams.push(...params.slice(0, -2)); // 去掉 limit 和 offset
    }

    const { results: countResult } = await env.DB.prepare(countQuery).bind(...countParams).all();
    const total = countResult[0].total;

    // 获取各状态统计
    const { results: stats } = await env.DB.prepare(`
      SELECT
        status,
        COUNT(*) as count
      FROM comments
      GROUP BY status
    `).all();

    const statusCounts = {
      all: total,
      approved: 0,
      pending: 0,
      spam: 0,
      trash: 0
    };

    stats.forEach(stat => {
      statusCounts[stat.status] = stat.count;
    });

    return new Response(
      JSON.stringify({
        comments,
        total,
        stats: statusCounts
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching admin comments:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
