// Admin navigation configuration
export const adminNavigationConfig = {
  menuItems: [
    {
      id: 'dashboard',
      label: '仪表盘',
      icon: '📊',
      path: '/admin',
      children: []
    },
    {
      id: 'threads',
      label: '文章',
      icon: '📝',
      path: '/admin/threads',
      children: [
        { id: 'all-threads', label: '所有文章', path: '/admin/threads' }
      ]
    },
    {
      id: 'comments',
      label: '评论',
      icon: '💬',
      path: '/admin/comments',
      children: []
    },
    {
      id: 'files',
      label: '文件管理',
      icon: '📁',
      path: '/admin/files',
      children: []
    },
    {
      id: 'appearance',
      label: '外观',
      icon: '🎨',
      path: '/admin/appearance',
      children: [
        { id: 'menus', label: '菜单', path: '/admin/appearance/menus' },
        { id: 'footer', label: '页脚设置', path: '/admin/appearance/footer' },
        { id: 'categories', label: '分类', path: '/admin/appearance/categories' }
      ]
    },
    {
      id: 'settings',
      label: '设置',
      icon: '⚙️',
      path: '/admin/settings',
      children: [
        { id: 'site', label: '基础设置', path: '/admin/settings/site' },
        { id: 'advanced', label: '高级设置', path: '/admin/settings/advanced' }
      ]
    }
  ]
}

export async function fetchAdminNavigationConfig() {
  // TODO: Implement API call to fetch admin navigation from D1 database
  return adminNavigationConfig
}
