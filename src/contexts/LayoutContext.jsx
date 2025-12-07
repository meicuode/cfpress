import { createContext, useContext, useState, useEffect } from 'react'

const LayoutContext = createContext()

// 可用的模块定义
export const AVAILABLE_MODULES = {
  // 通用模块
  profile: {
    id: 'profile',
    name: '个人信息',
    icon: '👤',
    color: 'bg-blue-400',
    defaultWidth: '280px',
    pages: ['home', 'thread', 'category', 'tag']
  },
  categories: {
    id: 'categories',
    name: '分类',
    icon: '📁',
    color: 'bg-green-400',
    defaultWidth: '280px',
    pages: ['home', 'thread', 'category', 'tag']
  },
  tags: {
    id: 'tags',
    name: '标签云',
    icon: '🏷️',
    color: 'bg-purple-400',
    defaultWidth: '280px',
    pages: ['home', 'thread', 'category', 'tag']
  },
  recentPosts: {
    id: 'recentPosts',
    name: '最新文章',
    icon: '📰',
    color: 'bg-yellow-400',
    defaultWidth: '280px',
    pages: ['home', 'thread', 'category', 'tag']
  },
  // 首页专用模块
  posts: {
    id: 'posts',
    name: '文章列表',
    icon: '📝',
    color: 'bg-red-400',
    defaultWidth: 'flex-1',
    required: true,
    pages: ['home', 'category', 'tag']
  },
  // 文章详情页专用模块
  content: {
    id: 'content',
    name: '文章内容',
    icon: '📄',
    color: 'bg-red-400',
    defaultWidth: 'flex-1',
    required: true,
    pages: ['thread']
  },
  comments: {
    id: 'comments',
    name: '评论区',
    icon: '💬',
    color: 'bg-orange-400',
    defaultWidth: 'flex-1',
    pages: ['thread']
  },
  toc: {
    id: 'toc',
    name: '文章目录',
    icon: '📑',
    color: 'bg-cyan-400',
    defaultWidth: '280px',
    pages: ['thread']
  }
}

// 页面类型定义
export const PAGE_TYPES = {
  home: { id: 'home', name: '首页', requiredModule: 'posts' },
  thread: { id: 'thread', name: '文章详情页', requiredModule: 'content' },
  category: { id: 'category', name: '分类页', requiredModule: 'posts' },
  tag: { id: 'tag', name: '标签页', requiredModule: 'posts' }
}

// 默认布局配置
const DEFAULT_LAYOUTS = {
  home: {
    leftSidebar: ['profile', 'categories'],
    main: ['posts'],
    rightSidebar: []
  },
  thread: {
    leftSidebar: ['profile', 'categories'],
    main: ['content', 'comments'],
    rightSidebar: ['toc', 'recentPosts']
  },
  category: {
    leftSidebar: ['profile', 'categories'],
    main: ['posts'],
    rightSidebar: []
  },
  tag: {
    leftSidebar: ['profile', 'categories'],
    main: ['posts'],
    rightSidebar: []
  }
}

// 获取页面可用的模块
export function getAvailableModulesForPage(pageType) {
  return Object.values(AVAILABLE_MODULES).filter(
    module => module.pages.includes(pageType)
  )
}

export function LayoutProvider({ children }) {
  const [layouts, setLayouts] = useState(DEFAULT_LAYOUTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLayoutsFromServer()
  }, [])

  // 从服务器加载所有页面的布局配置
  const loadLayoutsFromServer = async () => {
    try {
      const response = await fetch('/api/layout')
      if (response.ok) {
        const data = await response.json()
        const newLayouts = { ...DEFAULT_LAYOUTS }

        // 更新从服务器获取的布局
        for (const [pageType, config] of Object.entries(data)) {
          if (config.leftSidebar && config.main && config.rightSidebar) {
            newLayouts[pageType] = {
              layoutId: config.layoutId,
              layoutName: config.layoutName,
              leftSidebar: config.leftSidebar,
              main: config.main,
              rightSidebar: config.rightSidebar
            }
          }
        }

        setLayouts(newLayouts)
      } else {
        loadFromLocalStorage()
      }
    } catch (error) {
      console.error('Failed to load layouts from server:', error)
      loadFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }

  // 从 localStorage 加载（备用）
  const loadFromLocalStorage = () => {
    try {
      const savedLayouts = localStorage.getItem('site_layouts_v3')
      if (savedLayouts) {
        setLayouts(JSON.parse(savedLayouts))
      }
    } catch (error) {
      console.error('Failed to load layouts from localStorage:', error)
    }
  }

  // 获取特定页面的布局配置
  const getLayoutConfig = (pageType) => {
    return layouts[pageType] || DEFAULT_LAYOUTS[pageType] || DEFAULT_LAYOUTS.home
  }

  // 更新布局（管理后台用）
  const updateLayout = async (layoutId, newConfig) => {
    try {
      const response = await fetch(`/api/admin/layouts/${layoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newConfig.name || '自定义布局',
          layoutConfig: {
            leftSidebar: newConfig.leftSidebar,
            main: newConfig.main,
            rightSidebar: newConfig.rightSidebar
          }
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '保存失败')
      }

      // 重新加载布局
      await loadLayoutsFromServer()

      return { success: true }
    } catch (error) {
      console.error('Failed to save layout:', error)
      return { success: false, error: error.message }
    }
  }

  // 绑定布局到页面
  const bindLayoutToPage = async (pageType, layoutId) => {
    try {
      const response = await fetch(`/api/admin/page-layouts/${pageType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layoutId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '绑定失败')
      }

      // 重新加载布局
      await loadLayoutsFromServer()

      return { success: true }
    } catch (error) {
      console.error('Failed to bind layout:', error)
      return { success: false, error: error.message }
    }
  }

  // 重新加载布局
  const reloadLayouts = async () => {
    await loadLayoutsFromServer()
  }

  if (loading) {
    return null
  }

  return (
    <LayoutContext.Provider value={{
      layouts,
      getLayoutConfig,
      updateLayout,
      bindLayoutToPage,
      reloadLayouts,
      AVAILABLE_MODULES,
      PAGE_TYPES,
      getAvailableModulesForPage
    }}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider')
  }
  return context
}
