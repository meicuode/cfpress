import { Link } from 'react-router-dom'

function CategoryPage() {
  const archives = [
    {
      year: 2025,
      count: 11,
      posts: [
        { id: 1, date: '03-18', title: '一年只需 10 HKD 的香港保号卡 hahaSIM 开箱测评', tags: ['科技', '折腾'] },
      ]
    },
    {
      year: 2024,
      count: 45,
      posts: [
        { id: 2, date: '12-15', title: 'Firefox 扩展推荐 — Multi-Account Containers', tags: ['软件'] },
        { id: 3, date: '12-07', title: '把 Github 当作图床使用', tags: ['Github', '折腾'] },
        { id: 4, date: '08-08', title: '浅谈我眼中的关于 WindowsXP 的 Chromium108', tags: ['Chromium'] },
      ]
    },
    {
      year: 2023,
      count: 32,
      posts: [
        { id: 5, date: '05-05', title: '来自多设备协作发 Chris Lonsdale 的通法方法论', tags: ['技巧', '通法完想'] },
      ]
    }
  ]

  return (
    <div className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-10 max-md:p-6">
      <div className="mb-8 pb-5 border-b border-border">
        <h1 className="text-[28px] font-bold text-text-primary mb-2">归档</h1>
        <p className="text-sm text-text-secondary">按年份查看所有文章</p>
      </div>

      <div className="flex flex-col gap-10">
        {archives.map((archive) => (
          <div key={archive.year} className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold text-text-primary">{archive.year}</h2>
              <span className="text-[13px] text-text-secondary bg-white/5 px-3 py-1 rounded-xl">
                {archive.count} 篇文章
              </span>
            </div>

            <div className="flex flex-col gap-3 pl-8 max-md:pl-0">
              {archive.posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/thread/${post.id}`}
                  className="flex items-center gap-2.5 p-3 px-4 bg-white/[0.03] rounded-lg border border-border transition-all text-text-primary hover:bg-white/5 hover:border-accent-blue hover:translate-x-1 max-md:flex-wrap"
                >
                  <span className="text-[13px] text-text-secondary min-w-[50px]">
                    {post.date}
                  </span>
                  <span className="text-text-secondary">·</span>
                  <span className="text-sm flex-1">{post.title}</span>
                  <div className="flex gap-2 max-md:w-full">
                    {post.tags.map((tag, index) => (
                      <span key={index} className="text-xs text-accent-blue">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CategoryPage
