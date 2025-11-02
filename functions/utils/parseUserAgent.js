/**
 * 解析 User-Agent 字符串
 * 提取浏览器、操作系统、设备信息
 */

export function parseUserAgent(userAgent) {
  if (!userAgent) {
    return {
      browser: '未知',
      os: '未知',
      device: '未知'
    }
  }

  const ua = userAgent.toLowerCase()

  // 解析浏览器
  let browser = '未知'
  if (ua.includes('edg/')) {
    const version = userAgent.match(/Edg\/([\d.]+)/)
    browser = version ? `Edge ${version[1].split('.')[0]}` : 'Edge'
  } else if (ua.includes('chrome/') && !ua.includes('edg')) {
    const version = userAgent.match(/Chrome\/([\d.]+)/)
    browser = version ? `Chrome ${version[1].split('.')[0]}` : 'Chrome'
  } else if (ua.includes('firefox/')) {
    const version = userAgent.match(/Firefox\/([\d.]+)/)
    browser = version ? `Firefox ${version[1].split('.')[0]}` : 'Firefox'
  } else if (ua.includes('safari/') && !ua.includes('chrome')) {
    const version = userAgent.match(/Version\/([\d.]+)/)
    browser = version ? `Safari ${version[1].split('.')[0]}` : 'Safari'
  } else if (ua.includes('opr/') || ua.includes('opera/')) {
    const version = userAgent.match(/(?:OPR|Opera)\/([\d.]+)/)
    browser = version ? `Opera ${version[1].split('.')[0]}` : 'Opera'
  } else if (ua.includes('trident/') || ua.includes('msie')) {
    browser = 'IE'
  }

  // 解析操作系统
  let os = '未知'
  if (ua.includes('windows nt 10.0')) {
    os = 'Windows 10/11'
  } else if (ua.includes('windows nt 6.3')) {
    os = 'Windows 8.1'
  } else if (ua.includes('windows nt 6.2')) {
    os = 'Windows 8'
  } else if (ua.includes('windows nt 6.1')) {
    os = 'Windows 7'
  } else if (ua.includes('windows nt 6.0')) {
    os = 'Windows Vista'
  } else if (ua.includes('windows nt 5.1')) {
    os = 'Windows XP'
  } else if (ua.includes('windows')) {
    os = 'Windows'
  } else if (ua.includes('mac os x')) {
    const version = userAgent.match(/Mac OS X ([\d_]+)/)
    if (version) {
      const v = version[1].replace(/_/g, '.')
      os = `macOS ${v.split('.').slice(0, 2).join('.')}`
    } else {
      os = 'macOS'
    }
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    const version = userAgent.match(/OS ([\d_]+)/)
    if (version) {
      os = `iOS ${version[1].replace(/_/g, '.')}`
    } else {
      os = 'iOS'
    }
  } else if (ua.includes('android')) {
    const version = userAgent.match(/Android ([\d.]+)/)
    os = version ? `Android ${version[1]}` : 'Android'
  } else if (ua.includes('linux')) {
    os = 'Linux'
  } else if (ua.includes('ubuntu')) {
    os = 'Ubuntu'
  } else if (ua.includes('fedora')) {
    os = 'Fedora'
  }

  // 解析设备类型
  let device = '未知'
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    device = '手机'
  } else if (ua.includes('ipad') || ua.includes('tablet')) {
    device = '平板'
  } else if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
    device = '电脑'
  }

  return {
    browser,
    os,
    device
  }
}
