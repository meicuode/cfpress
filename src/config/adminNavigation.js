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
        { id: 'all-threads', label: '所有文章', path: '/admin/threads' },
        { id: 'add-thread', label: '添加文章', path: '/admin/threads/new' },
        { id: 'categories', label: '分类目录', path: '/admin/categories' },
        { id: 'tags', label: '标签', path: '/admin/tags' }
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
      id: 'settings',
      label: '设置',
      icon: '⚙️',
      path: '/admin/settings',
      children: [
        { id: 'general', label: '常规', path: '/admin/settings/general' },
        { id: 'site', label: '站点设置', path: '/admin/settings/site' }
      ]
    }
  ]
}

export async function fetchAdminNavigationConfig() {
  // TODO: Implement API call to fetch admin navigation from D1 database
  return adminNavigationConfig
}
