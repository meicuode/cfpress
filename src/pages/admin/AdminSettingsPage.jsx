import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { useToast } from '../../contexts/ToastContext'
import FilePickerModal from '../../components/FilePickerModal'

function AdminSettingsPage() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 文件上传相关
  const [uploading, setUploading] = useState(false)
  const [showFilePicker, setShowFilePicker] = useState(false)
  const [filePickerTarget, setFilePickerTarget] = useState(null) // 'site_icon' or 'author_avatar'
  const siteIconInputRef = useRef(null)
  const avatarInputRef = useRef(null)

  // 默认社交平台配置
  const defaultSocialPlatforms = [
    { name: 'GitHub', url: '', icon: 'https://cdn.simpleicons.org/github/white', enabled: false },
    { name: '微信', url: '', icon: 'https://cdn.simpleicons.org/wechat/09B83E', enabled: false },
    { name: 'Steam', url: '', icon: 'https://cdn.simpleicons.org/steam/white', enabled: false },
    { name: 'Email', url: '', icon: 'https://cdn.simpleicons.org/gmail/EA4335', enabled: false }
  ]

  const [settings, setSettings] = useState({
    site_title: 'cfpress',
    site_subtitle: 'cfpress,一个自由的站点',
    site_url: '',
    site_icon: '', // 站点图标
    admin_email: '',
    allow_registration: false,
    default_user_role: 'subscriber',
    site_language: 'zh_CN',
    // 博主信息
    author_avatar: '/avatar.png',
    author_name: '',
    author_bio: '',
    author_social_platforms: JSON.stringify(defaultSocialPlatforms) // JSON 字符串
  })

  const [socialPlatforms, setSocialPlatforms] = useState(defaultSocialPlatforms)

  // 加载设置
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
          ...data
        }))

        // 解析社交平台 JSON
        if (data.author_social_platforms) {
          try {
            const platforms = JSON.parse(data.author_social_platforms)
            setSocialPlatforms(platforms)
          } catch (e) {
            console.error('解析社交平台配置失败:', e)
            setSocialPlatforms(defaultSocialPlatforms)
          }
        }
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
      // 将社交平台数组序列化为 JSON 字符串
      const settingsToSave = {
        ...settings,
        author_social_platforms: JSON.stringify(socialPlatforms)
      }

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToSave)
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

  // 社交平台管理函数
  const handlePlatformChange = (index, field, value) => {
    setSocialPlatforms(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleAddPlatform = () => {
    setSocialPlatforms(prev => [
      ...prev,
      { name: '', url: '', icon: '', enabled: false }
    ])
  }

  const handleRemovePlatform = (index) => {
    setSocialPlatforms(prev => prev.filter((_, i) => i !== index))
  }

  // 处理本地文件上传
  const handleLocalFileUpload = async (event, target) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('文件大小不能超过 5MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('files', file) // 注意：参数名是 'files'
      formData.append('path', target === 'site_icon' ? '/icons' : '/avatars')
      formData.append('uploadUser', 'admin')

      const response = await fetch('/api/admin/files/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (response.ok && data.success && data.uploaded && data.uploaded.length > 0) {
        const uploadedFile = data.uploaded[0]
        // 更新对应的设置字段
        if (target === 'site_icon') {
          handleChange('site_icon', uploadedFile.url)
        } else if (target === 'author_avatar') {
          handleChange('author_avatar', uploadedFile.url)
        }
        toast.success('上传成功')
      } else {
        toast.error(data.error || '上传失败')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('上传失败')
    } finally {
      setUploading(false)
      // 重置 input
      event.target.value = ''
    }
  }

  // 打开文件选择器 (从R2选择)
  const handleOpenFilePicker = (target) => {
    setFilePickerTarget(target)
    setShowFilePicker(true)
  }

  // 从R2选择文件
  const handleSelectFromR2 = (file) => {
    if (filePickerTarget === 'site_icon') {
      handleChange('site_icon', file.url)
    } else if (filePickerTarget === 'author_avatar') {
      handleChange('author_avatar', file.url)
    }
    toast.success('已选择文件')
    setShowFilePicker(false)
    setFilePickerTarget(null)
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
        <title>常规设置</title>
      </Helmet>
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
            <div className="flex flex-col gap-3">
              {/* 图标预览区域 */}
              <div className="w-[200px] h-[100px] border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50">
                {settings.site_icon ? (
                  <img
                    src={settings.site_icon}
                    alt="站点图标"
                    className="max-w-full max-h-full object-contain p-2"
                  />
                ) : (
                  <span className="text-sm text-[#646970]">暂无图标</span>
                )}
              </div>

              {/* 按钮组 */}
              <div className="flex gap-2">
                <input
                  ref={siteIconInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLocalFileUpload(e, 'site_icon')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => siteIconInputRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? '上传中...' : '本地上传'}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenFilePicker('site_icon')}
                  className="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
                >
                  从媒体库选择
                </button>
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

          {/* 分隔线 */}
          <div className="col-span-2 border-t border-gray-200 my-6"></div>

          {/* 博主信息标题 */}
          <div className="col-span-2">
            <h2 className="text-lg font-medium text-[#23282d] mb-4">博主信息</h2>
            <p className="text-sm text-[#646970]">配置侧边栏显示的博主个人信息</p>
          </div>

          {/* Author Avatar */}
          <div className="grid grid-cols-[200px_1fr] items-start gap-4">
            <label htmlFor="author_avatar" className="text-sm font-medium text-[#23282d] pt-2">
              头像
            </label>
            <div className="flex flex-col gap-3">
              {/* 头像预览 */}
              {settings.author_avatar && (
                <img
                  src={settings.author_avatar}
                  alt="头像预览"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
              )}

              {/* URL 输入框和上传按钮 */}
              <div className="flex gap-2 items-center max-w-md">
                <input
                  type="text"
                  id="author_avatar"
                  value={settings.author_avatar}
                  onChange={(e) => handleChange('author_avatar', e.target.value)}
                  placeholder="/avatar.png"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm text-[#23282d]"
                />
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLocalFileUpload(e, 'author_avatar')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? '上传中...' : '本地上传'}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenFilePicker('author_avatar')}
                  className="px-3 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50 whitespace-nowrap"
                >
                  从媒体库选择
                </button>
              </div>

              <span className="text-xs text-[#646970]">建议尺寸：200x200 像素</span>
            </div>
          </div>

          {/* Author Name */}
          <div className="grid grid-cols-[200px_1fr] items-center gap-4">
            <label htmlFor="author_name" className="text-sm font-medium text-[#23282d]">
              昵称
            </label>
            <input
              type="text"
              id="author_name"
              value={settings.author_name}
              onChange={(e) => handleChange('author_name', e.target.value)}
              placeholder="输入昵称"
              className="px-3 py-2 border border-gray-300 rounded text-sm max-w-md text-[#23282d]"
            />
          </div>

          {/* Author Bio */}
          <div className="grid grid-cols-[200px_1fr] items-start gap-4">
            <label htmlFor="author_bio" className="text-sm font-medium text-[#23282d] pt-2">
              个人简介
            </label>
            <textarea
              id="author_bio"
              value={settings.author_bio}
              onChange={(e) => handleChange('author_bio', e.target.value)}
              placeholder="输入个人简介"
              rows="3"
              className="px-3 py-2 border border-gray-300 rounded text-sm max-w-md text-[#23282d] resize-none"
            />
          </div>

          {/* Social Platforms */}
          <div className="col-span-2">
            <h3 className="text-base font-medium text-[#23282d] mb-3 mt-4">社交平台</h3>
            <p className="text-xs text-[#646970] mb-3">配置显示在侧边栏的社交平台链接</p>
          </div>

          {/* Platform List */}
          <div className="col-span-2">
            <div className="space-y-3">
              {socialPlatforms.map((platform, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                  {/* 启用复选框 */}
                  <input
                    type="checkbox"
                    checked={platform.enabled}
                    onChange={(e) => handlePlatformChange(index, 'enabled', e.target.checked)}
                    className="rounded"
                    title="启用/禁用"
                  />

                  {/* 图标预览 */}
                  <div className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded border border-gray-300">
                    {platform.icon ? (
                      platform.icon.startsWith('http') || platform.icon.startsWith('/') ? (
                        <img
                          src={platform.icon}
                          alt={platform.name}
                          className="w-5 h-5 object-contain"
                          onError={(e) => {
                            // 加载失败时显示占位符
                            e.target.style.display = 'none'
                            const placeholder = document.createElement('span')
                            placeholder.textContent = '❌'
                            placeholder.className = 'text-xs'
                            e.target.parentElement.appendChild(placeholder)
                          }}
                        />
                      ) : (
                        <span className="text-base">{platform.icon}</span>
                      )
                    ) : (
                      <span className="text-xs text-gray-400">无</span>
                    )}
                  </div>

                  {/* 平台名称 */}
                  <input
                    type="text"
                    value={platform.name}
                    onChange={(e) => handlePlatformChange(index, 'name', e.target.value)}
                    placeholder="平台名称"
                    className="w-32 px-3 py-2 border border-gray-300 rounded text-sm text-[#23282d]"
                  />

                  {/* URL */}
                  <input
                    type="text"
                    value={platform.url}
                    onChange={(e) => handlePlatformChange(index, 'url', e.target.value)}
                    placeholder="URL 链接"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm text-[#23282d]"
                  />

                  {/* Icon URL */}
                  <input
                    type="text"
                    value={platform.icon}
                    onChange={(e) => handlePlatformChange(index, 'icon', e.target.value)}
                    placeholder="图标 URL"
                    className="w-48 px-3 py-2 border border-gray-300 rounded text-sm text-[#23282d]"
                  />

                  {/* 删除按钮 */}
                  <button
                    type="button"
                    onClick={() => handleRemovePlatform(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded text-sm"
                    title="删除"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* 添加平台按钮 */}
              <button
                type="button"
                onClick={handleAddPlatform}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded text-sm text-[#646970] hover:border-[#0073aa] hover:text-[#0073aa] transition-colors"
              >
                + 添加新平台
              </button>
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

    {/* File Picker Modal */}
    <FilePickerModal
      isOpen={showFilePicker}
      onClose={() => {
        setShowFilePicker(false)
        setFilePickerTarget(null)
      }}
      onSelect={handleSelectFromR2}
      fileType="image"
    />
    </>
  )
}

export default AdminSettingsPage
