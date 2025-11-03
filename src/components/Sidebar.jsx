import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

function Sidebar() {
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

  // 分类图标映射（可以根据分类 slug 或名称自定义）
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
    <aside className="w-[280px] flex-shrink-0 flex flex-col gap-5 max-[968px]:w-full sticky top-[90px] self-start max-h-[calc(100vh-110px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {/* Profile Card */}
      <div className="bg-bg-card backdrop-blur-md rounded-xl p-8 px-5 text-center border border-border">
        <div className="w-[120px] h-[120px] mx-auto mb-4 rounded-xl overflow-hidden border-2 border-border">
          <img src="/avatar.png" alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-lg font-semibold mb-2 text-text-primary">没有梦想的成品</h2>
        <p className="text-[13px] text-text-secondary mb-5 leading-relaxed">
          在计时赛金会是怎样的表现呢就看想
        </p>

        <div className="flex justify-center gap-2.5">
          <a
            href="#"
            className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-lg transition-all text-lg hover:bg-white/10 hover:-translate-y-0.5"
            title="GitHub"
          >
            <span>💻</span>
          </a>
          <a
            href="#"
            className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-lg transition-all text-lg hover:bg-white/10 hover:-translate-y-0.5"
            title="WeChat"
          >
            <span>💬</span>
          </a>
          <a
            href="#"
            className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-lg transition-all text-lg hover:bg-white/10 hover:-translate-y-0.5"
            title="Steam"
          >
            <span>🎮</span>
          </a>
          <a
            href="#"
            className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-lg transition-all text-lg hover:bg-white/10 hover:-translate-y-0.5"
            title="Email"
          >
            <span>✉️</span>
          </a>
        </div>
      </div>

      {/* Categories */}
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
    </aside>
  )
}

export default Sidebar
