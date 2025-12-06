import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { adminNavigationConfig } from '../config/adminNavigation'

function AdminSidebar() {
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState(['threads', 'appearance', 'theme-settings', 'settings'])

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    )
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  const isParentActive = (item) => {
    if (item.path === location.pathname) return true
    if (item.children && item.children.length > 0) {
      return item.children.some(child => child.path === location.pathname)
    }
    return false
  }

  return (
    <aside className="w-[200px] h-screen bg-[#23282d] text-[#eee] flex flex-col fixed left-0 top-0 overflow-y-auto">
      {/* Site branding */}
      <div className="h-[46px] flex items-center px-4 border-b border-[#32373c] flex-shrink-0 gap-2 text-sm">
        <Link to="/" className="text-base text-[#eee] hover:text-white" title="返回首页">
          🏠
        </Link>
        <span className="text-[#eee]">后台管理</span>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {adminNavigationConfig.menuItems.map((item) => (
          <div key={item.id}>
            {item.children && item.children.length > 0 ? (
              <>
                <button
                  onClick={() => toggleMenu(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    isParentActive(item)
                      ? 'bg-[#0073aa] text-white'
                      : 'text-[#eee] hover:bg-[#32373c] hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                  <span className="text-xs">{expandedMenus.includes(item.id) ? '▼' : '▶'}</span>
                </button>
                {expandedMenus.includes(item.id) && (
                  <div className="bg-[#1d2327]">
                    {item.children.map((child) => (
                      <div key={child.id}>
                        {child.children && child.children.length > 0 ? (
                          <>
                            <button
                              onClick={() => toggleMenu(child.id)}
                              className={`w-full flex items-center gap-2 px-4 py-2 pl-12 text-sm transition-colors ${
                                isParentActive(child)
                                  ? 'text-[#00a0d2]'
                                  : 'text-[#ddd] hover:text-[#00a0d2]'
                              }`}
                            >
                              <span className="flex-1 text-left">{child.label}</span>
                              <span className="text-xs">{expandedMenus.includes(child.id) ? '▼' : '▶'}</span>
                            </button>
                            {expandedMenus.includes(child.id) && (
                              <div className="bg-[#191e23]">
                                {child.children.map((subChild) => (
                                  <Link
                                    key={subChild.id}
                                    to={subChild.path}
                                    className={`block px-4 py-2 pl-16 text-sm transition-colors ${
                                      isActive(subChild.path)
                                        ? 'text-[#00a0d2]'
                                        : 'text-[#aaa] hover:text-[#00a0d2]'
                                    }`}
                                  >
                                    {subChild.label}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <Link
                            to={child.path}
                            className={`block px-4 py-2 pl-12 text-sm transition-colors ${
                              isActive(child.path)
                                ? 'text-[#00a0d2]'
                                : 'text-[#ddd] hover:text-[#00a0d2]'
                            }`}
                          >
                            {child.label}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  isActive(item.path)
                    ? 'bg-[#0073aa] text-white'
                    : 'text-[#eee] hover:bg-[#32373c] hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default AdminSidebar
