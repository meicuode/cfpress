/**
 * 获取仪表盘统计信息
 * GET /api/admin/dashboard-stats
 */
export async function onRequestGet({ env }) {
  try {
    const db = env.DB;

    // 获取文章总数
    const threadsCountResult = await db.prepare(`
      SELECT COUNT(*) as count
      FROM threads
    `).first();

    // 获取评论总数
    const commentsCountResult = await db.prepare(`
      SELECT COUNT(*) as count
      FROM comments
    `).first();

    // 获取标签总数
    const tagsCountResult = await db.prepare(`
      SELECT COUNT(*) as count
      FROM tags
    `).first();

    // 获取最近发布的文章（最近5篇）
    const recentThreadsResult = await db.prepare(`
      SELECT id, title, created_at, view_count
      FROM threads
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    // 获取最近的评论（最近5条）
    const recentCommentsResult = await db.prepare(`
      SELECT c.id, c.content, c.author_name, c.created_at, t.title as thread_title
      FROM comments c
      LEFT JOIN threads t ON c.thread_id = t.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `).all();

    return new Response(JSON.stringify({
      success: true,
      stats: {
        totalPosts: threadsCountResult?.count || 0,
        totalComments: commentsCountResult?.count || 0,
        totalTags: tagsCountResult?.count || 0,
        recentPosts: recentThreadsResult.results || [],
        recentComments: recentCommentsResult.results || []
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('获取仪表盘统计失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '获取仪表盘统计失败',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
