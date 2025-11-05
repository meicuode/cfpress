import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useToast } from '../../contexts/ToastContext'

function AdminFooterPage() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState({
    footer_custom_html: '',
    footer_copyright: '',
    footer_icp: '',
    footer_social_links: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      if (response.ok) {
        setSettings(prev => ({
          ...prev,
          footer_custom_html: data.footer_custom_html || '',
          footer_copyright: data.footer_copyright || '',
          footer_icp: data.footer_icp || '',
          footer_social_links: data.footer_social_links || ''
        }))
      } else {
        toast.error(data.error || '加载设置失败')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('加载设置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('页脚设置已保存')
      } else {
        toast.error(data.error || '保存失败')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow max-w-4xl p-6">
        <div className="text-center text-[#646970]">加载中...</div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>页脚设置</title>
      </Helmet>
      <div className="bg-white rounded-lg shadow max-w-4xl">
      {/* Header */}
      <div className="border-b border-gray-200 p-6 pb-4">
        <h1 className="text-2xl font-normal text-[#23282d]">页脚设置</h1>
        <p className="text-sm text-[#646970] mt-1">配置网站底部显示的信息</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="flex flex-col gap-6">
          {/* Custom HTML */}
          <div className="grid grid-cols-[200px_1fr] items-start gap-4">
            <label htmlFor="footer_custom_html" className="text-sm font-medium text-[#23282d] pt-2">
              底部自定义HTML
            </label>
            <div className="flex flex-col gap-2">
              <textarea
                id="footer_custom_html"
                value={settings.footer_custom_html}
                onChange={(e) => handleChange('footer_custom_html', e.target.value)}
                rows={8}
                placeholder={'<div class="footer-widgets">\n  <p>自定义内容</p>\n</div>'}
                className="px-3 py-2 border border-gray-300 rounded text-sm max-w-2xl text-[#23282d] font-mono resize-y"
              />
              <p className="text-xs text-[#646970]">
                自定义HTML代码，将在页脚顶部居中显示（在版权信息、ICP备案号等内容的上方）。支持任何HTML标签和内联样式。
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="grid grid-cols-[200px_1fr] items-start gap-4">
            <label htmlFor="footer_copyright" className="text-sm font-medium text-[#23282d] pt-2">
              版权信息
            </label>
            <div className="flex flex-col gap-2">
              <textarea
                id="footer_copyright"
                value={settings.footer_copyright}
                onChange={(e) => handleChange('footer_copyright', e.target.value)}
                rows={3}
                placeholder="© 2024 我的博客. All rights reserved."
                className="px-3 py-2 border border-gray-300 rounded text-sm max-w-2xl text-[#23282d] resize-none"
              />
              <p className="text-xs text-[#646970]">
                显示在网站底部的版权信息文本。支持HTML标签。
              </p>
            </div>
          </div>

          {/* ICP */}
          <div className="grid grid-cols-[200px_1fr] items-start gap-4">
            <label htmlFor="footer_icp" className="text-sm font-medium text-[#23282d] pt-2">
              ICP备案号
            </label>
            <div className="flex flex-col gap-2">
              <input
                id="footer_icp"
                type="text"
                value={settings.footer_icp}
                onChange={(e) => handleChange('footer_icp', e.target.value)}
                placeholder="京ICP备xxxxxxxx号"
                className="px-3 py-2 border border-gray-300 rounded text-sm max-w-md text-[#23282d]"
              />
              <p className="text-xs text-[#646970]">
                网站ICP备案号，将显示在页脚底部。
              </p>
            </div>
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-[200px_1fr] items-start gap-4">
            <label htmlFor="footer_social_links" className="text-sm font-medium text-[#23282d] pt-2">
              社交媒体链接
            </label>
            <div className="flex flex-col gap-2">
              <textarea
                id="footer_social_links"
                value={settings.footer_social_links}
                onChange={(e) => handleChange('footer_social_links', e.target.value)}
                rows={5}
                placeholder={'{\n  "github": "https://github.com/yourusername",\n  "twitter": "https://twitter.com/yourusername",\n  "email": "your@email.com"\n}'}
                className="px-3 py-2 border border-gray-300 rounded text-sm max-w-2xl text-[#23282d] font-mono resize-none"
              />
              <p className="text-xs text-[#646970]">
                以JSON格式输入社交媒体链接。支持的平台：github, twitter, weibo, email, rss等。
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-[#0073aa] text-white rounded hover:bg-[#005a87] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存更改'}
          </button>
        </div>
      </form>
    </div>
    </>
  )
}

export default AdminFooterPage
