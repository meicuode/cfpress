/**
 * 布局配置 API
 * GET /api/layout - 获取布局配置（带2小时边缘缓存）
 * POST /api/layout - 保存布局配置（自动清除缓存）
 */

const CACHE_TTL = 7200 // 2小时缓存

// 默认布局配置
const DEFAULT_LAYOUT = {
  leftSidebar: ['profile', 'categories'],
  main: ['posts'],
  rightSidebar: []
}

export async function onRequestGet(context) {
  const { env, request } = context

  try {
    // 尝试从边缘缓存获取
    const cache = caches.default
    const cacheUrl = new URL(request.url)
    cacheUrl.search = '' // 忽略查询参数

    let response = await cache.match(cacheUrl)

    if (response) {
      console.log('Layout config served from cache')
      return response
    }

    // 从数据库获取
    const layoutConfig = await env.DB.prepare(`
      SELECT layout_config, updated_at
      FROM site_layouts WHERE id = 1
    `).first()

    let data
    if (layoutConfig) {
      data = {
        ...JSON.parse(layoutConfig.layout_config),
        updated_at: layoutConfig.updated_at
      }
    } else {
      data = {
        ...DEFAULT_LAYOUT,
        updated_at: new Date().toISOString()
      }
    }

    response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_TTL}`,
      }
    })

    // 存入边缘缓存
    context.waitUntil(cache.put(cacheUrl, response.clone()))

    return response

  } catch (error) {
    console.error('Failed to get layout:', error)

    // 出错时返回默认布局
    return new Response(JSON.stringify({
      ...DEFAULT_LAYOUT,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function onRequestPost(context) {
  const { env, request } = context

  try {
    const body = await request.json()
    const { leftSidebar, main, rightSidebar } = body

    // 验证布局数据
    if (!Array.isArray(leftSidebar) || !Array.isArray(main) || !Array.isArray(rightSidebar)) {
      return new Response(JSON.stringify({
        success: false,
        error: '布局数据格式错误'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 确保 posts 模块存在
    const allModules = [...leftSidebar, ...main, ...rightSidebar]
    if (!allModules.includes('posts')) {
      return new Response(JSON.stringify({
        success: false,
        error: '文章列表模块不能删除'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const layoutConfig = JSON.stringify({ leftSidebar, main, rightSidebar })

    // UPSERT 到数据库
    await env.DB.prepare(`
      INSERT INTO site_layouts (id, page_key, layout_config, updated_at)
      VALUES (1, 'home', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        layout_config = excluded.layout_config,
        updated_at = CURRENT_TIMESTAMP
    `).bind(layoutConfig).run()

    // 清除边缘缓存
    const cache = caches.default
    const cacheUrl = new URL(request.url)
    cacheUrl.search = ''
    await cache.delete(cacheUrl)

    console.log('Layout config saved and cache cleared')

    return new Response(JSON.stringify({
      success: true,
      message: '布局已保存'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Failed to save layout:', error)

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
