import { useState, useEffect } from 'react'

function Footer() {
  const currentYear = new Date().getFullYear()
  const [footerSettings, setFooterSettings] = useState({
    footer_custom_html: '',
    footer_copyright: '',
    footer_icp: '',
    footer_social_links: ''
  })

  useEffect(() => {
    loadFooterSettings()
  }, [])

  const loadFooterSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      if (response.ok) {
        setFooterSettings({
          footer_custom_html: data.footer_custom_html || '',
          footer_copyright: data.footer_copyright || '',
          footer_icp: data.footer_icp || '',
          footer_social_links: data.footer_social_links || ''
        })
      }
    } catch (error) {
      console.error('Error loading footer settings:', error)
    }
  }

  // 解析社交媒体链接JSON
  const parseSocialLinks = () => {
    try {
      if (!footerSettings.footer_social_links) return null
      return JSON.parse(footerSettings.footer_social_links)
    } catch (error) {
      console.error('Error parsing social links:', error)
      return null
    }
  }

  const socialLinks = parseSocialLinks()

  return (
    <footer className="mt-auto py-10 bg-bg-secondary border-t border-border max-md:py-8">
      <div className="max-w-[1200px] mx-auto px-6 text-center max-md:px-5">
        {/* 自定义HTML模块 - 最上方 */}
        {footerSettings.footer_custom_html && (
          <div
            className="mb-6"
            dangerouslySetInnerHTML={{ __html: footerSettings.footer_custom_html }}
          />
        )}

        {/* 版权信息 */}
        {footerSettings.footer_copyright && (
          <div className="mb-4">
            <p
              className="text-[13px] text-text-secondary"
              dangerouslySetInnerHTML={{ __html: footerSettings.footer_copyright }}
            />
          </div>
        )}

        {/* 社交媒体链接 */}
        {socialLinks && Object.keys(socialLinks).length > 0 && (
          <div className="flex justify-center items-center gap-3 mb-4 flex-wrap">
            {socialLinks.github && (
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-text-secondary hover:text-accent-blue"
              >
                GitHub
              </a>
            )}
            {socialLinks.twitter && (
              <>
                {socialLinks.github && <span className="text-text-secondary">·</span>}
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-text-secondary hover:text-accent-blue"
                >
                  Twitter
                </a>
              </>
            )}
            {socialLinks.weibo && (
              <>
                {(socialLinks.github || socialLinks.twitter) && <span className="text-text-secondary">·</span>}
                <a
                  href={socialLinks.weibo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-text-secondary hover:text-accent-blue"
                >
                  微博
                </a>
              </>
            )}
            {socialLinks.email && (
              <>
                {(socialLinks.github || socialLinks.twitter || socialLinks.weibo) && <span className="text-text-secondary">·</span>}
                <a
                  href={`mailto:${socialLinks.email}`}
                  className="text-[13px] text-text-secondary hover:text-accent-blue"
                >
                  邮箱
                </a>
              </>
            )}
            {socialLinks.rss && (
              <>
                {(socialLinks.github || socialLinks.twitter || socialLinks.weibo || socialLinks.email) && <span className="text-text-secondary">·</span>}
                <a
                  href={socialLinks.rss}
                  className="text-[13px] text-text-secondary hover:text-accent-blue"
                >
                  RSS
                </a>
              </>
            )}
          </div>
        )}

        {/* ICP备案号 */}
        {footerSettings.footer_icp && (
          <div className="mt-4">
            <p className="text-xs text-text-secondary">{footerSettings.footer_icp}</p>
          </div>
        )}
      </div>
    </footer>
  )
}

export default Footer
