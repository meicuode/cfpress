/**
 * Site Icon API - 返回站点图标
 * GET /api/site-icon?v={version} - 根据设置返回站点图标，如果没有设置则返回默认的vite.svg
 * version 参数用于浏览器缓存控制
 */

export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    // 检查是否有版本号参数
    const url = new URL(request.url);
    const hasVersion = url.searchParams.has('v');

    // 获取站点图标设置
    const { results } = await env.DB.prepare(`
      SELECT value
      FROM settings
      WHERE key = 'site_icon'
    `).all();

    let iconUrl = '/vite.svg'; // 默认图标

    if (results.length > 0 && results[0].value) {
      const siteIcon = results[0].value;

      // 只有当是图片URL时才使用（不是emoji）
      if (siteIcon.startsWith('http') || siteIcon.startsWith('/')) {
        iconUrl = siteIcon;
      }
    }

    console.log('Site icon URL:', iconUrl);

    // 根据是否有版本号参数，设置不同的缓存策略
    const cacheControl = hasVersion
      ? 'public, max-age=31536000, immutable' // 带版本号：1年缓存，immutable
      : 'public, max-age=3600'; // 不带版本号：1小时缓存

    // 如果是外部URL（http/https），重定向到该URL
    if (iconUrl.startsWith('http')) {
      return Response.redirect(iconUrl, 302);
    }

    // 如果是 /api/files/ 开头的URL，需要从R2获取文件
    if (iconUrl.startsWith('/api/files/')) {
      const r2Key = iconUrl.replace('/api/files/', '');
      console.log('Fetching from R2:', r2Key);

      // 从数据库获取文件信息
      const { results: fileResults } = await env.DB.prepare(`
        SELECT * FROM files WHERE r2_key = ?
      `).bind(r2Key).all();

      if (fileResults.length === 0) {
        console.log('File not found in database:', r2Key);
        // 文件不存在，返回默认图标
        const fallbackResponse = await fetch(new URL('/vite.svg', request.url));
        return new Response(fallbackResponse.body, {
          status: fallbackResponse.status,
          statusText: fallbackResponse.statusText,
          headers: {
            ...Object.fromEntries(fallbackResponse.headers),
            'Cache-Control': cacheControl,
          },
        });
      }

      const fileRecord = fileResults[0];

      // 从 R2 获取文件
      const r2Object = await env.FILES.get(r2Key);

      if (!r2Object) {
        console.log('File not found in R2:', r2Key);
        // R2中文件不存在，返回默认图标
        const fallbackResponse = await fetch(new URL('/vite.svg', request.url));
        return new Response(fallbackResponse.body, {
          status: fallbackResponse.status,
          statusText: fallbackResponse.statusText,
          headers: {
            ...Object.fromEntries(fallbackResponse.headers),
            'Cache-Control': cacheControl,
          },
        });
      }

      // 返回文件内容
      return new Response(r2Object.body, {
        headers: {
          'Content-Type': fileRecord.mime_type || 'application/octet-stream',
          'Content-Length': fileRecord.size.toString(),
          'Cache-Control': cacheControl,
        },
      });
    }

    // 其他情况（如 /vite.svg），获取文件并返回
    const response = await fetch(new URL(iconUrl, request.url));

    // 复制响应，添加缓存头
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        'Cache-Control': cacheControl,
      },
    });

  } catch (error) {
    console.error('Error fetching site icon:', error);

    // 出错时返回默认图标
    const response = await fetch(new URL('/vite.svg', request.url));
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        'Cache-Control': 'public, max-age=3600', // 出错时使用短期缓存
      },
    });
  }
}
