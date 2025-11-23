/**
 * 生成 robots.txt
 * GET /robots.txt
 */

export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    // 获取站点 URL
    const { results: settings } = await env.DB.prepare(`
      SELECT value FROM settings WHERE key = 'site_url'
    `).all();

    const url = new URL(request.url);
    const baseUrl = settings[0]?.value || `${url.protocol}//${url.host}`;

    const robotsTxt = `# robots.txt for ${baseUrl}

User-agent: *
Allow: /

# 禁止抓取 API 端点
Disallow: /api/

# Sitemap 位置
Sitemap: ${baseUrl}/api/sitemap.xml
`;

    return new Response(robotsTxt, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400', // 缓存 24 小时
      },
    });
  } catch (error) {
    console.error('Error generating robots.txt:', error);

    // 如果出错，返回基本的 robots.txt
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    return new Response(
      `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${baseUrl}/api/sitemap.xml`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }
    );
  }
}
