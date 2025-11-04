/**
 * Cloudflare Pages Function - Batch Update Navigation Order
 * POST /api/admin/navigation/reorder - 批量更新菜单排序
 */

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: '无效的数据格式' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 批量更新排序
    for (const item of items) {
      await env.DB.prepare(`
        UPDATE navigation
        SET sort_order = ?,
            parent_id = ?,
            updated_at = ?
        WHERE id = ?
      `).bind(
        item.sort_order,
        item.parent_id || null,
        new Date().toISOString(),
        item.id
      ).run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '排序已更新'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error reordering navigation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
