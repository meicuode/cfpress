/**
 * 生成 RSS 2.0 Feed
 * GET /api/feed.xml
 *
 * 使用 Cloudflare Cache API 在边缘节点缓存 30 分钟
 */

import { withCache, DEFAULT_CACHE_TTL } from './_utils/cache.js';

/**
 * 原始处理函数
 */
async function handleGet(context) {
  const { env, request } = context;

  try {
    const xml = await generateRssFeed(env, request);
    return new Response(xml, {
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return generateErrorFeed(request);
  }
}

// 使用 withCache 包装，自动处理本地环境跳过缓存
export const onRequestGet = withCache(handleGet, { ttl: DEFAULT_CACHE_TTL });

/**
 * 生成 RSS Feed XML
 */
async function generateRssFeed(env, request) {
  // 获取站点设置
  const { results: settings } = await env.DB.prepare(`
    SELECT key, value FROM settings
    WHERE key IN ('site_url', 'site_name', 'site_description', 'author_name')
  `).all();

  const settingsMap = {};
  settings.forEach(s => settingsMap[s.key] = s.value);

  // 从请求中获取基础 URL
  const url = new URL(request.url);
  const baseUrl = settingsMap.site_url || `${url.protocol}//${url.host}`;
  const siteName = settingsMap.site_name || 'My Blog';
  const siteDescription = settingsMap.site_description || '个人博客';
  const authorName = settingsMap.author_name || 'Admin';

  // 获取最新的 20 篇已发布文章
  const { results: threads } = await env.DB.prepare(`
    SELECT
      t.id,
      t.title,
      t.content,
      t.excerpt,
      t.created_at,
      t.updated_at,
      u.display_name as author_name
    FROM threads t
    LEFT JOIN users u ON t.author_id = u.id
    WHERE t.status = 'publish'
    ORDER BY t.created_at DESC
    LIMIT 20
  `).all();

  // 获取最新文章的发布时间作为 lastBuildDate
  const lastBuildDate = threads.length > 0
    ? toRFC822(threads[0].created_at)
    : toRFC822(new Date());

  // 生成 RSS XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/api/feed.xml" rel="self" type="application/rss+xml"/>
    <generator>CFBlog RSS Generator</generator>
`;

  // 添加文章
  for (const thread of threads) {
    const articleUrl = `${baseUrl}/thread/${thread.id}`;
    const pubDate = toRFC822(thread.created_at);
    const author = thread.author_name || authorName;
    const description = getExcerpt(thread);

    xml += `
    <item>
      <title>${escapeXml(thread.title)}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(author)}</author>
      <description>${escapeXml(description)}</description>
    </item>`;
  }

  xml += `
  </channel>
</rss>`;

  return xml;
}

/**
 * 生成错误时的空 Feed
 */
function generateErrorFeed(request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog</title>
    <link>${baseUrl}</link>
    <description>RSS Feed</description>
  </channel>
</rss>`,
    {
      status: 500,
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
    }
  );
}

// 工具函数

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function getExcerpt(thread) {
  if (thread.excerpt) return stripHtml(thread.excerpt);
  return stripHtml(thread.content).substring(0, 300) + '...';
}

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toRFC822(dateStr) {
  const date = new Date(dateStr);
  return date.toUTCString();
}
