import { useState, useEffect } from 'react'
import { Outlet, Link } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'

function AdminLayout() {
  const [iconVersion, setIconVersion] = useState(null)

  // 获取站点图标版本号
  useEffect(() => {
    const fetchIconVersion = async () => {
      try {
        const response = await fetch('/api/navigation')
        if (response.ok) {
          const data = await response.json()
          setIconVersion(data.siteIconVersion || Date.now())
        }
      } catch (error) {
        console.error('Error fetching icon version:', error)
        setIconVersion(Date.now())
      }
    }
    fetchIconVersion()
  }, [])

  // 设置favicon（仅在获取到版本号后执行一次）
  useEffect(() => {
    if (!iconVersion) return

    const updateFavicon = () => {
      // 移除现有的favicon link标签
      const existingLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
      existingLinks.forEach(link => link.remove())

      // 创建新的favicon link标签，使用版本号参数
      const iconUrl = `/api/site-icon?v=${iconVersion}`

      const link1 = document.createElement('link')
      link1.rel = 'icon'
      link1.href = iconUrl

      const link2 = document.createElement('link')
      link2.rel = 'shortcut icon'
      link2.href = iconUrl

      const link3 = document.createElement('link')
      link3.rel = 'apple-touch-icon'
      link3.href = iconUrl

      document.head.appendChild(link1)
      document.head.appendChild(link2)
      document.head.appendChild(link3)

      console.log('Admin favicon updated to:', iconUrl)
    }

    updateFavicon()
  }, [iconVersion])

  return (
    <div className="min-h-screen flex bg-[#f0f0f1]">

      <AdminSidebar />
      <main className="flex-1 ml-[200px]">
        {/* Top bar */}
        <div className="h-[46px] bg-[#23282d] border-b border-[#32373c] flex items-center justify-end px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4 text-[#eee] text-sm">
            <span>您好，admin</span>
          </div>
        </div>

        {/* Content area */}
        <div className="p-2">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
