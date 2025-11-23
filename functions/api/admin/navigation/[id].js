/**
 * Cloudflare Pages Function - Admin Single Navigation API
 * PUT /api/admin/navigation/:id - 更新菜单项
 * DELETE /api/admin/navigation/:id - 删除菜单项
 */

import { purgeNavigationCache } from '../../_utils/cache.js';

export async function onRequestPut(context) {
  const { env, params, request } = context;
  const { id } = params;

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

    // 更新菜单项
    await env.DB.prepare(`
      UPDATE navigation
      SET label = ?,
          path = ?,
          icon = ?,
          parent_id = ?,
          target = ?,
          sort_order = ?,
          is_home = ?,
          is_active = ?,
          position = ?,
          updated_at = ?
      WHERE id = ?
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
      new Date().toISOString(),
      id
    ).run();

    // 清除导航菜单缓存
    purgeNavigationCache(request, context);

    return new Response(
      JSON.stringify({
        success: true,
        message: '菜单项已更新'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating navigation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  const { id } = params;

  try {
    // 检查是否有子菜单
    const { results: children } = await env.DB.prepare(
      'SELECT id FROM navigation WHERE parent_id = ?'
    ).bind(id).all();

    if (children.length > 0) {
      return new Response(
        JSON.stringify({ error: '请先删除子菜单项' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 删除菜单项
    await env.DB.prepare(
      'DELETE FROM navigation WHERE id = ?'
    ).bind(id).run();

    // 清除导航菜单缓存
    purgeNavigationCache(request, context);

    return new Response(
      JSON.stringify({
        success: true,
        message: '菜单项已删除'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting navigation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
