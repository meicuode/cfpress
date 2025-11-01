import { useState } from 'react'

function AdminSettingsPage() {
  // Mock data - will be replaced with API calls
  const [settings, setSettings] = useState({
    siteTitle: '最初的',
    siteSubtitle: '',
    siteIcon: '',
    wordpressUrl: 'https://blogs.zuichu.de',
    siteUrl: 'https://blogs.zuichu.de',
    adminEmail: 'letstayfree@gmail.com',
    allowRegistration: false,
    defaultUserRole: 'subscriber',
    siteLanguage: 'zh_CN'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Saving settings:', settings)
    // TODO: Implement API call to save settings
    alert('设置已保存')
  }

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
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
            <label htmlFor="siteTitle" className="text-sm font-medium text-[#23282d]">
              站点标题
            </label>
            <input
              id="siteTitle"
              type="text"
              value={settings.siteTitle}
              onChange={(e) => handleChange('siteTitle', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm max-w-md"
            />
          </div>

          {/* Site Subtitle */}
          <div className="grid grid-cols-[200px_1fr] items-start gap-4">
            <label htmlFor="siteSubtitle" className="text-sm font-medium text-[#23282d] pt-2">
              副标题
            </label>
            <div className="flex flex-col gap-2">
              <input
                id="siteSubtitle"
                type="text"
                value={settings.siteSubtitle}
                onChange={(e) => handleChange('siteSubtitle', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded text-sm max-w-md"
              />
              <p className="text-xs text-[#646970]">
                用几句话解释一下这个站点的内容。示例：「又一个 WordPress 站点」。
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
                网站图标是您在浏览器签页、书签栏和 WordPress 移动应用程序中看到的图标。
                它应为正方形，像素至少为 512 × 512。
              </p>
            </div>
          </div>

          {/* WordPress URL */}
          <div className="grid grid-cols-[200px_1fr] items-center gap-4">
            <label htmlFor="wordpressUrl" className="text-sm font-medium text-[#23282d]">
              WordPress 地址（URL）
            </label>
            <input
              id="wordpressUrl"
              type="url"
              value={settings.wordpressUrl}
              onChange={(e) => handleChange('wordpressUrl', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm max-w-md"
            />
          </div>

          {/* Site URL */}
          <div className="grid grid-cols-[200px_1fr] items-start gap-4">
            <label htmlFor="siteUrl" className="text-sm font-medium text-[#23282d] pt-2">
              站点地址（URL）
            </label>
            <div className="flex flex-col gap-2">
              <input
                id="siteUrl"
                type="url"
                value={settings.siteUrl}
                onChange={(e) => handleChange('siteUrl', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded text-sm max-w-md"
              />
              <p className="text-xs text-[#646970]">
                如果您想让您的站点主页与 WordPress 安装目录不同，请在此地址输入地址。
              </p>
            </div>
          </div>

          {/* Admin Email */}
          <div className="grid grid-cols-[200px_1fr] items-start gap-4">
            <label htmlFor="adminEmail" className="text-sm font-medium text-[#23282d] pt-2">
              管理员邮箱地址
            </label>
            <div className="flex flex-col gap-2">
              <input
                id="adminEmail"
                type="email"
                value={settings.adminEmail}
                onChange={(e) => handleChange('adminEmail', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded text-sm max-w-md"
              />
              <p className="text-xs text-[#646970]">
                此地址用于管理目的。如果您更改此设置，系统将向您的新地址发送一封邮件进行确认。
                新地址在得到确认之前不会生效。
              </p>
            </div>
          </div>

          {/* Allow Registration */}
          <div className="grid grid-cols-[200px_1fr] items-center gap-4">
            <label htmlFor="allowRegistration" className="text-sm font-medium text-[#23282d]">
              成员资格
            </label>
            <label className="flex items-center gap-2">
              <input
                id="allowRegistration"
                type="checkbox"
                checked={settings.allowRegistration}
                onChange={(e) => handleChange('allowRegistration', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-[#23282d]">任何人都可以注册</span>
            </label>
          </div>

          {/* Default User Role */}
          <div className="grid grid-cols-[200px_1fr] items-center gap-4">
            <label htmlFor="defaultUserRole" className="text-sm font-medium text-[#23282d]">
              新用户默认角色
            </label>
            <select
              id="defaultUserRole"
              value={settings.defaultUserRole}
              onChange={(e) => handleChange('defaultUserRole', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm max-w-md"
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
            <label htmlFor="siteLanguage" className="text-sm font-medium text-[#23282d]">
              站点语言
            </label>
            <select
              id="siteLanguage"
              value={settings.siteLanguage}
              onChange={(e) => handleChange('siteLanguage', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm max-w-md"
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
            className="px-6 py-2 bg-[#0073aa] text-white rounded hover:bg-[#005a87] text-sm"
          >
            保存更改
          </button>
        </div>
      </form>
    </div>
  )
}

export default AdminSettingsPage
