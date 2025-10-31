import { useParams, Link } from 'react-router-dom'

function TagPage() {
  const { tagName } = useParams()

  const posts = [
    { id: 1, title: '文章标题 1', date: '2025-03-18' },
    { id: 2, title: '文章标题 2', date: '2024-12-15' },
    { id: 3, title: '文章标题 3', date: '2024-11-20' },
  ]

  return (
    <div className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-10 max-md:p-6">
      <div className="mb-8 pb-5 border-b border-border">
        <h1 className="text-[28px] font-bold text-accent-blue mb-2">#{tagName}</h1>
        <p className="text-sm text-text-secondary">{posts.length} 篇文章</p>
      </div>

      <div className="flex flex-col gap-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            to={`/thread/${post.id}`}
            className="flex items-center gap-5 p-4 bg-white/[0.03] rounded-lg border border-border transition-all text-text-primary hover:bg-white/5 hover:border-accent-blue hover:translate-x-1 max-md:flex-col max-md:items-start max-md:gap-2"
          >
            <span className="text-[13px] text-text-secondary min-w-[100px] max-md:min-w-0">
              {post.date}
            </span>
            <span className="text-[15px] flex-1">{post.title}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default TagPage
