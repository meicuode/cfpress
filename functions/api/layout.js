/**
 * 布局配置 API
 *
 * GET /api/layout - 获取所有页面的布局配置（前端用）
 * GET /api/layout?page=home - 获取特定页面的布局配置
 *
 * 管理接口见 /api/admin/layouts.js
 */

const CACHE_TTL = 7200 // 2小时缓存

// 默认布局配置
const DEFAULT_LAYOUTS = {
  home: {
    leftSidebar: ['profile', 'categories'],
    main: ['posts'],
    rightSidebar: []
  },
  thread: {
    leftSidebar: ['profile', 'categories'],
    main: ['content', 'comments'],
    rightSidebar: ['toc', 'recentPosts']
  }
}

export async function onRequestGet(context) {
  const { env, request } = context

  try {
    const url = new URL(request.url)
    const pageType = url.searchParams.get('page')

    // 尝试从边缘缓存获取
    const cache = caches.default
    const cacheKey = new URL(request.url)
    cacheKey.search = pageType ? `page=${pageType}` : ''

    let response = await cache.match(cacheKey)

    if (response) {
      console.log('Layout config served from cache')
      return response
    }

    let data

    if (pageType) {
      // 获取特定页面的布局
      const result = await env.DB.prepare(`
        SELECT sl.id, sl.name, sl.layout_config
        FROM site_page_layouts spl
        JOIN site_layouts sl ON spl.layout_id = sl.id
        WHERE spl.page_type = ?
      `).bind(pageType).first()

      if (result) {
        data = {
          pageType,
          layoutId: result.id,
          layoutName: result.name,
          ...JSON.parse(result.layout_config)
        }
      } else {
        // 返回默认布局
        data = {
          pageType,
          layoutId: null,
          layoutName: '默认布局',
          ...(DEFAULT_LAYOUTS[pageType] || DEFAULT_LAYOUTS.home)
        }
      }
    } else {
      // 获取所有页面的布局配置
      const results = await env.DB.prepare(`
        SELECT spl.page_type, sl.id as layout_id, sl.name, sl.layout_config
        FROM site_page_layouts spl
        JOIN site_layouts sl ON spl.layout_id = sl.id
      `).all()

      data = {}

      // 先设置默认值
      for (const [key, value] of Object.entries(DEFAULT_LAYOUTS)) {
        data[key] = {
          layoutId: null,
          layoutName: '默认布局',
          ...value
        }
      }

      // 覆盖数据库中的配置
      if (results.results) {
        for (const row of results.results) {
          data[row.page_type] = {
            layoutId: row.layout_id,
            layoutName: row.name,
            ...JSON.parse(row.layout_config)
          }
        }
      }
    }

    response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_TTL}`,
      }
    })

    // 存入边缘缓存
    context.waitUntil(cache.put(cacheKey, response.clone()))

    return response

  } catch (error) {
    console.error('Failed to get layout:', error)

    // 出错时返回默认布局
    return new Response(JSON.stringify(DEFAULT_LAYOUTS), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
