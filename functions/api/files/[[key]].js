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

  // 从 URL 路径中提取完整的 key（支持多级路径如 /api/files/cfpress/abc.png）
  // URL pathname 格式：/api/files/xxx 或 /api/files/cfpress/xxx
  const pathParts = url.pathname.split('/api/files/')[1];
  const key = pathParts || params.key;

  try {
    console.log(`获取文件: key=${key}`);

    // 查询文件元数据
    const fileInfo = await env.DB.prepare(`
      SELECT *
      FROM files
      WHERE r2_key = ? AND purged = 0
      LIMIT 1
    `).bind(key).first();

    console.log(`数据库查询结果:`, fileInfo);

    // 如果数据库中没有记录，尝试直接从 R2 获取
    if (!fileInfo) {
      console.log(`数据库中找不到文件记录，尝试直接从 R2 获取: ${key}`);

      const object = await env.FILES.get(key);
      if (!object) {
        return new Response(JSON.stringify({ error: '文件不存在' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 直接返回 R2 中的文件，使用 R2 对象的元数据
      const headers = new Headers();
      headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
      headers.set('Content-Length', object.size.toString());
      headers.set('Cache-Control', 'public, max-age=31536000');

      return new Response(object.body, {
        status: 200,
        headers
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
    console.log(`从 R2 获取文件: ${key}`);
    const object = await env.FILES.get(key);

    if (!object) {
      console.log(`文件不存在于 R2: ${key}`);
      return new Response(JSON.stringify({ error: '文件不存在于存储中' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`R2 对象获取成功, size: ${object.size}, httpMetadata:`, object.httpMetadata);
    console.log(`数据库记录 size: ${fileInfo.size}, R2实际 size: ${object.size}`);

    if (object.size !== fileInfo.size) {
      console.warn(`⚠️ 文件大小不匹配！数据库: ${fileInfo.size}, R2: ${object.size}`);
    }

    // 检查是否为下载模式
    const isDownload = url.searchParams.get('download') === '1';

    // 设置响应头
    const headers = new Headers();
    headers.set('Content-Type', fileInfo.mime_type);
    headers.set('Content-Length', fileInfo.size.toString());
    headers.set('Cache-Control', 'public, max-age=31536000'); // 缓存 1 年

    console.log(`响应头: Content-Type=${fileInfo.mime_type}, Content-Length=${fileInfo.size}`);

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
