import { useState, useEffect } from 'react'
import { useToast } from '../../contexts/ToastContext'

function AdminSettingsPage() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState({
    site_title: 'cfpress',
    site_subtitle: 'cfpress,一个自由的站点',
    site_url: '',
    admin_email: '',
    allow_registration: false,
    default_user_role: 'subscriber',
    site_language: 'zh_CN'
  })

  // 加载设置
  useEffect(() => {
    document.title = '常规设置'
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
          ...data
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
        toast.success('设置已保存')
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
    <div className="bg-white rounded-lg shadow max-w-4xl">
      {/* Header */}
      <div className="border-b border-gray-200 p-6 pb-4">
        <h1 className="text-2xl font-normal text-[#23282d]">常规选项</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="flex flex-col gap-6">
          {/* Site Title */}
          <div className="grid grid-cols-[200px_1fr] items-center gap-4">
            <label htmlFor="site_title" className="text-sm font-medium text-[#23282d]">
              站点标题
            </label>
            <input
              id="site_title"
              type="text"
              value={settings.site_title}
              onChange={(e) => handleChange('site_title', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm max-w-md text-[#23282d]"
            />
          </div>

          {/* Site Subtitle */}
          <div className="grid grid-cols-[200px_1fr] items-start gap-4">
            <label htmlFor="site_subtitle" className="text-sm font-medium text-[#23282d] pt-2">
              副标题
            </label>
            <div className="flex flex-col gap-2">
              <input
                id="site_subtitle"
                type="text"
                value={settings.site_subtitle}
                onChange={(e) => handleChange('site_subtitle', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded text-sm max-w-md text-[#23282d]"
              />
              <p className="text-xs text-[#646970]">
                用几句话解释一下这个站点的内容。
              </p>
            </div>
          </div>

          {/* Site Icon */}
          <div className="grid grid-cols-[200px_1fr] items-start gap-4">
            <label className="text-sm font-medium text-[#23282d] pt-2">
              站点图标
            </label>
            <div className="flex flex-col gap-2">
              <div className="w-[200px] h-[100px] border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-sm text-[#646970]">
                选择一个站点图标
              </div>
              <p className="text-xs text-[#646970]">
                网站图标是您在浏览器签页、书签栏中看到的图标。
                它应为正方形，像素至少为 512 × 512。
              </p>
            </div>
          </div>

          {/* Site URL */}
          <div className="grid grid-cols-[200px_1fr] items-start gap-4">
            <label htmlFor="site_url" className="text-sm font-medium text-[#23282d] pt-2">
              站点地址（URL）
            </label>
            <div className="flex flex-col gap-2">
              <input
                id="site_url"
                type="url"
                value={settings.site_url}
                onChange={(e) => handleChange('site_url', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded text-sm max-w-md text-[#23282d]"
              />
              <p className="text-xs text-[#646970]">
                请输入您的站点地址。
              </p>
            </div>
          </div>

          {/* Admin Email */}
          <div className="grid grid-cols-[200px_1fr] items-start gap-4">
            <label htmlFor="admin_email" className="text-sm font-medium text-[#23282d] pt-2">
              管理员邮箱地址
            </label>
            <div className="flex flex-col gap-2">
              <input
                id="admin_email"
                type="email"
                value={settings.admin_email}
                onChange={(e) => handleChange('admin_email', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded text-sm max-w-md text-[#23282d]"
              />
              <p className="text-xs text-[#646970]">
                此地址用于管理目的。如果您更改此设置，系统将向您的新地址发送一封邮件进行确认。
              </p>
            </div>
          </div>

          {/* Allow Registration */}
          <div className="grid grid-cols-[200px_1fr] items-center gap-4">
            <label htmlFor="allow_registration" className="text-sm font-medium text-[#23282d]">
              成员资格
            </label>
            <label className="flex items-center gap-2">
              <input
                id="allow_registration"
                type="checkbox"
                checked={settings.allow_registration}
                onChange={(e) => handleChange('allow_registration', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-[#23282d]">任何人都可以注册</span>
            </label>
          </div>

          {/* Default User Role */}
          <div className="grid grid-cols-[200px_1fr] items-center gap-4">
            <label htmlFor="default_user_role" className="text-sm font-medium text-[#23282d]">
              新用户默认角色
            </label>
            <select
              id="default_user_role"
              value={settings.default_user_role}
              onChange={(e) => handleChange('default_user_role', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm max-w-md text-[#23282d]"
            >
              <option value="subscriber">订阅者</option>
              <option value="contributor">贡献者</option>
              <option value="author">作者</option>
              <option value="editor">编辑</option>
              <option value="administrator">管理员</option>
            </select>
          </div>

          {/* Site Language */}
          <div className="grid grid-cols-[200px_1fr] items-center gap-4">
            <label htmlFor="site_language" className="text-sm font-medium text-[#23282d]">
              站点语言
            </label>
            <select
              id="site_language"
              value={settings.site_language}
              onChange={(e) => handleChange('site_language', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm max-w-md text-[#23282d]"
            >
              <option value="zh_CN">简体中文</option>
              <option value="en_US">English (US)</option>
              <option value="zh_TW">繁體中文</option>
              <option value="ja">日本語</option>
            </select>
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

export default AdminSettingsPage
