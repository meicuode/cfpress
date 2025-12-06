/**
 * 主题配置 API
 * 支持 D1 数据库存储和 2 小时边缘缓存
 *
 * GET /api/theme - 获取当前主题配置
 * POST /api/theme - 更新主题配置（自动刷新缓存）
 */

const CACHE_KEY = 'theme_config'
const CACHE_TTL = 7200 // 2 小时（秒）

/**
 * GET - 获取主题配置
 * 优先从边缘缓存读取，缓存未命中则从 D1 读取
 */
export async function onRequestGet(context) {
  const { env, request } = context

  try {
    const cache = caches.default
    const cacheUrl = new URL(request.url)

    // 尝试从缓存获取
    let response = await cache.match(cacheUrl)

    if (!response) {
      // 缓存未命中，从数据库读取
      const themeConfig = await env.DB.prepare(`
        SELECT theme_name, custom_colors, updated_at
        FROM site_themes
        WHERE id = 1
      `).first()

      const data = themeConfig ? {
        theme_name: themeConfig.theme_name,
        custom_colors: themeConfig.custom_colors ? JSON.parse(themeConfig.custom_colors) : null,
        updated_at: themeConfig.updated_at
      } : {
        theme_name: 'dark',
        custom_colors: null,
        updated_at: new Date().toISOString()
      }

      response = new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${CACHE_TTL}`, // 2 小时缓存
        }
      })

      // 写入缓存
      context.waitUntil(cache.put(cacheUrl, response.clone()))
    }

    return response
  } catch (error) {
    console.error('Failed to get theme:', error)
    return new Response(JSON.stringify({
      error: 'Failed to load theme',
      theme_name: 'dark',
      custom_colors: null
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/**
 * POST - 更新主题配置
 * 保存到 D1 数据库并自动清除缓存
 */
export async function onRequestPost(context) {
  const { env, request } = context

  try {
    const body = await request.json()
    const { theme_name, custom_colors } = body

    // 验证参数
    if (!theme_name) {
      return new Response(JSON.stringify({
        error: 'theme_name is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 序列化自定义颜色
    const customColorsJson = custom_colors ? JSON.stringify(custom_colors) : null

    // 保存到数据库（UPSERT）
    await env.DB.prepare(`
      INSERT INTO site_themes (id, theme_name, custom_colors, updated_at)
      VALUES (1, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        theme_name = excluded.theme_name,
        custom_colors = excluded.custom_colors,
        updated_at = CURRENT_TIMESTAMP
    `).bind(theme_name, customColorsJson).run()

    // 清除缓存
    const cache = caches.default
    const cacheUrl = new URL(request.url)
    // 删除 GET 请求的缓存（需要构造相同的 URL）
    const getCacheUrl = new URL(cacheUrl.origin + cacheUrl.pathname)
    await cache.delete(getCacheUrl)

    return new Response(JSON.stringify({
      success: true,
      theme_name,
      custom_colors,
      message: 'Theme updated successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Failed to update theme:', error)
    return new Response(JSON.stringify({
      error: 'Failed to update theme',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
