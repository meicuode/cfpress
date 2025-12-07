/**
 * 页面布局绑定 API
 *
 * PUT /api/admin/page-layouts/[pageType] - 绑定布局到页面
 */

export async function onRequestPut(context) {
  const { env, params, request } = context
  const { pageType } = params

  const validPageTypes = ['home', 'thread', 'category', 'tag', 'about', 'friends']
  if (!validPageTypes.includes(pageType)) {
    return new Response(JSON.stringify({
      success: false,
      error: '无效的页面类型'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const body = await request.json()
    const { layoutId } = body

    if (!layoutId) {
      return new Response(JSON.stringify({
        success: false,
        error: '布局ID不能为空'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 验证布局存在
    const layout = await env.DB.prepare(`
      SELECT id FROM site_layouts WHERE id = ?
    `).bind(layoutId).first()

    if (!layout) {
      return new Response(JSON.stringify({
        success: false,
        error: '布局模板不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // UPSERT 页面布局绑定
    await env.DB.prepare(`
      INSERT INTO site_page_layouts (page_type, layout_id, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(page_type) DO UPDATE SET
        layout_id = excluded.layout_id,
        updated_at = CURRENT_TIMESTAMP
    `).bind(pageType, layoutId).run()

    // 清除缓存
    await clearLayoutCache(context, pageType)

    return new Response(JSON.stringify({
      success: true,
      message: '页面布局已更新'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Failed to update page layout:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// 清除布局缓存
async function clearLayoutCache(context, pageType) {
  try {
    const cache = caches.default
    const baseUrl = new URL(context.request.url)
    baseUrl.pathname = '/api/layout'

    // 清除无参数缓存
    baseUrl.search = ''
    await cache.delete(baseUrl)

    // 清除特定页面类型的缓存
    baseUrl.search = `page=${pageType}`
    await cache.delete(baseUrl)
  } catch (error) {
    console.error('Failed to clear cache:', error)
  }
}
