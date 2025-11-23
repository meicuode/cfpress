/**
 * Cloudflare Pages Function - Threads API
 * GET /api/threads - 获取文章列表
 * POST /api/threads - 创建新文章
 */

import { purgeSeoCaches } from './_utils/cache.js';

// 获取文章列表
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'all';
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const search = url.searchParams.get('search');
  const year = url.searchParams.get('year');
  const category = url.searchParams.get('category');

  try {
    // 构建查询
    let query = `
      SELECT DISTINCT
        t.*,
        u.display_name as author_name,
        u.username as author_username
      FROM threads t
      LEFT JOIN users u ON t.author_id = u.id
    `;

    const conditions = [];
    const params = [];

    // 如果有分类筛选，需要 JOIN
    if (category && category !== 'all') {
      query = `
        SELECT DISTINCT
          t.*,
          u.display_name as author_name,
          u.username as author_username
        FROM threads t
        LEFT JOIN users u ON t.author_id = u.id
        INNER JOIN thread_categories tc ON t.id = tc.thread_id
        INNER JOIN categories c ON tc.category_id = c.id
      `;
      conditions.push('c.slug = ?');
      params.push(category);
    }

    if (status !== 'all') {
      conditions.push('t.status = ?');
      params.push(status);
    }

    // 搜索关键词（标题或内容）
    if (search) {
      conditions.push('(t.title LIKE ? OR t.content LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // 按年份筛选
    if (year && year !== 'all') {
      conditions.push('strftime("%Y", t.created_at) = ?');
      params.push(year);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // 执行查询
    const { results } = await env.DB.prepare(query).bind(...params).all();

    // 获取每篇文章的分类和标签
    for (const thread of results) {
      // 获取分类
      const { results: categories } = await env.DB.prepare(`
        SELECT c.id, c.name, c.slug
        FROM categories c
        INNER JOIN thread_categories tc ON c.id = tc.category_id
        WHERE tc.thread_id = ?
      `).bind(thread.id).all();
      thread.categories = categories;

      // 获取标签
      const { results: tags } = await env.DB.prepare(`
        SELECT t.id, t.name, t.slug
        FROM tags t
        INNER JOIN thread_tags tt ON t.id = tt.tag_id
        WHERE tt.thread_id = ?
      `).bind(thread.id).all();
      thread.tags = tags;
    }

    // 获取总数（使用相同的筛选条件）
    let countQuery = 'SELECT COUNT(DISTINCT t.id) as total FROM threads t';
    const countParams = [];

    // 如果有分类筛选
    if (category && category !== 'all') {
      countQuery = `
        SELECT COUNT(DISTINCT t.id) as total
        FROM threads t
        INNER JOIN thread_categories tc ON t.id = tc.thread_id
        INNER JOIN categories c ON tc.category_id = c.id
      `;
    }

    const countConditions = [];

    if (category && category !== 'all') {
      countConditions.push('c.slug = ?');
      countParams.push(category);
    }

    if (status !== 'all') {
      countConditions.push('t.status = ?');
      countParams.push(status);
    }

    if (search) {
      countConditions.push('(t.title LIKE ? OR t.content LIKE ?)');
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern);
    }

    if (year && year !== 'all') {
      countConditions.push('strftime("%Y", t.created_at) = ?');
      countParams.push(year);
    }

    if (countConditions.length > 0) {
      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }

    const { results: countResult } = await env.DB.prepare(countQuery)
      .bind(...countParams)
      .all();
    const total = countResult[0].total;

    return new Response(
      JSON.stringify({
        threads: results,
        total,
        limit,
        offset
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching threads:', error);
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

// 创建新文章
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      thumbnail,
      status = 'draft',
      author_id = 1, // TODO: 从认证系统获取当前用户ID
      categories = [],
      tags = [],
      slug,
      seo_title,
      seo_description,
      seo_keywords
    } = body;

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

    // 生成 slug（如果没有提供）
    const threadSlug = slug || title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    // 生成摘要（如果没有提供）
    const threadExcerpt = excerpt || content
      .replace(/<[^>]*>/g, '') // 移除 HTML 标签
      .substring(0, 200);

    // 插入文章
    const publishedAt = status === 'publish' ? new Date().toISOString() : null;

    const result = await env.DB.prepare(`
      INSERT INTO threads (
        title, slug, content, excerpt, thumbnail,
        author_id, status, seo_title, seo_description, seo_keywords,
        published_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title,
      threadSlug,
      content,
      threadExcerpt,
      thumbnail || null,
      author_id,
      status,
      seo_title || null,
      seo_description || null,
      seo_keywords || null,
      publishedAt,
      new Date().toISOString()
    ).run();

    const threadId = result.meta.last_row_id;

    // 处理分类关联
    if (categories && categories.length > 0) {
      for (const categoryId of categories) {
        await env.DB.prepare(`
          INSERT INTO thread_categories (thread_id, category_id)
          VALUES (?, ?)
        `).bind(threadId, categoryId).run();

        // 更新分类的文章数量
        await env.DB.prepare(`
          UPDATE categories
          SET thread_count = thread_count + 1
          WHERE id = ?
        `).bind(categoryId).run();
      }
    }

    // 处理标签
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        // 查找或创建标签
        let tagId;
        const { results: existingTags } = await env.DB.prepare(`
          SELECT id FROM tags WHERE name = ?
        `).bind(tagName).all();

        if (existingTags.length > 0) {
          tagId = existingTags[0].id;
          // 更新标签使用次数
          await env.DB.prepare(`
            UPDATE tags SET thread_count = thread_count + 1 WHERE id = ?
          `).bind(tagId).run();
        } else {
          // 创建新标签
          const tagSlug = tagName.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-') || `tag-${Date.now()}-${Math.random().toString(36).substring(7)}`;

          const tagResult = await env.DB.prepare(`
            INSERT INTO tags (name, slug, thread_count)
            VALUES (?, ?, 1)
          `).bind(tagName, tagSlug).run();
          tagId = tagResult.meta.last_row_id;
        }

        // 关联文章和标签
        await env.DB.prepare(`
          INSERT INTO thread_tags (thread_id, tag_id)
          VALUES (?, ?)
        `).bind(threadId, tagId).run();
      }
    }

    // 如果是发布状态，清除 SEO 缓存（RSS Feed、Sitemap）
    if (status === 'publish') {
      purgeSeoCaches(request, context);
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: threadId,
        message: status === 'publish' ? '文章已发布' : '草稿已保存'
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error creating thread:', error);
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
