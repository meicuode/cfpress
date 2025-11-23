/**
 * Cloudflare Pages Function - Admin Navigation API
 * GET /api/admin/navigation - 获取所有导航菜单
 * POST /api/admin/navigation - 创建新菜单项
 */

import { purgeNavigationCache } from '../_utils/cache.js';

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 获取所有菜单项，按position和sort_order排序
    const { results: menus } = await env.DB.prepare(`
      SELECT * FROM navigation
      ORDER BY position, sort_order, id
    `).all();

    // 构建树形结构
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }));
    };

    const tree = buildTree(menus);

    return new Response(
      JSON.stringify({
        menus,
        tree
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching navigation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const body = await request.json();
    const {
      label,
      path,
      icon,
      parent_id,
      target,
      sort_order,
      is_home,
      is_active,
      position
    } = body;

    // 验证必填字段
    if (!label || !path) {
      return new Response(
        JSON.stringify({ error: '菜单名称和路径不能为空' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 插入新菜单项
    const result = await env.DB.prepare(`
      INSERT INTO navigation (
        label, path, icon, parent_id, target,
        sort_order, is_home, is_active, position, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      label,
      path,
      icon || null,
      parent_id || null,
      target || '_self',
      sort_order || 0,
      is_home ? 1 : 0,
      is_active !== false ? 1 : 0,
      position || 'header',
      new Date().toISOString()
    ).run();

    // 清除导航菜单缓存
    purgeNavigationCache(request, context);

    return new Response(
      JSON.stringify({
        success: true,
        id: result.meta.last_row_id,
        message: '菜单项创建成功'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating navigation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
