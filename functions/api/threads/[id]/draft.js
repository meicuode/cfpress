/**
 * Cloudflare Pages Function - Thread Draft API
 * GET /api/threads/:id/draft - 获取文章草稿
 * POST /api/threads/:id/draft - 保存/更新草稿
 * DELETE /api/threads/:id/draft - 删除草稿
 */

// 获取文章草稿
export async function onRequestGet(context) {
  const { env, params } = context;
  const { id } = params;

  try {
    const draft = await env.DB.prepare(`
      SELECT * FROM thread_drafts WHERE thread_id = ?
    `).bind(id).first();

    if (!draft) {
      return new Response(
        JSON.stringify({ exists: false, draft: null }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 解析 JSON 字段
    return new Response(
      JSON.stringify({
        exists: true,
        draft: {
          ...draft,
          categories: draft.categories ? JSON.parse(draft.categories) : [],
          tags: draft.tags ? JSON.parse(draft.tags) : []
        }
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching draft:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// 保存/更新草稿
export async function onRequestPost(context) {
  const { env, params, request } = context;
  const { id } = params;

  try {
    const data = await request.json();
    const { title, content, excerpt, categories = [], tags = [] } = data;

    // 检查文章是否存在
    const thread = await env.DB.prepare(
      'SELECT id FROM threads WHERE id = ?'
    ).bind(id).first();

    if (!thread) {
      return new Response(
        JSON.stringify({ error: '文章不存在' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 将数组转换为 JSON 字符串
    const categoriesJson = JSON.stringify(categories);
    const tagsJson = JSON.stringify(tags);

    // 使用 UPSERT（INSERT OR REPLACE）保存草稿
    await env.DB.prepare(`
      INSERT INTO thread_drafts (thread_id, title, content, excerpt, categories, tags, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(thread_id) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        excerpt = excluded.excerpt,
        categories = excluded.categories,
        tags = excluded.tags,
        updated_at = CURRENT_TIMESTAMP
    `).bind(id, title, content, excerpt, categoriesJson, tagsJson).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: '草稿已保存'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error saving draft:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// 删除草稿
export async function onRequestDelete(context) {
  const { env, params } = context;
  const { id } = params;

  try {
    await env.DB.prepare(
      'DELETE FROM thread_drafts WHERE thread_id = ?'
    ).bind(id).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: '草稿已删除'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting draft:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
