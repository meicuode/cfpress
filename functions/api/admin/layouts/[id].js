/**
 * 单个布局模板管理 API
 *
 * GET /api/admin/layouts/[id] - 获取布局模板详情
 * PUT /api/admin/layouts/[id] - 更新布局模板
 * DELETE /api/admin/layouts/[id] - 删除布局模板
 */

export async function onRequestGet(context) {
  const { env, params } = context
  const { id } = params

  try {
    const layout = await env.DB.prepare(`
      SELECT id, name, layout_config, is_default, created_at, updated_at
      FROM site_layouts WHERE id = ?
    `).bind(id).first()

    if (!layout) {
      return new Response(JSON.stringify({
        success: false,
        error: '布局模板不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      ...layout,
      layout_config: JSON.parse(layout.layout_config)
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Failed to get layout:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function onRequestPut(context) {
  const { env, params, request } = context
  const { id } = params

  try {
    // 检查是否是默认布局
    const layout = await env.DB.prepare(`
      SELECT is_default FROM site_layouts WHERE id = ?
    `).bind(id).first()

    if (!layout) {
      return new Response(JSON.stringify({
        success: false,
        error: '布局模板不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (layout.is_default === 1) {
      return new Response(JSON.stringify({
        success: false,
        error: '默认布局模板不能修改'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()
    const { name, layoutConfig } = body

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

    // 确保 posts 或 content 模块存在
    const allModules = [...config.leftSidebar, ...config.main, ...config.rightSidebar]
    if (!allModules.includes('posts') && !allModules.includes('content')) {
      return new Response(JSON.stringify({
        success: false,
        error: '布局必须包含文章列表或文章内容模块'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const configJson = JSON.stringify(config)

    await env.DB.prepare(`
      UPDATE site_layouts
      SET name = ?, layout_config = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(name, configJson, id).run()

    // 清除缓存
    await clearLayoutCache(context)

    return new Response(JSON.stringify({
      success: true,
      message: '布局模板已更新'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Failed to update layout:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context
  const { id } = params

  try {
    // 检查是否是默认布局
    const layout = await env.DB.prepare(`
      SELECT is_default FROM site_layouts WHERE id = ?
    `).bind(id).first()

    if (!layout) {
      return new Response(JSON.stringify({
        success: false,
        error: '布局模板不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (layout.is_default === 1) {
      return new Response(JSON.stringify({
        success: false,
        error: '默认布局模板不能删除'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 检查是否有页面正在使用此布局
    const usage = await env.DB.prepare(`
      SELECT page_type FROM site_page_layouts WHERE layout_id = ?
    `).bind(id).all()

    if (usage.results && usage.results.length > 0) {
      const pages = usage.results.map(r => r.page_type).join(', ')
      return new Response(JSON.stringify({
        success: false,
        error: `此布局正在被以下页面使用: ${pages}，请先更换这些页面的布局`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    await env.DB.prepare(`
      DELETE FROM site_layouts WHERE id = ?
    `).bind(id).run()

    // 清除缓存
    await clearLayoutCache(context)

    return new Response(JSON.stringify({
      success: true,
      message: '布局模板已删除'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Failed to delete layout:', error)
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

    baseUrl.search = ''
    await cache.delete(baseUrl)

    for (const pageType of ['home', 'thread', 'category', 'tag']) {
      baseUrl.search = `page=${pageType}`
      await cache.delete(baseUrl)
    }
  } catch (error) {
    console.error('Failed to clear cache:', error)
  }
}
