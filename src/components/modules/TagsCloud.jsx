import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

function TagsCloud() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      const response = await fetch('/api/tags')
      const data = await response.json()
      if (response.ok) {
        setTags(data.tags || [])
      }
    } catch (error) {
      console.error('加载标签失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-bg-card backdrop-blur-md rounded-xl p-5 border border-border">
      <h3 className="text-base font-semibold mb-3 text-text-primary">标签云</h3>
      <div className="flex flex-wrap gap-2">
        {loading ? (
          <div className="text-sm text-text-secondary text-center py-4 w-full">加载中...</div>
        ) : tags.length === 0 ? (
          <div className="text-sm text-text-secondary text-center py-4 w-full">暂无标签</div>
        ) : (
          tags.slice(0, 20).map((tag) => (
            <Link
              key={tag.id}
              to={`/tag/${tag.slug}`}
              className="px-3 py-1 bg-white/5 text-text-secondary text-sm rounded-lg transition-all hover:bg-accent-blue/20 hover:text-accent-blue"
            >
              #{tag.name}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export default TagsCloud
