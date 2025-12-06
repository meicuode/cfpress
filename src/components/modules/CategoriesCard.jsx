import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

function CategoriesCard() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (response.ok) {
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('加载分类失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 分类图标映射
  const getCategoryIcon = (category) => {
    const iconMap = {
      'tech': '💻',
      'life': '📅',
      'share': '📝',
      'archive': '📦',
      'uncategorized': '📂'
    }
    return iconMap[category.slug] || '📌'
  }

  return (
    <div className="bg-bg-card backdrop-blur-md rounded-xl p-5 border border-border">
      <h3 className="text-base font-semibold mb-2 text-text-primary">分类</h3>
      <div className="flex flex-col gap-1">
        {loading ? (
          <div className="text-sm text-text-secondary text-center py-4">加载中...</div>
        ) : categories.length === 0 ? (
          <div className="text-sm text-text-secondary text-center py-4">暂无分类</div>
        ) : (
          categories.slice(0, 5).map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-text-secondary transition-all text-sm hover:bg-white/5 hover:text-text-primary"
            >
              <span className="text-base">{getCategoryIcon(category)}</span>
              <span className="flex-1">{category.name}</span>
              <span className="bg-accent-blue/20 text-accent-blue px-2 py-0.5 rounded-xl text-xs font-medium">
                {category.thread_count || 0}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export default CategoriesCard
