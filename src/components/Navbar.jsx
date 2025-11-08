import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { navigationConfig, fetchNavigationConfig } from '../config/navigation'
import { useTheme } from '../contexts/ThemeContext'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [navConfig, setNavConfig] = useState(navigationConfig)
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [openDropdown, setOpenDropdown] = useState(null) // 当前打开的下拉菜单

  useEffect(() => {
    // Load navigation config (could be from API in the future)
    fetchNavigationConfig().then(config => {
      setNavConfig(config)
    })
  }, [])

  const isActive = (path) => {
    return location.pathname === path
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
      setSearchVisible(false)
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-bg-secondary/95 backdrop-blur-md border-b border-border z-[1000]">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* 第一行：站点标题和导航菜单 */}
        <div className="h-[52px] flex items-center justify-between gap-8 pt-2">
          {/* Site branding */}
          <Link to="/" className="flex items-center gap-2 text-base font-medium text-text-primary whitespace-nowrap">
            {/* 站点图标 - 支持图片URL或emoji */}
            {navConfig.siteIcon && (
              navConfig.siteIcon.startsWith('http') || navConfig.siteIcon.startsWith('/') ? (
                <img
                  src={navConfig.siteIcon}
                  alt="站点图标"
                  className="w-6 h-6 object-contain"
                />
              ) : (
                <span className="text-xl">{navConfig.siteIcon}</span>
              )
            )}
            <span className="max-md:hidden">{navConfig.siteName}</span>
          </Link>

          {/* Main navigation menu */}
          <div className="flex items-center gap-6 flex-1 max-md:gap-3">
            {navConfig.menuItems.map((item) => {
              // 如果有子菜单，显示为下拉菜单
              if (item.children && item.children.length > 0) {
                return (
                  <div
                    key={item.id}
                    className="relative group"
                    onMouseEnter={() => setOpenDropdown(item.id)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      className={`text-sm whitespace-nowrap transition-colors max-md:text-[13px] flex items-center gap-1 ${
                        isActive(item.path) ? 'text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {item.label} {item.icon}
                      <span className="text-xs">▼</span>
                    </button>

                    {/* 下拉菜单 - 添加了 pt-2 来创建无缝过渡区域 */}
                    {openDropdown === item.id && (
                      <div className="absolute top-full left-0 pt-2 z-50">
                        <div className="min-w-[160px] bg-bg-secondary/95 backdrop-blur-md border border-border rounded-lg shadow-lg py-2">
                          {item.children.map((child) => (
                            <Link
                              key={child.id}
                              to={child.path}
                              target={child.target}
                              className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors"
                            >
                              {child.icon && <span className="mr-2">{child.icon}</span>}
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

              // 没有子菜单，显示为普通链接
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  target={item.target}
                  className={`text-sm whitespace-nowrap transition-colors max-md:text-[13px] ${
                    isActive(item.path) ? 'text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {item.label} {item.icon}
                </Link>
              )
            })}
          </div>

          {/* Search and action buttons */}
          <div className="flex items-center gap-3">
            {/* Search box */}
            {searchVisible ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={navConfig.searchPlaceholder}
                  className="w-[200px] h-8 px-3 bg-bg-card border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-blue transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setSearchVisible(false)}
                  className="ml-2 w-8 h-8 flex items-center justify-center rounded-md text-text-secondary hover:text-text-primary"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchVisible(true)}
                className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary transition-all text-base hover:bg-bg-card hover:text-text-primary"
                title="搜索"
              >
                🔍
              </button>
            )}

            {/* Action buttons */}
            <button
              onClick={handleRefresh}
              className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary transition-all text-base hover:bg-bg-card hover:text-text-primary"
              title="刷新"
            >
              🔄
            </button>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary transition-all text-base hover:bg-bg-card hover:text-text-primary"
              title={theme === 'dark' ? '切换到日间模式' : '切换到夜间模式'}
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>

        {/* 第二行：副标题 */}
        {navConfig.siteSubtitle && (
          <div className="h-[28px] flex items-start pt-0.5 max-md:hidden">
            <span className="text-xs text-text-secondary ml-7">{navConfig.siteSubtitle}</span>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
