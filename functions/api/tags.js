/**
 * Cloudflare Pages Function - Tags API
 * GET /api/tags - 获取标签列表
 */

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const orderBy = url.searchParams.get('order') || 'popular'; // popular 或 name

  try {
    let query = `
      SELECT
        id,
        name,
        slug,
        description,
        thread_count,
        created_at
      FROM tags
    `;

    // 排序
    if (orderBy === 'popular') {
      query += ' ORDER BY thread_count DESC, name ASC';
    } else {
      query += ' ORDER BY name ASC';
    }

    const { results } = await env.DB.prepare(query).all();

    return new Response(
      JSON.stringify({
        tags: results
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching tags:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
