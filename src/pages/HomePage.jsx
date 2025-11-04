import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getThreadExcerpt } from '../utils/editorjs'

function HomePage() {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 10 // 每页显示10篇文章

  // 设置页面标题
  useEffect(() => {
    document.title = 'CFPress - 首页'
  }, [])

  useEffect(() => {
    loadThreads()
  }, [page])

  const loadThreads = async () => {
    setLoading(true)
    try {
      const offset = (page - 1) * limit
      const response = await fetch(`/api/threads?status=publish&limit=${limit}&offset=${offset}`)
      const data = await response.json()

      if (response.ok) {
        setThreads(data.threads || [])
        setTotalCount(data.total || 0)
      } else {
        console.error('加载文章失败:', data.error)
      }
    } catch (error) {
      console.error('加载文章失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-')
  }

  const totalPages = Math.ceil(totalCount / limit)

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-text-secondary">加载中...</div>
      </div>
    )
  }

  if (threads.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-text-secondary">暂无文章</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        {threads.map((thread) => (
          <article
            key={thread.id}
            className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-6 transition-all hover:-translate-y-0.5 hover:border-accent-blue hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
          >
            <Link to={`/thread/${thread.id}`} className="flex gap-6 max-md:flex-col">
              {/* 左侧：文章信息 */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-text-primary mb-3 leading-snug">
                  {thread.title}
                </h2>

                <div className="flex items-center gap-4 mb-3 text-[13px] flex-wrap">
                  <span className="text-text-secondary">📅 {formatDate(thread.published_at || thread.created_at)}</span>
                  <span className="flex items-center gap-1 text-text-secondary">👁 {thread.view_count || 0}</span>
                  <span className="flex items-center gap-1 text-text-secondary">💬 {thread.comment_count || 0}</span>
                </div>

                <div className="flex gap-2 mb-3">
                  {thread.tags && thread.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      to={`/tag/${tag.slug}`}
                      className="text-accent-blue text-xs hover:underline"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>

                {/* 文章摘要 */}
                <p className="text-sm text-text-secondary leading-relaxed line-clamp-4">
                  {getThreadExcerpt(thread, 300)}
                </p>
              </div>

              {/* 右侧：缩略图 */}
              <div className="flex-shrink-0">
                <img
                  src={thread.thumbnail || `https://via.placeholder.com/240x218/4a9eff/ffffff?text=${encodeURIComponent(thread.title.substring(0, 10))}`}
                  alt={thread.title}
                  className="w-[240px] h-[218px] object-cover rounded-lg max-md:w-full max-md:h-auto"
                />
              </div>
            </Link>
          </article>
        ))}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-5 py-5">
          <button
            className="px-4 py-2 bg-bg-card text-text-primary border border-border rounded-md text-sm transition-all hover:bg-accent-blue/20 hover:border-accent-blue hover:text-accent-blue disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </button>
          <span className="text-text-secondary text-sm">{page} / {totalPages}</span>
          <button
            className="px-4 py-2 bg-bg-card text-text-primary border border-border rounded-md text-sm transition-all hover:bg-accent-blue/20 hover:border-accent-blue hover:text-accent-blue disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}

export default HomePage
