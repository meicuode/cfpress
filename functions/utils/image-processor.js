/**
 * 图片处理工具函数 - 使用 Photon WASM
 * 适用于 Cloudflare Workers 环境
 */

import * as photon from '@cf-wasm/photon';

/**
 * 从图片文件中提取基本尺寸信息
 * 通过解析图片头部字节获取宽高
 * @param {ArrayBuffer} imageBuffer
 * @param {string} mimeType
 * @returns {Promise<{width: number, height: number}>}
 */
export async function getImageDimensions(imageBuffer, mimeType) {
  try {
    const buffer = new Uint8Array(imageBuffer);

    // JPEG 格式
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      return getJPEGDimensions(buffer);
    }

    // PNG 格式
    if (mimeType === 'image/png') {
      return getPNGDimensions(buffer);
    }

    // GIF 格式
    if (mimeType === 'image/gif') {
      return getGIFDimensions(buffer);
    }

    // WebP 格式
    if (mimeType === 'image/webp') {
      return getWebPDimensions(buffer);
    }

    // 其他格式返回0
    return { width: 0, height: 0 };
  } catch (error) {
    console.error('获取图片尺寸失败:', error);
    return { width: 0, height: 0 };
  }
}

/**
 * 获取 JPEG 图片尺寸
 */
function getJPEGDimensions(buffer) {
  let i = 0;

  if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
    return { width: 0, height: 0 };
  }

  i = 2;
  while (i < buffer.length) {
    if (buffer[i] !== 0xFF) {
      return { width: 0, height: 0 };
    }

    const marker = buffer[i + 1];
    i += 2;

    if ((marker >= 0xC0 && marker <= 0xCF) && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
      i += 3;
      const height = (buffer[i] << 8) | buffer[i + 1];
      const width = (buffer[i + 2] << 8) | buffer[i + 3];
      return { width, height };
    }

    const length = (buffer[i] << 8) | buffer[i + 1];
    i += length;
  }

  return { width: 0, height: 0 };
}

/**
 * 获取 PNG 图片尺寸
 */
function getPNGDimensions(buffer) {
  if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4E || buffer[3] !== 0x47) {
    return { width: 0, height: 0 };
  }

  const width = (buffer[16] << 24) | (buffer[17] << 16) | (buffer[18] << 8) | buffer[19];
  const height = (buffer[20] << 24) | (buffer[21] << 16) | (buffer[22] << 8) | buffer[23];

  return { width, height };
}

/**
 * 获取 GIF 图片尺寸
 */
function getGIFDimensions(buffer) {
  if (buffer[0] !== 0x47 || buffer[1] !== 0x49 || buffer[2] !== 0x46) {
    return { width: 0, height: 0 };
  }

  const width = buffer[6] | (buffer[7] << 8);
  const height = buffer[8] | (buffer[9] << 8);

  return { width, height };
}

/**
 * 获取 WebP 图片尺寸
 */
function getWebPDimensions(buffer) {
  if (buffer[0] !== 0x52 || buffer[1] !== 0x49 || buffer[2] !== 0x46 || buffer[3] !== 0x46) {
    return { width: 0, height: 0 };
  }

  if (buffer[8] !== 0x57 || buffer[9] !== 0x45 || buffer[10] !== 0x42 || buffer[11] !== 0x50) {
    return { width: 0, height: 0 };
  }

  // VP8 格式
  if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x20) {
    const width = ((buffer[26] | (buffer[27] << 8)) & 0x3fff);
    const height = ((buffer[28] | (buffer[29] << 8)) & 0x3fff);
    return { width, height };
  }

  // VP8L 格式
  if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x4C) {
    const bits = buffer[21] | (buffer[22] << 8) | (buffer[23] << 16) | (buffer[24] << 24);
    const width = ((bits & 0x3FFF) + 1);
    const height = (((bits >> 14) & 0x3FFF) + 1);
    return { width, height };
  }

  return { width: 0, height: 0 };
}

/**
 * 生成缩略图 - 使用 Photon WASM
 * @param {ArrayBuffer} imageBuffer 原始图片
 * @param {string} mimeType MIME类型
 * @param {number} maxWidth 最大宽度
 * @param {number} maxHeight 最大高度
 * @param {number} quality 质量 (0-100)
 * @returns {Promise<{buffer: ArrayBuffer, width: number, height: number, mimeType: string}>}
 */
export async function generateThumbnail(imageBuffer, mimeType, maxWidth, maxHeight, quality = 85) {
  try {
    // SVG 不需要缩略图
    if (mimeType === 'image/svg+xml') {
      return null;
    }

    // 检查文件大小（避免超过 Worker 内存限制）
    const sizeMB = imageBuffer.byteLength / (1024 * 1024);
    if (sizeMB > 10) {
      console.warn(`图片过大 (${sizeMB.toFixed(2)}MB)，跳过缩略图生成`);
      return null;
    }

    // 创建 PhotonImage
    const inputImage = photon.PhotonImage.new_from_byteslice(new Uint8Array(imageBuffer));

    const originalWidth = inputImage.get_width();
    const originalHeight = inputImage.get_height();

    console.log(`原始尺寸: ${originalWidth}x${originalHeight}`);

    // 返回原始尺寸（用于数据库存储）
    const imageDimensions = {
      originalWidth,
      originalHeight
    };

    // 如果图片非常小（小于100x100），不需要缩略图
    if (originalWidth < 100 && originalHeight < 100) {
      console.log('图片太小，跳过缩略图生成');
      inputImage.free();
      return null;
    }

    // 计算缩放后的尺寸（保持宽高比）
    let newWidth = originalWidth;
    let newHeight = originalHeight;

    // 只有当图片超过目标尺寸时才缩放
    if (originalWidth > maxWidth || originalHeight > maxHeight) {
      const widthRatio = maxWidth / originalWidth;
      const heightRatio = maxHeight / originalHeight;
      const ratio = Math.min(widthRatio, heightRatio);

      newWidth = Math.round(originalWidth * ratio);
      newHeight = Math.round(originalHeight * ratio);
    }

    console.log(`缩略图尺寸: ${newWidth}x${newHeight}`);

    // 使用 Photon 调整大小
    // SamplingFilter: Nearest = 1, Triangle = 2, CatmullRom = 3, Gaussian = 4, Lanczos3 = 5
    const resizedImage = photon.resize(inputImage, newWidth, newHeight, 5); // Lanczos3 最佳质量

    // 转换为 PNG 或 JPEG 格式
    // Photon 提供 get_bytes_jpeg() 和 get_bytes_png()
    let outputBytes;
    let outputMimeType;

    // 优先使用 JPEG（体积更小），PNG 透明图片除外
    if (mimeType === 'image/png') {
      outputBytes = resizedImage.get_bytes_png ? resizedImage.get_bytes_png() : resizedImage.get_bytes();
      outputMimeType = 'image/png';
    } else {
      // JPEG 格式，quality 参数 (0-100)
      outputBytes = resizedImage.get_bytes_jpeg ? resizedImage.get_bytes_jpeg(quality) : resizedImage.get_bytes();
      outputMimeType = 'image/jpeg';
    }

    // 释放内存
    inputImage.free();
    resizedImage.free();

    return {
      buffer: outputBytes.buffer,
      width: newWidth,
      height: newHeight,
      mimeType: outputMimeType,
      originalWidth: imageDimensions.originalWidth,
      originalHeight: imageDimensions.originalHeight
    };

  } catch (error) {
    console.error('生成缩略图失败:', error);
    return null;
  }
}

/**
 * 预定义的缩略图尺寸
 */
export const THUMBNAIL_SIZES = {
  thumbnail: { maxWidth: 300, maxHeight: 300, quality: 85 },
  medium: { maxWidth: 800, maxHeight: 800, quality: 90 },
  large: { maxWidth: 1600, maxHeight: 1600, quality: 92 }
};
