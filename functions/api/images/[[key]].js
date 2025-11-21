/**
 * 图片动态处理 API
 * GET /api/images/:key?width=800&height=600&quality=85&format=webp
 *
 * 支持参数：
 * - width: 宽度
 * - height: 高度
 * - quality: 质量 (1-100)
 * - format: 输出格式 (webp, jpeg, png)
 * - fit: 适配模式 (cover, contain, fill)
 *
 * 示例：
 * /api/images/myimage.jpg?width=800&quality=90&format=webp
 */

import { generateThumbnail } from '../../utils/image-processor.js';

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);

  // 从 URL 路径中提取 key
  const pathParts = url.pathname.split('/api/images/')[1];
  const key = pathParts || params.key;

  // 解析参数
  const width = parseInt(url.searchParams.get('width')) || null;
  const height = parseInt(url.searchParams.get('height')) || null;
  const quality = parseInt(url.searchParams.get('quality')) || 85;
  const format = url.searchParams.get('format') || 'webp';
  const fit = url.searchParams.get('fit') || 'cover';

  try {
    console.log(`图片处理请求: key=${key}, width=${width}, height=${height}, quality=${quality}, format=${format}`);

    // 从 R2 获取原始图片
    const object = await env.FILES.get(key);

    if (!object) {
      return new Response(JSON.stringify({ error: '图片不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const originalMimeType = object.httpMetadata?.contentType || 'image/jpeg';

    // 如果是 SVG，直接返回，不处理
    if (originalMimeType === 'image/svg+xml') {
      return new Response(object.body, {
        status: 200,
        headers: {
          'Content-Type': originalMimeType,
          'Cache-Control': 'public, max-age=31536000',
        }
      });
    }

    // 如果没有指定尺寸参数，直接返回原图
    if (!width && !height) {
      return new Response(object.body, {
        status: 200,
        headers: {
          'Content-Type': originalMimeType,
          'Cache-Control': 'public, max-age=31536000',
        }
      });
    }

    // 读取图片数据
    const imageBuffer = await object.arrayBuffer();

    // 生成处理后的图片
    const maxWidth = width || 9999;
    const maxHeight = height || 9999;
    const qualityDecimal = Math.min(Math.max(quality, 1), 100) / 100;

    const processed = await generateThumbnail(
      imageBuffer,
      originalMimeType,
      maxWidth,
      maxHeight,
      qualityDecimal
    );

    if (!processed) {
      // 处理失败，返回原图
      return new Response(object.body, {
        status: 200,
        headers: {
          'Content-Type': originalMimeType,
          'Cache-Control': 'public, max-age=31536000',
        }
      });
    }

    // 设置输出格式
    let outputMimeType = 'image/webp';
    if (format === 'jpeg' || format === 'jpg') {
      outputMimeType = 'image/jpeg';
    } else if (format === 'png') {
      outputMimeType = 'image/png';
    }

    // 返回处理后的图片
    return new Response(processed.buffer, {
      status: 200,
      headers: {
        'Content-Type': processed.mimeType || outputMimeType,
        'Cache-Control': 'public, max-age=2592000', // 缓存 30 天
        'X-Image-Width': processed.width.toString(),
        'X-Image-Height': processed.height.toString(),
      }
    });

  } catch (error) {
    console.error('图片处理错误:', error);
    return new Response(JSON.stringify({
      error: '图片处理失败',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
