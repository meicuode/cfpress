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
    <nav className="fixed top-0 left-0 right-0 h-[66px] bg-bg-secondary/95 backdrop-blur-md border-b border-border z-[1000]">
      <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between gap-8">
        {/* Site branding */}
        <Link to="/" className="flex items-center gap-2 text-base font-medium text-text-primary whitespace-nowrap">
          <span className="text-xl">{navConfig.siteIcon}</span>
          <span className="max-md:hidden">{navConfig.siteName}</span>
        </Link>

        {/* Main navigation menu */}
        <div className="flex items-center gap-6 flex-1 max-md:gap-3">
          {navConfig.menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`text-sm whitespace-nowrap transition-colors max-md:text-[13px] ${
                isActive(item.path) ? 'text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {item.label} {item.icon}
            </Link>
          ))}
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
    </nav>
  )
}

export default Navbar
