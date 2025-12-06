import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

function RecentPosts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentPosts()
  }, [])

  const loadRecentPosts = async () => {
    try {
      const response = await fetch('/api/threads?status=publish&limit=5&offset=0')
      const data = await response.json()
      if (response.ok) {
        setPosts(data.threads || [])
      }
    } catch (error) {
      console.error('加载最新文章失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    })
  }

  return (
    <div className="bg-bg-card backdrop-blur-md rounded-xl p-5 border border-border">
      <h3 className="text-base font-semibold mb-3 text-text-primary">最新文章</h3>
      <div className="flex flex-col gap-2">
        {loading ? (
          <div className="text-sm text-text-secondary text-center py-4">加载中...</div>
        ) : posts.length === 0 ? (
          <div className="text-sm text-text-secondary text-center py-4">暂无文章</div>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              to={`/thread/${post.id}`}
              className="flex items-start gap-3 p-2 rounded-lg transition-all hover:bg-white/5 group"
            >
              {post.thumbnail && (
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  className="w-12 h-12 object-cover rounded flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm text-text-secondary group-hover:text-text-primary line-clamp-2 leading-snug">
                  {post.title}
                </h4>
                <span className="text-xs text-text-secondary/60 mt-1 block">
                  {formatDate(post.published_at || post.created_at)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export default RecentPosts
