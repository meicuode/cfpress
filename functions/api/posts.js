// Cloudflare Pages Function - Get all posts
export async function onRequestGet(context) {
  const { env } = context;

  try {
    // Query D1 database
    const { results } = await env.DB.prepare(
      'SELECT * FROM posts ORDER BY created_at DESC LIMIT 20'
    ).all();

    return new Response(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Create new post
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { title, content, tags } = body;

    const result = await env.DB.prepare(
      'INSERT INTO posts (title, content, tags, created_at) VALUES (?, ?, ?, ?)'
    )
      .bind(title, content, JSON.stringify(tags), new Date().toISOString())
      .run();

    return new Response(
      JSON.stringify({ success: true, id: result.meta.last_row_id }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
