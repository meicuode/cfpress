/**
 * Cloudflare Pages Function - Single Thread API
 * GET /api/threads/:id - 获取单个文章
 * PUT /api/threads/:id - 更新文章
 * DELETE /api/threads/:id - 删除文章
 */

// 获取单个文章
export async function onRequestGet(context) {
  const { env, params } = context;
  const { id } = params;

  try {
    // 获取文章基本信息
    const { results: threads } = await env.DB.prepare(`
      SELECT
        t.*,
        u.display_name as author_name,
        u.username as author_username
      FROM threads t
      LEFT JOIN users u ON t.author_id = u.id
      WHERE t.id = ?
    `).bind(id).all();

    if (threads.length === 0) {
      return new Response(
        JSON.stringify({ error: '文章不存在' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const thread = threads[0];

    // 获取分类
    const { results: categories } = await env.DB.prepare(`
      SELECT c.id, c.name, c.slug
      FROM categories c
      INNER JOIN thread_categories tc ON c.id = tc.category_id
      WHERE tc.thread_id = ?
    `).bind(id).all();
    thread.categories = categories;

    // 获取标签
    const { results: tags } = await env.DB.prepare(`
      SELECT t.id, t.name, t.slug
      FROM tags t
      INNER JOIN thread_tags tt ON t.id = tt.tag_id
      WHERE tt.thread_id = ?
    `).bind(id).all();
    thread.tags = tags;

    return new Response(
      JSON.stringify({ thread }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching thread:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// 更新文章
export async function onRequestPut(context) {
  const { env, params, request } = context;
  const { id } = params;

  try {
    // 解析请求体
    const data = await request.json();
    const { title, content, excerpt, categories = [], tags = [], status = 'draft' } = data;

    // 验证必填字段
    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: '标题和内容不能为空' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 检查文章是否存在
    const { results: existingThreads } = await env.DB.prepare(
      'SELECT id FROM threads WHERE id = ?'
    ).bind(id).all();

    if (existingThreads.length === 0) {
      return new Response(
        JSON.stringify({ error: '文章不存在' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 生成摘要（如果没有提供）
    const finalExcerpt = excerpt || content.substring(0, 200);

    // 更新文章基本信息
    await env.DB.prepare(`
      UPDATE threads
      SET title = ?,
          content = ?,
          excerpt = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP,
          published_at = CASE
            WHEN status = 'draft' AND ? = 'publish' THEN CURRENT_TIMESTAMP
            ELSE published_at
          END
      WHERE id = ?
    `).bind(title, content, finalExcerpt, status, status, id).run();

    // 获取旧的分类和标签，用于更新计数
    const { results: oldCategories } = await env.DB.prepare(
      'SELECT category_id FROM thread_categories WHERE thread_id = ?'
    ).bind(id).all();

    const { results: oldTags } = await env.DB.prepare(
      'SELECT tag_id FROM thread_tags WHERE thread_id = ?'
    ).bind(id).all();

    // 删除旧的分类和标签关联
    await env.DB.prepare('DELETE FROM thread_categories WHERE thread_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM thread_tags WHERE thread_id = ?').bind(id).run();

    // 更新旧分类的计数（减少）
    for (const cat of oldCategories) {
      await env.DB.prepare(
        'UPDATE categories SET thread_count = thread_count - 1 WHERE id = ? AND thread_count > 0'
      ).bind(cat.category_id).run();
    }

    // 更新旧标签的计数（减少）
    for (const tag of oldTags) {
      await env.DB.prepare(
        'UPDATE tags SET thread_count = thread_count - 1 WHERE id = ? AND thread_count > 0'
      ).bind(tag.tag_id).run();
    }

    // 添加新的分类关联
    for (const categoryId of categories) {
      await env.DB.prepare(
        'INSERT INTO thread_categories (thread_id, category_id) VALUES (?, ?)'
      ).bind(id, categoryId).run();

      // 更新分类计数
      await env.DB.prepare(
        'UPDATE categories SET thread_count = thread_count + 1 WHERE id = ?'
      ).bind(categoryId).run();
    }

    // 处理标签（去重）
    const uniqueTags = [...new Set(tags)];

    for (const tagName of uniqueTags) {
      // 查找或创建标签
      let { results: existingTags } = await env.DB.prepare(
        'SELECT id FROM tags WHERE name = ?'
      ).bind(tagName).all();

      let tagId;
      if (existingTags.length > 0) {
        tagId = existingTags[0].id;
      } else {
        // 创建新标签
        const slug = tagName.toLowerCase().replace(/\s+/g, '-');
        const result = await env.DB.prepare(
          'INSERT INTO tags (name, slug) VALUES (?, ?) RETURNING id'
        ).bind(tagName, slug).first();
        tagId = result.id;
      }

      // 添加标签关联
      await env.DB.prepare(
        'INSERT INTO thread_tags (thread_id, tag_id) VALUES (?, ?)'
      ).bind(id, tagId).run();

      // 更新标签计数
      await env.DB.prepare(
        'UPDATE tags SET thread_count = thread_count + 1 WHERE id = ?'
      ).bind(tagId).run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '文章已更新',
        threadId: parseInt(id)
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error updating thread:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// 删除文章
export async function onRequestDelete(context) {
  const { env, params } = context;
  const { id } = params;

  try {
    // 检查文章是否存在
    const { results: threads } = await env.DB.prepare(
      'SELECT id FROM threads WHERE id = ?'
    ).bind(id).all();

    if (threads.length === 0) {
      return new Response(
        JSON.stringify({ error: '文章不存在' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 获取文章的分类和标签，用于更新计数
    const { results: threadCategories } = await env.DB.prepare(`
      SELECT category_id FROM thread_categories WHERE thread_id = ?
    `).bind(id).all();

    const { results: threadTags } = await env.DB.prepare(`
      SELECT tag_id FROM thread_tags WHERE thread_id = ?
    `).bind(id).all();

    // 删除文章-分类关联
    await env.DB.prepare(
      'DELETE FROM thread_categories WHERE thread_id = ?'
    ).bind(id).run();

    // 删除文章-标签关联
    await env.DB.prepare(
      'DELETE FROM thread_tags WHERE thread_id = ?'
    ).bind(id).run();

    // 删除文章的评论
    await env.DB.prepare(
      'DELETE FROM comments WHERE thread_id = ?'
    ).bind(id).run();

    // 删除文章
    await env.DB.prepare(
      'DELETE FROM threads WHERE id = ?'
    ).bind(id).run();

    // 更新分类的文章计数
    for (const cat of threadCategories) {
      await env.DB.prepare(`
        UPDATE categories
        SET thread_count = thread_count - 1
        WHERE id = ? AND thread_count > 0
      `).bind(cat.category_id).run();
    }

    // 更新标签的文章计数
    for (const tag of threadTags) {
      await env.DB.prepare(`
        UPDATE tags
        SET thread_count = thread_count - 1
        WHERE id = ? AND thread_count > 0
      `).bind(tag.tag_id).run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '文章已删除'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error deleting thread:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
