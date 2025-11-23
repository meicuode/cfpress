/**
 * Cloudflare Pages Function - Categories API
 * GET /api/categories - 获取分类列表
 * POST /api/categories - 创建新分类
 *
 * 使用 Cloudflare Cache API 边缘缓存 30 分钟
 */

import { withCache, DEFAULT_CACHE_TTL, purgeCategoriesCache } from './_utils/cache.js';

// 原始 GET 处理函数
async function handleGet(context) {
  const { env } = context;

  try {
    // 获取所有分类，按名称排序
    const { results } = await env.DB.prepare(`
      SELECT
        id,
        name,
        slug,
        description,
        parent_id,
        thumbnail,
        sort_order,
        thread_count,
        created_at
      FROM categories
      ORDER BY sort_order ASC, name ASC
    `).all();

    return new Response(
      JSON.stringify({
        categories: results
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching categories:', error);
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

// 使用缓存包装 GET
export const onRequestGet = withCache(handleGet, { ttl: DEFAULT_CACHE_TTL });

/**
 * POST /api/categories - 创建新分类
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { name, slug, description, parent_id } = body;

    // 验证必填字段
    if (!name) {
      return new Response(
        JSON.stringify({ error: '分类名称不能为空' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 生成 slug
    const categorySlug = slug || name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    // 插入分类
    const result = await env.DB.prepare(`
      INSERT INTO categories (name, slug, description, parent_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      name,
      categorySlug,
      description || null,
      parent_id || null,
      new Date().toISOString()
    ).run();

    // 清除分类缓存
    purgeCategoriesCache(request, context);

    return new Response(
      JSON.stringify({
        success: true,
        id: result.meta.last_row_id,
        message: '分类创建成功'
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error creating category:', error);
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
