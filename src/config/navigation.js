// Navigation menu configuration
// This can be loaded from database in the future

export const navigationConfig = {
  // Site branding
  siteName: '没有小家',
  siteIcon: '🏠',

  // Main navigation menu items
  menuItems: [
    {
      id: 'home',
      label: '主菜单',
      path: '/',
      icon: null,
      isHome: true, // Special flag for home page
    },
    {
      id: 'archive',
      label: '归档',
      path: '/category',
      icon: '📚',
      isHome: false,
    },
    {
      id: 'about',
      label: '关于',
      path: '/about',
      icon: '✨',
      isHome: false,
    },
    {
      id: 'friends',
      label: '友链',
      path: '/friends',
      icon: '💝',
      isHome: false,
    },
  ],

  // Search configuration
  searchPlaceholder: '搜索什么...',

  // Action buttons
  actions: [
    {
      id: 'search',
      icon: '🔍',
      title: '搜索',
      action: 'toggleSearch',
    },
    {
      id: 'refresh',
      icon: '🔄',
      title: '刷新',
      action: 'refresh',
    },
    {
      id: 'theme',
      icon: '🌙',
      title: '切换主题',
      action: 'toggleTheme',
    },
  ],
}

// Function to fetch navigation config from API (future implementation)
export async function fetchNavigationConfig() {
  // TODO: Implement API call to fetch navigation from D1 database
  // const response = await fetch('/api/navigation')
  // const data = await response.json()
  // return data

  // For now, return static config
  return navigationConfig
}
