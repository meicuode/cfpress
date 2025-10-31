import { Link } from 'react-router-dom'

function HomePage() {
  // Mock data - will be replaced with API data
  const posts = [
    {
      id: 1,
      title: '一年只需 10 HKD 的香港保号卡 hahaSIM 开箱测评',
      date: '2025-03-18',
      views: '770',
      comments: 5,
      tags: ['分享', '折腾'],
      description: '本周六凌晨正好看了 10 传后，开着窗门看到了北极光...'
    },
    {
      id: 2,
      title: '近乎于手动的华为云 2H1G 香港小鸡只测不评',
      date: '2024-11-26',
      views: '1025',
      comments: 3,
      tags: ['科技', '测试'],
      description: '本周六凌晨正好看了 14 天升，拿着窗户看到星空...'
    },
    {
      id: 3,
      title: '论如何下载 Apple Music 的 ALAC 格式音乐',
      date: '2024-10-15',
      views: '892',
      comments: 8,
      tags: ['教程', '音乐'],
      description: '分享一个下载高品质音乐的方法...'
    }
  ]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-6 transition-all hover:-translate-y-0.5 hover:border-accent-blue hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
          >
            <Link to={`/thread/${post.id}`} className="block">
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
            </Link>
          </article>
        ))}
      </div>

      <div className="flex justify-center items-center gap-5 py-5">
        <button
          className="px-4 py-2 bg-bg-card text-text-primary border border-border rounded-md text-sm transition-all hover:bg-accent-blue/20 hover:border-accent-blue hover:text-accent-blue disabled:opacity-50 disabled:cursor-not-allowed"
          disabled
        >
          上一页
        </button>
        <span className="text-text-secondary text-sm">1 / 10</span>
        <button className="px-4 py-2 bg-bg-card text-text-primary border border-border rounded-md text-sm transition-all hover:bg-accent-blue/20 hover:border-accent-blue hover:text-accent-blue">
          下一页
        </button>
      </div>
    </div>
  )
}

export default HomePage
