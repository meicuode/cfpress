import { useState, useEffect } from 'react'
import { useToast } from '../../contexts/ToastContext'

function AdminAdvancedPage() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState({
    head_scripts: '',
    footer_scripts: '',
    custom_css: '',
    custom_js: ''
  })

  useEffect(() => {
    document.title = '高级设置'
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
          head_scripts: data.head_scripts || '',
          footer_scripts: data.footer_scripts || '',
          custom_css: data.custom_css || '',
          custom_js: data.custom_js || ''
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
        toast.success('高级设置已保存')
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
      <div className="bg-white rounded-lg shadow max-w-6xl p-6">
        <div className="text-center text-[#646970]">加载中...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow max-w-6xl">
      {/* Header */}
      <div className="border-b border-gray-200 p-6 pb-4">
        <h1 className="text-2xl font-normal text-[#23282d]">高级设置</h1>
        <p className="text-sm text-[#646970] mt-1">配置自定义代码和脚本</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="flex flex-col gap-8">
          {/* Head Scripts */}
          <div className="grid grid-cols-[200px_1fr] items-start gap-4">
            <label htmlFor="head_scripts" className="text-sm font-medium text-[#23282d] pt-2">
              头部代码 (Head)
            </label>
            <div className="flex flex-col gap-2">
              <textarea
                id="head_scripts"
                value={settings.head_scripts}
                onChange={(e) => handleChange('head_scripts', e.target.value)}
                rows={10}
                placeholder={'<!-- Google Analytics -->\n<script>\n  // 你的统计代码\n</script>'}
                className="px-3 py-2 border border-gray-300 rounded text-sm w-full text-[#23282d] font-mono resize-y"
              />
              <p className="text-xs text-[#646970]">
                此代码将插入到网站的 &lt;head&gt; 标签中。常用于放置 Google Analytics、百度统计等代码。
              </p>
            </div>
          </div>

          {/* Footer Scripts */}
          <div className="grid grid-cols-[200px_1fr] items-start gap-4">
            <label htmlFor="footer_scripts" className="text-sm font-medium text-[#23282d] pt-2">
              底部代码 (Footer)
            </label>
            <div className="flex flex-col gap-2">
              <textarea
                id="footer_scripts"
                value={settings.footer_scripts}
                onChange={(e) => handleChange('footer_scripts', e.target.value)}
                rows={10}
                placeholder={'<!-- 其他统计代码 -->\n<script>\n  // 页面底部执行的脚本\n</script>'}
                className="px-3 py-2 border border-gray-300 rounded text-sm w-full text-[#23282d] font-mono resize-y"
              />
              <p className="text-xs text-[#646970]">
                此代码将插入到网站的 &lt;/body&gt; 标签之前。用于放置页面加载完成后执行的脚本。
              </p>
            </div>
          </div>

          {/* Custom CSS */}
          <div className="grid grid-cols-[200px_1fr] items-start gap-4">
            <label htmlFor="custom_css" className="text-sm font-medium text-[#23282d] pt-2">
              自定义 CSS
            </label>
            <div className="flex flex-col gap-2">
              <textarea
                id="custom_css"
                value={settings.custom_css}
                onChange={(e) => handleChange('custom_css', e.target.value)}
                rows={12}
                placeholder={'/* 自定义样式 */\n.my-custom-class {\n  color: #333;\n  font-size: 16px;\n}'}
                className="px-3 py-2 border border-gray-300 rounded text-sm w-full text-[#23282d] font-mono resize-y"
              />
              <p className="text-xs text-[#646970]">
                添加自定义 CSS 样式，用于覆盖或扩展主题样式。
              </p>
            </div>
          </div>

          {/* Custom JavaScript */}
          <div className="grid grid-cols-[200px_1fr] items-start gap-4">
            <label htmlFor="custom_js" className="text-sm font-medium text-[#23282d] pt-2">
              自定义 JavaScript
            </label>
            <div className="flex flex-col gap-2">
              <textarea
                id="custom_js"
                value={settings.custom_js}
                onChange={(e) => handleChange('custom_js', e.target.value)}
                rows={12}
                placeholder={'// 自定义 JavaScript 代码\nconsole.log("Hello, world!");'}
                className="px-3 py-2 border border-gray-300 rounded text-sm w-full text-[#23282d] font-mono resize-y"
              />
              <p className="text-xs text-[#646970]">
                添加自定义 JavaScript 代码。注意：不需要添加 &lt;script&gt; 标签。
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-yellow-600 text-lg">⚠️</span>
              <div>
                <h3 className="text-sm font-medium text-yellow-800 mb-1">注意事项</h3>
                <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                  <li>请确保添加的代码是安全可信的，错误的代码可能导致网站无法正常运行</li>
                  <li>建议在添加代码前先在浏览器控制台测试</li>
                  <li>修改后请刷新页面查看效果</li>
                </ul>
              </div>
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
  )
}

export default AdminAdvancedPage
