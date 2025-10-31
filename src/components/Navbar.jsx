import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <nav className="fixed top-0 left-0 right-0 h-[60px] bg-bg-secondary/95 backdrop-blur-md border-b border-border z-[1000]">
      <div className="max-w-[1400px] mx-auto px-5 h-full flex items-center justify-between gap-10">
        <Link to="/" className="flex items-center gap-2 text-base font-medium text-text-primary whitespace-nowrap">
          <span className="text-xl">🏠</span>
          <span className="max-md:hidden">没有梦想</span>
        </Link>

        <div className="flex items-center gap-[30px] flex-1 max-md:gap-4">
          <Link
            to="/"
            className={`text-sm whitespace-nowrap transition-colors max-md:text-[13px] ${
              isActive('/') ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            主菜单
          </Link>
          <Link
            to="/category"
            className={`text-sm whitespace-nowrap transition-colors max-md:text-[13px] ${
              isActive('/category') ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            归档 📚
          </Link>
          <Link
            to="/about"
            className={`text-sm whitespace-nowrap transition-colors max-md:text-[13px] ${
              isActive('/about') ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            关于 ✨
          </Link>
          <Link
            to="/friends"
            className={`text-sm whitespace-nowrap transition-colors max-md:text-[13px] ${
              isActive('/friends') ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            友链 💝
          </Link>
        </div>

        <div className="flex items-center gap-[15px]">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary transition-all text-base hover:bg-bg-card hover:text-text-primary"
            title="搜索"
          >
            🔍
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary transition-all text-base hover:bg-bg-card hover:text-text-primary"
            title="刷新"
          >
            🔄
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary transition-all text-base hover:bg-bg-card hover:text-text-primary"
            title="主题"
          >
            🌙
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
