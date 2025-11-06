/**
 * 文件上传 API
 * POST /api/admin/files/upload
 *
 * 支持：
 * - 多文件上传
 * - 文件夹路径
 * - 过期时间设置
 * - 自动识别图片/视频
 */

// 支持的图片类型
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

// 支持的视频类型
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

// 生成唯一的 R2 key
function generateR2Key(filename, path) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = filename.split('.').pop();
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;

  // 格式: path/filename_timestamp_random.ext
  const cleanPath = path === '/' ? '' : path.replace(/^\/|\/$/g, '');
  const key = cleanPath ? `${cleanPath}/${nameWithoutExt}_${timestamp}_${random}.${ext}` : `${nameWithoutExt}_${timestamp}_${random}.${ext}`;

  return key;
}

// 获取文件扩展名
function getExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 解析 multipart/form-data
    const formData = await request.formData();

    const files = formData.getAll('files'); // 支持多文件
    const path = formData.get('path') || '/'; // 文件夹路径
    const expiresIn = formData.get('expiresIn'); // 过期时间（秒）
    const uploadUser = formData.get('uploadUser') || 'admin';

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: '未选择文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 计算过期时间
    let expiresAt = null;
    if (expiresIn && parseInt(expiresIn) > 0) {
      const expiresDate = new Date();
      expiresDate.setSeconds(expiresDate.getSeconds() + parseInt(expiresIn));
      expiresAt = expiresDate.toISOString();
    }

    const uploadedFiles = [];
    const errors = [];

    // 处理每个文件
    for (const file of files) {
      if (!file || !file.name) {
        errors.push({ filename: 'unknown', error: '无效的文件' });
        continue;
      }

      try {
        const filename = file.name;
        const size = file.size;
        const mimeType = file.type || 'application/octet-stream';
        const extension = getExtension(filename);

        // 生成 R2 key
        const r2Key = generateR2Key(filename, path);

        // 上传到 R2
        await env.FILES.put(r2Key, file.stream(), {
          httpMetadata: {
            contentType: mimeType,
          },
          customMetadata: {
            originalFilename: filename,
            uploadedBy: uploadUser,
            uploadedAt: new Date().toISOString(),
          }
        });

        // 判断文件类型
        const isImage = IMAGE_TYPES.includes(mimeType) ? 1 : 0;
        const isVideo = VIDEO_TYPES.includes(mimeType) ? 1 : 0;

        // 保存元数据到数据库
        const result = await env.DB.prepare(`
          INSERT INTO files (
            filename, path, r2_key, size, mime_type, extension,
            is_image, is_video, upload_user, expires_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          filename, path, r2Key, size, mimeType, extension,
          isImage, isVideo, uploadUser, expiresAt
        ).run();

        uploadedFiles.push({
          id: result.meta.last_row_id,
          filename,
          path,
          r2Key,
          size,
          mimeType,
          isImage: Boolean(isImage),
          isVideo: Boolean(isVideo),
          expiresAt,
          url: `/api/files/${r2Key}` // 文件访问 URL
        });

      } catch (error) {
        console.error(`上传文件 ${file.name} 失败:`, error);
        errors.push({
          filename: file.name,
          error: error.message || '上传失败'
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      uploaded: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
      message: `成功上传 ${uploadedFiles.length} 个文件${errors.length > 0 ? `，${errors.length} 个失败` : ''}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('文件上传错误:', error);
    return new Response(JSON.stringify({
      error: '文件上传失败',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
