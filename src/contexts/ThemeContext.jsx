import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

// 预设主题
export const presetThemes = {
  dark: {
    name: '默认深色',
    colors: {
      primary: '#1a1d29',
      card: 'rgba(40, 44, 60, 0.6)',
      textPrimary: '#e0e0e0',
      textSecondary: '#a0a0a0',
      accentBlue: '#4a9eff',
      border: 'rgba(255, 255, 255, 0.1)',
    }
  },
  light: {
    name: '浅色主题',
    colors: {
      primary: '#f5f5f5',
      card: 'rgba(255, 255, 255, 0.9)',
      textPrimary: '#333333',
      textSecondary: '#666666',
      accentBlue: '#2196F3',
      border: 'rgba(0, 0, 0, 0.1)',
    }
  },
  midnight: {
    name: '午夜蓝',
    colors: {
      primary: '#0f1419',
      card: 'rgba(21, 32, 43, 0.8)',
      textPrimary: '#e7e9ea',
      textSecondary: '#8b98a5',
      accentBlue: '#1d9bf0',
      border: 'rgba(47, 51, 54, 0.5)',
    }
  },
  forest: {
    name: '森林绿',
    colors: {
      primary: '#1a2f1a',
      card: 'rgba(34, 60, 34, 0.7)',
      textPrimary: '#e0f0e0',
      textSecondary: '#90c090',
      accentBlue: '#4caf50',
      border: 'rgba(76, 175, 80, 0.2)',
    }
  },
  sunset: {
    name: '日落橙',
    colors: {
      primary: '#2d1810',
      card: 'rgba(60, 40, 30, 0.7)',
      textPrimary: '#f0e0d0',
      textSecondary: '#c0a090',
      accentBlue: '#ff6b35',
      border: 'rgba(255, 107, 53, 0.2)',
    }
  }
}

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('dark')
  const [customColors, setCustomColors] = useState(null)
  const [loading, setLoading] = useState(true)

  // 从服务器加载主题配置
  useEffect(() => {
    loadThemeFromServer()
  }, [])

  const loadThemeFromServer = async () => {
    try {
      const response = await fetch('/api/theme')
      if (response.ok) {
        const data = await response.json()
        if (data.theme_name) {
          setCurrentTheme(data.theme_name)
        }
        if (data.custom_colors) {
          setCustomColors(data.custom_colors)
        }
      }
    } catch (error) {
      console.error('Failed to load theme from server:', error)
      // 降级到 localStorage
      const savedTheme = localStorage.getItem('theme') || 'dark'
      const savedCustomColors = localStorage.getItem('customThemeColors')
      setCurrentTheme(savedTheme)
      if (savedCustomColors) {
        try {
          setCustomColors(JSON.parse(savedCustomColors))
        } catch (e) {
          console.error('Failed to parse custom colors:', e)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // 应用主题到 CSS 变量
  useEffect(() => {
    if (loading) return

    const colors = customColors || presetThemes[currentTheme]?.colors || presetThemes.dark.colors

    // 设置 CSS 变量
    document.documentElement.style.setProperty('--color-primary', colors.primary)
    document.documentElement.style.setProperty('--color-card', colors.card)
    document.documentElement.style.setProperty('--color-text-primary', colors.textPrimary)
    document.documentElement.style.setProperty('--color-text-secondary', colors.textSecondary)
    document.documentElement.style.setProperty('--color-accent-blue', colors.accentBlue)
    document.documentElement.style.setProperty('--color-border', colors.border)

    // 同时设置旧的 data-theme 属性以兼容
    document.documentElement.setAttribute('data-theme', currentTheme)

    // 保存到 localStorage 作为降级方案
    localStorage.setItem('theme', currentTheme)
    if (customColors) {
      localStorage.setItem('customThemeColors', JSON.stringify(customColors))
    } else {
      localStorage.removeItem('customThemeColors')
    }
  }, [currentTheme, customColors, loading])

  // 切换预设主题
  const switchTheme = async (themeName) => {
    setCurrentTheme(themeName)
    setCustomColors(null)

    try {
      // 保存到服务器
      await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme_name: themeName,
          custom_colors: null
        })
      })
    } catch (error) {
      console.error('Failed to save theme to server:', error)
    }
  }

  // 设置自定义颜色
  const setCustomTheme = async (colors) => {
    setCustomColors(colors)
    setCurrentTheme('custom')

    try {
      // 保存到服务器
      await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme_name: 'custom',
          custom_colors: colors
        })
      })
    } catch (error) {
      console.error('Failed to save custom theme to server:', error)
    }
  }

  // 获取当前主题颜色
  const getCurrentColors = () => {
    return customColors || presetThemes[currentTheme]?.colors || presetThemes.dark.colors
  }

  // 兼容旧的 toggleTheme 方法
  const toggleTheme = () => {
    switchTheme(currentTheme === 'dark' ? 'light' : 'dark')
  }

  if (loading) {
    return null // 或者返回一个加载动画
  }

  return (
    <ThemeContext.Provider value={{
      theme: currentTheme, // 兼容旧代码
      currentTheme,
      customColors,
      presetThemes,
      switchTheme,
      setCustomTheme,
      getCurrentColors,
      toggleTheme, // 兼容旧代码
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
