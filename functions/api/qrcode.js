import QRCode from 'qrcode'

/**
 * 二维码生成 API
 * GET /api/qrcode?url=<url>&size=<size>
 *
 * 参数:
 * - url: 要编码的URL (必填)
 * - size: 二维码尺寸（像素） (可选, 默认: 200)
 *
 * 返回: SVG 图片
 */
export async function onRequestGet(context) {
  try {
    const { request } = context
    const url = new URL(request.url)

    // 获取参数
    const targetUrl = url.searchParams.get('url')
    const size = parseInt(url.searchParams.get('size') || '200', 10)

    // 验证参数
    if (!targetUrl) {
      return new Response('缺少必填参数: url', {
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      })
    }

    // 生成二维码为 SVG 字符串
    // 注意: Cloudflare Workers 环境下只能使用 toString() 生成 SVG
    const qrCodeSVG = await QRCode.toString(targetUrl, {
      type: 'svg',
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // 返回 SVG 图片，带缓存头
    return new Response(qrCodeSVG, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400', // 缓存24小时
      }
    })
  } catch (error) {
    console.error('二维码生成失败:', error)
    return new Response('二维码生成失败: ' + error.message, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })
  }
}
