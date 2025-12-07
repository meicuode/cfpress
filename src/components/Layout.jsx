import { useState, useEffect, useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import DynamicLayout from './DynamicLayout'
import Footer from './Footer'

function Layout() {
  const [iconVersion, setIconVersion] = useState(null)
  const location = useLocation()

  // 根据路径判断页面类型
  const pageType = useMemo(() => {
    const path = location.pathname
    if (path === '/') return 'home'
    if (path.startsWith('/thread/')) return 'thread'
    if (path.startsWith('/category/')) return 'category'
    if (path.startsWith('/tag/')) return 'tag'
    return null // 其他页面使用传统布局
  }, [location.pathname])

  // 是否使用动态布局
  const useDynamicLayout = pageType !== null

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

      console.log('Favicon updated to:', iconUrl)
    }

    updateFavicon()
  }, [iconVersion])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 bg-gradient-to-b from-bg-primary to-[#2d3748] bg-cover bg-center bg-fixed before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-bg-primary/70"></div>

      <Navbar />

      {/* 支持动态布局的页面 */}
      {useDynamicLayout ? (
        <DynamicLayout pageType={pageType}>
          <Outlet />
        </DynamicLayout>
      ) : (
        <div className="flex max-w-[1200px] mx-auto mt-[96px] px-6 gap-8 w-full flex-1 max-[968px]:flex-col max-[968px]:px-5 pb-16">
          <Sidebar />
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default Layout
