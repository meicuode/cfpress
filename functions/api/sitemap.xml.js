/**
 * 动态生成 sitemap.xml
 * GET /api/sitemap.xml
 */

export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    // 获取站点设置
    const { results: settings } = await env.DB.prepare(`
      SELECT key, value FROM settings WHERE key IN ('site_url', 'site_name')
    `).all();

    const settingsMap = {};
    settings.forEach(s => settingsMap[s.key] = s.value);

    // 从请求中获取基础 URL
    const url = new URL(request.url);
    const baseUrl = settingsMap.site_url || `${url.protocol}//${url.host}`;

    // 获取所有已发布的文章
    const { results: threads } = await env.DB.prepare(`
      SELECT id, slug, updated_at, created_at
      FROM threads
      WHERE status = 'publish'
      ORDER BY created_at DESC
    `).all();

    // 获取所有分类
    const { results: categories } = await env.DB.prepare(`
      SELECT id, slug, updated_at FROM categories
    `).all();

    // 获取所有标签
    const { results: tags } = await env.DB.prepare(`
      SELECT id, slug, name FROM tags WHERE thread_count > 0
    `).all();

    // 生成 sitemap XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 首页 -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- 关于页面 -->
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- 友情链接页面 -->
  <url>
    <loc>${baseUrl}/friends</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- 分类归档页面 -->
  <url>
    <loc>${baseUrl}/category</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;

    // 添加文章
    for (const thread of threads) {
      const lastmod = thread.updated_at || thread.created_at;
      xml += `
  <url>
    <loc>${baseUrl}/thread/${thread.id}</loc>
    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
    }

    // 添加分类页面
    for (const category of categories) {
      xml += `
  <url>
    <loc>${baseUrl}/category/${category.slug || category.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    // 添加标签页面
    for (const tag of tags) {
      xml += `
  <url>
    <loc>${baseUrl}/tag/${encodeURIComponent(tag.name)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }

    xml += `
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // 缓存 1 小时
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
      {
        status: 500,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }
}
