import { useParams } from 'react-router-dom'

function ThreadPage() {
  const { id } = useParams()

  // Mock data
  const post = {
    id,
    title: '一年只需 10 HKD 的香港保号卡 hahaSIM 开箱测评',
    date: '2025-03-18',
    views: 770,
    comments: 5,
    tags: ['分享', '折腾', '保号卡'],
    content: `
      <p>本周六凌晨正好看了 10 传后，开着窗门看到了北极光...</p>
      <p>这是一篇关于 hahaSIM 的详细测评文章。</p>
      <h2>开箱体验</h2>
      <p>收到卡片后的第一印象...</p>
      <h2>使用感受</h2>
      <p>实际使用中的体验...</p>
    `
  }

  const comments = [
    {
      id: 1,
      author: '用户A',
      date: '2025-03-19',
      content: '感谢分享，很有帮助！'
    },
    {
      id: 2,
      author: '用户B',
      date: '2025-03-20',
      content: '请问在哪里购买？'
    }
  ]

  return (
    <div className="flex flex-col gap-8">
      <article className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-10 max-md:p-6">
        <header className="mb-8 pb-5 border-b border-border">
          <h1 className="text-[28px] font-bold text-text-primary mb-4 leading-tight">
            {post.title}
          </h1>
          <div className="flex gap-5 text-[13px] text-text-secondary mb-3">
            <span>📅 {post.date}</span>
            <span>👁 {post.views}</span>
            <span>💬 {post.comments}</span>
          </div>
          <div className="flex gap-2.5">
            {post.tags.map((tag, index) => (
              <span key={index} className="text-accent-blue text-[13px]">
                #{tag}
              </span>
            ))}
          </div>
        </header>

        <div
          className="text-base leading-loose text-text-primary [&_h2]:text-[22px] [&_h2]:my-8 [&_h2]:mb-4 [&_h2]:text-text-primary [&_p]:mb-4"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      <section className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-8 max-md:p-5">
        <h2 className="text-xl font-semibold mb-5 text-text-primary">
          评论 ({comments.length})
        </h2>
        <div className="flex flex-col gap-5 mb-8">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 bg-white/[0.03] rounded-lg border border-border"
            >
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-text-primary text-sm">
                  {comment.author}
                </span>
                <span className="text-xs text-text-secondary">{comment.date}</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {comment.content}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <textarea
            className="w-full p-3 bg-white/5 border border-border rounded-lg text-text-primary text-sm resize-y focus:outline-none focus:border-accent-blue"
            placeholder="写下你的评论..."
            rows="4"
          />
          <button className="self-end px-6 py-2.5 bg-accent-blue text-white rounded-md text-sm font-medium transition-all hover:bg-[#3a8eef] hover:-translate-y-px">
            发表评论
          </button>
        </div>
      </section>
    </div>
  )
}

export default ThreadPage
