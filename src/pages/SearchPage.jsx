import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  // 关键词高亮函数
  const highlightKeyword = (text, keyword) => {
    if (!text || !keyword) return text

    // 转义特殊字符
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) => {
      if (part.toLowerCase() === keyword.toLowerCase()) {
        return (
          <mark
            key={index}
            className="bg-yellow-400 text-gray-900 px-1 rounded"
          >
            {part}
          </mark>
        )
      }
      return part
    })
  }

  // 搜索文章
  useEffect(() => {
    if (!query) {
      setSearchResults([])
      setTotal(0)
      return
    }

    const fetchSearchResults = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/threads?search=${encodeURIComponent(query)}&status=publish&limit=20`
        )
        const data = await response.json()
        setSearchResults(data.threads || [])
        setTotal(data.total || 0)
      } catch (error) {
        console.error('搜索失败:', error)
        setSearchResults([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [query])

  return (
    <>
      <Helmet>
        <title>搜索: {query} - CFPress</title>
      </Helmet>
      <div className="flex flex-col gap-6">
        {/* Search header */}
        <div className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-6">
          <h1 className="text-[24px] font-semibold text-text-primary mb-2">
            搜索结果
          </h1>
          <p className="text-sm text-text-secondary">
            关键词: <span className="text-accent-blue font-medium">"{query}"</span>
          </p>
          {!loading && (
            <p className="text-xs text-text-secondary mt-1">
              找到 {total} 个结果
            </p>
          )}
          {loading && (
            <p className="text-xs text-text-secondary mt-1">
              搜索中...
            </p>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-8 text-center">
            <p className="text-text-secondary">正在搜索...</p>
          </div>
        )}

        {/* Search results */}
        {!loading && searchResults.length > 0 && (
          <div className="flex flex-col gap-4">
            {searchResults.map((post) => (
              <article
                key={post.id}
                className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-6 transition-all hover:-translate-y-0.5 hover:border-accent-blue hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
              >
                <a href={`/thread/${post.id}`} className="block">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex gap-4 text-[13px] text-text-secondary">
                      <span className="flex items-center gap-1">
                        👁 {post.view_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        💬 {post.comment_count || 0}
                      </span>
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold text-text-primary mb-3 leading-snug">
                    {highlightKeyword(post.title, query)}
                  </h2>

                  <div className="flex justify-between items-center mb-3 text-[13px] max-md:flex-col max-md:items-start max-md:gap-2">
                    <span className="text-text-secondary">
                      📅 {new Date(post.created_at).toLocaleDateString('zh-CN')}
                    </span>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {post.tags.map((tag) => (
                          <span key={tag.id} className="text-accent-blue text-xs">
                            #{highlightKeyword(tag.name, query)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {post.excerpt && (
                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                      {highlightKeyword(post.excerpt, query)}
                    </p>
                  )}

                  {post.categories && post.categories.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {post.categories.map((category) => (
                        <span
                          key={category.id}
                          className="text-xs px-2 py-1 bg-accent-blue/10 text-accent-blue rounded"
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              </article>
            ))}
          </div>
        )}

        {/* No results */}
        {!loading && query && searchResults.length === 0 && (
          <div className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-8 text-center">
            <p className="text-text-secondary mb-4">
              没有找到包含 "{query}" 的文章
            </p>
            <p className="text-xs text-text-secondary">
              建议：
            </p>
            <ul className="text-xs text-text-secondary mt-2 space-y-1">
              <li>• 检查关键词是否正确</li>
              <li>• 尝试使用其他关键词</li>
              <li>• 使用更简短的关键词</li>
            </ul>
          </div>
        )}

        {/* Empty query */}
        {!query && (
          <div className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-8 text-center">
            <p className="text-text-secondary">
              请输入搜索关键词
            </p>
          </div>
        )}
      </div>
    </>
  )
}

export default SearchPage
