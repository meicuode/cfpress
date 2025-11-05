import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  // Mock search results (will be replaced with API call)
  const searchResults = [
    {
      id: 1,
      title: `搜索结果: ${query} - 文章标题 1`,
      date: '2025-03-18',
      views: '770',
      comments: 5,
      tags: ['分享', '折腾'],
      description: `包含关键词"${query}"的文章描述...`,
    },
    {
      id: 2,
      title: `搜索结果: ${query} - 文章标题 2`,
      date: '2024-11-26',
      views: '1025',
      comments: 3,
      tags: ['科技', '测试'],
      description: `另一篇包含关键词"${query}"的文章...`,
    },
  ]

  return (
    <>
      <Helmet>
        <title>搜索结果 - CFPress</title>
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
        <p className="text-xs text-text-secondary mt-1">
          找到 {searchResults.length} 个结果
        </p>
      </div>

      {/* Search results */}
      <div className="flex flex-col gap-4">
        {searchResults.map((post) => (
          <article
            key={post.id}
            className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-6 transition-all hover:-translate-y-0.5 hover:border-accent-blue hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
          >
            <a href={`/thread/${post.id}`} className="block">
              <div className="flex justify-between items-center mb-3">
                <div className="flex gap-4 text-[13px] text-text-secondary">
                  <span className="flex items-center gap-1">👁 {post.views}</span>
                  <span className="flex items-center gap-1">💬 {post.comments}</span>
                </div>
              </div>

              <h2 className="text-xl font-semibold text-text-primary mb-3 leading-snug">
                {post.title}
              </h2>

              <div className="flex justify-between items-center mb-3 text-[13px] max-md:flex-col max-md:items-start max-md:gap-2">
                <span className="text-text-secondary">📅 {post.date}</span>
                <div className="flex gap-2">
                  {post.tags.map((tag, index) => (
                    <span key={index} className="text-accent-blue text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {post.description && (
                <p className="text-sm text-text-secondary leading-relaxed">
                  {post.description}
                </p>
              )}
            </a>
          </article>
        ))}
      </div>

      {searchResults.length === 0 && (
        <div className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-8 text-center">
          <p className="text-text-secondary">
            没有找到包含 "{query}" 的文章
          </p>
        </div>
      )}
    </div>
    </>
  )
}

export default SearchPage