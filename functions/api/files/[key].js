/**
 * 文件访问 API
 * GET /api/files/:key
 *
 * 支持：
 * - 文件下载
 * - 图片/视频预览
 * - 过期检查
 */

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const key = params.key;

  try {
    // 查询文件元数据
    const fileInfo = await env.DB.prepare(`
      SELECT *
      FROM files
      WHERE r2_key = ? AND purged = 0
      LIMIT 1
    `).bind(key).first();

    if (!fileInfo) {
      return new Response(JSON.stringify({ error: '文件不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查是否过期
    if (fileInfo.expires_at) {
      const now = new Date();
      const expiresAt = new Date(fileInfo.expires_at);

      if (now > expiresAt && !fileInfo.is_expired) {
        // 标记为过期
        await env.DB.prepare(`
          UPDATE files
          SET is_expired = 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(fileInfo.id).run();

        return new Response(JSON.stringify({ error: '文件已过期' }), {
          status: 410, // Gone
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (fileInfo.is_expired) {
        return new Response(JSON.stringify({ error: '文件已过期' }), {
          status: 410,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 从 R2 获取文件
    const object = await env.FILES.get(key);

    if (!object) {
      return new Response(JSON.stringify({ error: '文件不存在于存储中' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查是否为下载模式
    const isDownload = url.searchParams.get('download') === '1';

    // 设置响应头
    const headers = new Headers();
    headers.set('Content-Type', fileInfo.mime_type);
    headers.set('Content-Length', fileInfo.size.toString());
    headers.set('Cache-Control', 'public, max-age=31536000'); // 缓存 1 年

    if (isDownload) {
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.filename)}"`);
    } else {
      // 预览模式：对于图片和视频设置 inline
      if (fileInfo.is_image || fileInfo.is_video) {
        headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(fileInfo.filename)}"`);
      } else {
        headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.filename)}"`);
      }
    }

    // 支持 Range 请求（对视频很重要）
    const range = request.headers.get('Range');
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileInfo.size - 1;
      const chunkSize = (end - start) + 1;

      headers.set('Content-Range', `bytes ${start}-${end}/${fileInfo.size}`);
      headers.set('Content-Length', chunkSize.toString());
      headers.set('Accept-Ranges', 'bytes');

      return new Response(object.body, {
        status: 206, // Partial Content
        headers
      });
    }

    return new Response(object.body, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('文件访问错误:', error);
    return new Response(JSON.stringify({
      error: '文件访问失败',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
