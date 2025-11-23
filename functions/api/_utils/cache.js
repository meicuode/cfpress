/**
 * 缓存管理工具
 * 用于管理边缘缓存的创建和清除
 */

// 默认缓存时间（30分钟）
export const DEFAULT_CACHE_TTL = 1800;

/**
 * 检测是否为本地开发环境
 * 本地开发环境的 Cache API 行为不一致，建议禁用缓存
 * @param {Request} request - 请求对象
 * @returns {boolean} - 是否为本地开发环境
 */
function isLocalDev(request) {
  const url = new URL(request.url);
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
}

// 缓存分组配置
const CACHE_GROUPS = {
  // SEO 相关缓存
  seo: ['/api/feed.xml', '/api/sitemap.xml'],
  // 导航菜单缓存
  navigation: ['/api/navigation'],
  // 分类缓存
  categories: ['/api/categories'],
  // 标签缓存
  tags: ['/api/tags'],
};

/**
 * 清除指定分组的缓存
 * @param {Request} request - 原始请求，用于获取域名
 * @param {ExecutionContext} ctx - 执行上下文，用于 waitUntil
 * @param {string|string[]} groups - 要清除的缓存分组名称
 */
export async function purgeCacheByGroup(request, ctx, groups) {
  const groupList = Array.isArray(groups) ? groups : [groups];
  const paths = [];

  for (const group of groupList) {
    if (CACHE_GROUPS[group]) {
      paths.push(...CACHE_GROUPS[group]);
    }
  }

  if (paths.length > 0) {
    await purgeCacheByPaths(request, ctx, paths);
  }
}

/**
 * 清除指定路径的缓存
 * @param {Request} request - 原始请求，用于获取域名
 * @param {ExecutionContext} ctx - 执行上下文，用于 waitUntil
 * @param {string[]} paths - 要清除的缓存路径列表
 */
export async function purgeCacheByPaths(request, ctx, paths) {
  const cache = caches.default;
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const purgePromises = paths.map(async (path) => {
    const cacheUrl = `${baseUrl}${path}`;
    const cacheKey = new Request(cacheUrl);
    try {
      const deleted = await cache.delete(cacheKey);
      console.log(`Cache purge ${path}: ${deleted ? 'success' : 'not found'}`);
      return deleted;
    } catch (error) {
      console.error(`Cache purge error for ${path}:`, error);
      return false;
    }
  });

  // 使用 waitUntil 确保缓存清除完成但不阻塞响应
  if (ctx && ctx.waitUntil) {
    ctx.waitUntil(Promise.all(purgePromises));
  } else {
    await Promise.all(purgePromises);
  }
}

/**
 * 清除 SEO 相关缓存（RSS Feed、Sitemap）
 * @param {Request} request - 原始请求，用于获取域名
 * @param {ExecutionContext} ctx - 执行上下文，用于 waitUntil
 */
export async function purgeSeoCaches(request, ctx) {
  await purgeCacheByGroup(request, ctx, 'seo');
}

/**
 * 清除导航菜单缓存
 * @param {Request} request - 原始请求，用于获取域名
 * @param {ExecutionContext} ctx - 执行上下文，用于 waitUntil
 */
export async function purgeNavigationCache(request, ctx) {
  await purgeCacheByGroup(request, ctx, 'navigation');
}

/**
 * 清除分类缓存
 * @param {Request} request - 原始请求，用于获取域名
 * @param {ExecutionContext} ctx - 执行上下文，用于 waitUntil
 */
export async function purgeCategoriesCache(request, ctx) {
  await purgeCacheByGroup(request, ctx, 'categories');
}

/**
 * 清除标签缓存
 * @param {Request} request - 原始请求，用于获取域名
 * @param {ExecutionContext} ctx - 执行上下文，用于 waitUntil
 */
export async function purgeTagsCache(request, ctx) {
  await purgeCacheByGroup(request, ctx, 'tags');
}

/**
 * 包装函数：为 GET 请求添加边缘缓存
 * @param {Function} handler - 原始处理函数，返回 Response
 * @param {Object} options - 配置选项
 * @param {number} options.ttl - 缓存时间（秒），默认 30 分钟
 * @returns {Function} - 包装后的处理函数
 */
export function withCache(handler, options = {}) {
  const ttl = options.ttl || DEFAULT_CACHE_TTL;

  return async function (context) {
    const { request } = context;

    // 本地开发环境禁用缓存，因为 wrangler dev 的 Cache API 行为不一致
    if (isLocalDev(request)) {
      return await handler(context);
    }

    // 创建缓存 key（使用规范化的 URL）
    const cacheUrl = new URL(request.url);
    cacheUrl.search = ''; // 忽略查询参数（如果需要包含参数，可以移除这行）
    const cacheKey = new Request(cacheUrl.toString(), request);

    // 尝试从缓存获取
    const cache = caches.default;
    let response = await cache.match(cacheKey);

    if (response) {
      // 缓存命中，直接返回
      return response;
    }

    // 缓存未命中，执行原始处理函数
    response = await handler(context);

    // 只缓存成功的响应
    if (response.ok) {
      // 克隆响应并添加缓存头
      const responseToCache = new Response(response.body, response);
      responseToCache.headers.set('Cache-Control', `public, max-age=${ttl}`);

      // 存入缓存（不阻塞响应）
      context.waitUntil(cache.put(cacheKey, responseToCache.clone()));

      return responseToCache;
    }

    return response;
  };
}

/**
 * 清除特定 URL 的缓存
 * @param {string} url - 要清除缓存的完整 URL
 */
export async function purgeCacheByUrl(url) {
  const cache = caches.default;
  const cacheKey = new Request(url);
  try {
    return await cache.delete(cacheKey);
  } catch (error) {
    console.error(`Cache purge error for ${url}:`, error);
    return false;
  }
}
