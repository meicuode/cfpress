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
      description: '本周六凌晨正好看了 10 传后，开着窗门看到了北极光...',
      thumbnail: 'https://via.placeholder.com/240x218/4a9eff/ffffff?text=hahaSIM'
    },
    {
      id: 2,
      title: '近乎于手动的华为云 2H1G 香港小鸡只测不评',
      date: '2024-11-26',
      views: '1025',
      comments: 3,
      tags: ['科技', '测试'],
      description: '本周六凌晨正好看了 14 天升，拿着窗户看到星空...',
      thumbnail: 'https://via.placeholder.com/240x218/6dd47e/ffffff?text=HuaweiCloud'
    },
    {
      id: 3,
      title: '论如何下载 Apple Music 的 ALAC 格式音乐',
      date: '2024-10-15',
      views: '892',
      comments: 8,
      tags: ['教程', '音乐'],
      description: '分享一个下载高品质音乐的方法...',
      thumbnail: 'https://via.placeholder.com/240x218/ff6b6b/ffffff?text=Apple+Music'
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
            <Link to={`/thread/${post.id}`} className="flex gap-6 max-md:flex-col">
              {/* 左侧：文章信息 */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-text-primary mb-3 leading-snug">
                  {post.title}
                </h2>

                <div className="flex items-center gap-4 mb-3 text-[13px] flex-wrap">
                  <span className="text-text-secondary">📅 {post.date}</span>
                  <span className="flex items-center gap-1 text-text-secondary">👁 {post.views}</span>
                  <span className="flex items-center gap-1 text-text-secondary">💬 {post.comments}</span>
                </div>

                <div className="flex gap-2 mb-3">
                  {post.tags.map((tag, index) => (
                    <span key={index} className="text-accent-blue text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>

                {post.description && (
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {post.description}
                  </p>
                )}
              </div>

              {/* 右侧：缩略图 */}
              {post.thumbnail && (
                <div className="flex-shrink-0">
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-[240px] h-[218px] object-cover rounded-lg max-md:w-full max-md:h-auto"
                  />
                </div>
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
