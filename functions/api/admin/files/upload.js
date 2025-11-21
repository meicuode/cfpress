/**
 * 文件上传 API
 * POST /api/admin/files/upload
 *
 * 支持：
 * - 多文件上传
 * - 文件夹路径
 * - 过期时间设置
 * - 自动识别图片/视频
 * - 图片自动生成缩略图
 */

import {
  getImageDimensions,
  generateThumbnail,
  THUMBNAIL_SIZES
} from '../../../utils/image-processor.js';

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

  // 清理文件名：移除或替换特殊字符
  // 允许：字母、数字、中文、连字符、下划线
  // 替换其他字符为下划线
  const cleanName = nameWithoutExt
    .replace(/[\s\(\)（）\[\]【】\{\}｛｝<>《》]/g, '_') // 替换空格和各种括号为下划线
    .replace(/[^\w\u4e00-\u9fa5\-_]/g, '') // 移除其他特殊字符，保留字母数字中文连字符下划线
    .replace(/_+/g, '_') // 多个连续下划线替换为单个
    .replace(/^_|_$/g, ''); // 移除首尾下划线

  // 格式: path/cleanname_timestamp_random.ext
  const cleanPath = path === '/' ? '' : path.replace(/^\/|\/$/g, '');
  const key = cleanPath ? `${cleanPath}/${cleanName}_${timestamp}_${random}.${ext}` : `${cleanName}_${timestamp}_${random}.${ext}`;

  return key;
}

// 确保缩略图文件夹存在
async function ensureThumbnailFolders(env) {
  const folders = [
    { name: 'thumbnails', path: '/thumbnails', parent_path: '/' },
    { name: 'thumb', path: '/thumbnails/thumb', parent_path: '/thumbnails' },
    { name: 'medium', path: '/thumbnails/medium', parent_path: '/thumbnails' }
  ];

  for (const folder of folders) {
    // 检查文件夹是否存在
    const existing = await env.DB.prepare(
      'SELECT id FROM folders WHERE path = ?'
    ).bind(folder.path).first();

    if (!existing) {
      await env.DB.prepare(`
        INSERT INTO folders (name, path, parent_path)
        VALUES (?, ?, ?)
      `).bind(folder.name, folder.path, folder.parent_path).run();
      console.log(`创建文件夹: ${folder.path}`);
    }
  }
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
    const rawPath = formData.get('path'); // 原始路径
    const path = rawPath || '/'; // 文件夹路径
    const expiresIn = formData.get('expiresIn'); // 过期时间（秒）
    const uploadUser = formData.get('uploadUser') || 'admin';

    console.log(`📁 上传请求 - 原始path参数: "${rawPath}", 处理后path: "${path}"`);

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

    // 确保目标路径在 folders 表中存在
    if (path && path !== '/') {
      try {
        const { results: existingFolder } = await env.DB.prepare(
          'SELECT id FROM folders WHERE path = ?'
        ).bind(path).all();

        if (existingFolder.length === 0) {
          // 自动创建文件夹
          const folderName = path.split('/').filter(Boolean).pop() || 'folder';
          const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';

          await env.DB.prepare(`
            INSERT INTO folders (name, path, parent_path)
            VALUES (?, ?, ?)
          `).bind(folderName, path, parentPath).run();

          console.log(`✅ 自动创建文件夹: ${path}`);
        }
      } catch (error) {
        console.error('创建文件夹失败:', error);
        // 继续上传，不阻塞
      }
    }

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

        // 将文件转换为 ArrayBuffer 以确保完整上传
        const fileBuffer = await file.arrayBuffer();

        // 上传到 R2
        await env.FILES.put(r2Key, fileBuffer, {
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

        // 图片处理：获取尺寸和生成缩略图
        let width = null;
        let height = null;
        let thumbnailR2Key = null;
        let mediumR2Key = null;
        let hasThumbnails = 0;

        if (isImage && mimeType !== 'image/svg+xml') {
          try {
            // 获取图片尺寸
            const dimensions = await getImageDimensions(fileBuffer, mimeType);
            width = dimensions.width;
            height = dimensions.height;

            console.log(`图片尺寸: ${width}x${height}`);

            // 生成缩略图 (300x300)
            const thumbnail = await generateThumbnail(
              fileBuffer,
              mimeType,
              THUMBNAIL_SIZES.thumbnail.maxWidth,
              THUMBNAIL_SIZES.thumbnail.maxHeight,
              THUMBNAIL_SIZES.thumbnail.quality
            );

            if (thumbnail) {
              // 如果尺寸读取失败，使用 Photon 返回的原始尺寸
              if (width === 0 || height === 0) {
                width = thumbnail.originalWidth;
                height = thumbnail.originalHeight;
                console.log(`从 Photon 获取的原始尺寸: ${width}x${height}`);
              }

              // 确保缩略图文件夹存在
              await ensureThumbnailFolders(env);

              // 保存到 thumbnails/thumb/ 文件夹
              const baseFilename = r2Key.split('/').pop().replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
              const thumbFilename = `${baseFilename}.webp`;
              thumbnailR2Key = `thumbnails/thumb/${thumbFilename}`;
              await env.FILES.put(thumbnailR2Key, thumbnail.buffer, {
                httpMetadata: { contentType: thumbnail.mimeType }
              });
              console.log(`缩略图已生成: ${thumbnailR2Key}`);

              // 为缩略图创建文件记录
              await env.DB.prepare(`
                INSERT INTO files (
                  filename, path, r2_key, size, mime_type, extension,
                  is_image, is_video, upload_user, width, height
                ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?)
              `).bind(
                thumbFilename, '/thumbnails/thumb', thumbnailR2Key,
                thumbnail.buffer.byteLength, thumbnail.mimeType, 'webp',
                uploadUser, thumbnail.width, thumbnail.height
              ).run();
            }

            // 生成中等尺寸 (800x800)
            const medium = await generateThumbnail(
              fileBuffer,
              mimeType,
              THUMBNAIL_SIZES.medium.maxWidth,
              THUMBNAIL_SIZES.medium.maxHeight,
              THUMBNAIL_SIZES.medium.quality
            );

            if (medium) {
              // 如果第一次缩略图失败，尝试从中等尺寸获取原始尺寸
              if (width === 0 || height === 0) {
                width = medium.originalWidth;
                height = medium.originalHeight;
                console.log(`从 Photon 获取的原始尺寸: ${width}x${height}`);
              }

              // 保存到 thumbnails/medium/ 文件夹
              const baseFilename = r2Key.split('/').pop().replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
              const mediumFilename = `${baseFilename}.webp`;
              mediumR2Key = `thumbnails/medium/${mediumFilename}`;
              await env.FILES.put(mediumR2Key, medium.buffer, {
                httpMetadata: { contentType: medium.mimeType }
              });
              console.log(`中等尺寸已生成: ${mediumR2Key}`);

              // 为中等尺寸创建文件记录
              await env.DB.prepare(`
                INSERT INTO files (
                  filename, path, r2_key, size, mime_type, extension,
                  is_image, is_video, upload_user, width, height
                ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?)
              `).bind(
                mediumFilename, '/thumbnails/medium', mediumR2Key,
                medium.buffer.byteLength, medium.mimeType, 'webp',
                uploadUser, medium.width, medium.height
              ).run();
            }

            hasThumbnails = (thumbnail || medium) ? 1 : 0;
          } catch (imgError) {
            console.error('图片处理失败:', imgError);
            // 继续上传，不阻塞
          }
        }

        // 保存元数据到数据库
        console.log(`准备保存文件元数据到数据库: ${filename}, size: ${size}, r2Key: ${r2Key}`);

        const result = await env.DB.prepare(`
          INSERT INTO files (
            filename, path, r2_key, size, mime_type, extension,
            is_image, is_video, upload_user, expires_at,
            width, height, thumbnail_r2_key, medium_r2_key, has_thumbnails
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          filename, path, r2Key, size, mimeType, extension,
          isImage, isVideo, uploadUser, expiresAt,
          width, height, thumbnailR2Key, mediumR2Key, hasThumbnails
        ).run();

        console.log(`数据库插入结果:`, result);
        console.log(`插入的文件ID: ${result.meta.last_row_id}`);

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
          url: `/api/files/${r2Key}`, // 文件访问 URL
          thumbnailUrl: thumbnailR2Key ? `/api/files/${thumbnailR2Key}` : null,
          mediumUrl: mediumR2Key ? `/api/files/${mediumR2Key}` : null,
          width,
          height
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
