import { createContext, useContext, useState, useEffect } from 'react'

const LayoutContext = createContext()

// 可用的模块定义（可扩展）
export const AVAILABLE_MODULES = {
  profile: {
    id: 'profile',
    name: '个人信息',
    icon: '👤',
    color: 'bg-blue-400',
    defaultWidth: '280px'
  },
  categories: {
    id: 'categories',
    name: '分类',
    icon: '📁',
    color: 'bg-green-400',
    defaultWidth: '280px'
  },
  posts: {
    id: 'posts',
    name: '文章列表',
    icon: '📝',
    color: 'bg-red-400',
    defaultWidth: 'flex-1',
    required: true // 必须存在
  },
  tags: {
    id: 'tags',
    name: '标签云',
    icon: '🏷️',
    color: 'bg-purple-400',
    defaultWidth: '280px'
  },
  recentPosts: {
    id: 'recentPosts',
    name: '最新文章',
    icon: '📰',
    color: 'bg-yellow-400',
    defaultWidth: '280px'
  }
}

// 默认布局配置
const DEFAULT_LAYOUT = {
  leftSidebar: ['profile', 'categories'],
  main: ['posts'],
  rightSidebar: []
}

export function LayoutProvider({ children }) {
  const [layoutConfig, setLayoutConfig] = useState({ home: DEFAULT_LAYOUT })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLayoutFromServer()
  }, [])

  // 从服务器加载布局配置
  const loadLayoutFromServer = async () => {
    try {
      const response = await fetch('/api/layout')
      if (response.ok) {
        const data = await response.json()
        setLayoutConfig({
          home: {
            leftSidebar: data.leftSidebar || DEFAULT_LAYOUT.leftSidebar,
            main: data.main || DEFAULT_LAYOUT.main,
            rightSidebar: data.rightSidebar || DEFAULT_LAYOUT.rightSidebar
          }
        })
      } else {
        // API 失败时使用 localStorage 作为备用
        loadFromLocalStorage()
      }
    } catch (error) {
      console.error('Failed to load layout from server:', error)
      // 出错时使用 localStorage 作为备用
      loadFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }

  // 从 localStorage 加载（备用）
  const loadFromLocalStorage = () => {
    try {
      const savedConfig = localStorage.getItem('site_layout_config_v2')
      if (savedConfig) {
        setLayoutConfig(JSON.parse(savedConfig))
      }
    } catch (error) {
      console.error('Failed to load layout from localStorage:', error)
    }
  }

  // 保存布局配置到服务器
  const updateLayout = async (layoutKey, newConfig) => {
    // 先更新本地状态
    setLayoutConfig(prev => {
      const updated = { ...prev, [layoutKey]: newConfig }
      // 同时保存到 localStorage 作为备用
      localStorage.setItem('site_layout_config_v2', JSON.stringify(updated))
      return updated
    })

    // 保存到服务器
    try {
      const response = await fetch('/api/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '保存失败')
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to save layout to server:', error)
      return { success: false, error: error.message }
    }
  }

  const getLayoutConfig = (layoutKey) => {
    return layoutConfig[layoutKey] || DEFAULT_LAYOUT
  }

  const resetLayout = async (layoutKey) => {
    return updateLayout(layoutKey, DEFAULT_LAYOUT)
  }

  if (loading) {
    return null
  }

  return (
    <LayoutContext.Provider value={{
      layoutConfig,
      updateLayout,
      getLayoutConfig,
      resetLayout,
      AVAILABLE_MODULES,
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
