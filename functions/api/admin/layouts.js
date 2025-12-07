/**
 * 布局模板管理 API
 *
 * GET /api/admin/layouts - 获取所有布局模板
 * POST /api/admin/layouts - 创建新布局模板
 */

export async function onRequestGet(context) {
  const { env } = context

  try {
    // 获取所有布局模板
    const layouts = await env.DB.prepare(`
      SELECT id, name, page_type, layout_config, is_default, created_at, updated_at
      FROM site_layouts
      ORDER BY page_type ASC, is_default DESC, id ASC
    `).all()

    // 获取页面布局绑定
    const pageLayouts = await env.DB.prepare(`
      SELECT page_type, layout_id
      FROM site_page_layouts
    `).all()

    // 构建页面类型到布局ID的映射
    const pageLayoutMap = {}
    if (pageLayouts.results) {
      for (const row of pageLayouts.results) {
        pageLayoutMap[row.page_type] = row.layout_id
      }
    }

    return new Response(JSON.stringify({
      layouts: layouts.results || [],
      pageLayoutMap,
      pageTypes: ['home', 'thread', 'category', 'tag']
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Failed to get layouts:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function onRequestPost(context) {
  const { env, request } = context

  try {
    const body = await request.json()
    const { name, pageType, layoutConfig, isDefault } = body

    if (!name || !layoutConfig) {
      return new Response(JSON.stringify({
        success: false,
        error: '名称和布局配置不能为空'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 验证页面类型
    const validPageTypes = ['home', 'thread', 'category', 'tag']
    const finalPageType = pageType && validPageTypes.includes(pageType) ? pageType : 'home'

    // 验证布局配置格式
    const config = typeof layoutConfig === 'string' ? JSON.parse(layoutConfig) : layoutConfig
    if (!Array.isArray(config.leftSidebar) || !Array.isArray(config.main) || !Array.isArray(config.rightSidebar)) {
      return new Response(JSON.stringify({
        success: false,
        error: '布局配置格式错误'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const configJson = JSON.stringify(config)

    const result = await env.DB.prepare(`
      INSERT INTO site_layouts (name, page_type, layout_config, is_default)
      VALUES (?, ?, ?, ?)
    `).bind(name, finalPageType, configJson, isDefault ? 1 : 0).run()

    // 清除缓存
    await clearLayoutCache(context)

    return new Response(JSON.stringify({
      success: true,
      id: result.meta.last_row_id,
      message: '布局模板已创建'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Failed to create layout:', error)
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
async function clearLayoutCache(context) {
  try {
    const cache = caches.default
    const baseUrl = new URL(context.request.url)
    baseUrl.pathname = '/api/layout'

    // 清除无参数缓存
    baseUrl.search = ''
    await cache.delete(baseUrl)

    // 清除各页面类型的缓存
    for (const pageType of ['home', 'thread', 'category', 'tag']) {
      baseUrl.search = `page=${pageType}`
      await cache.delete(baseUrl)
    }
  } catch (error) {
    console.error('Failed to clear cache:', error)
  }
}
