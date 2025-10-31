import { useState } from 'react'
import { useParams } from 'react-router-dom'
import CommentForm from '../components/CommentForm'
import CommentList from '../components/CommentList'
import PostNavigation from '../components/PostNavigation'

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

  // Mock navigation posts
  const prevPost = {
    id: '0',
    title: '小米澎湃OS线过社区答题限制解锁BootLoader'
  }

  const nextPost = {
    id: '2',
    title: 'PagerMaid-Pyro 人形机器人使用指北'
  }

  const [comments, setComments] = useState([
    {
      id: 1,
      author: '五行缺失',
      date: '2025-05-10',
      content: '建站一直用的阿里云，华为云还真没有用过',
      location: '加利福尼亚',
      os: 'Windows 7',
      browser: 'Chrome 86.0.4240.198',
      likes: 3
    },
    {
      id: 2,
      author: '用户B',
      date: '2025-03-20',
      content: '请问在哪里购买？',
      location: '北京',
      os: 'macOS',
      browser: 'Safari 16.0',
      likes: 0
    }
  ])

  const handleCommentSubmit = (formData) => {
    const newComment = {
      id: comments.length + 1,
      author: formData.nickname,
      date: new Date().toISOString().split('T')[0],
      content: formData.content,
      location: '未知',
      os: navigator.platform,
      browser: navigator.userAgent.split(' ').pop(),
      likes: 0
    }
    setComments([...comments, newComment])
  }

  const handleRefresh = () => {
    console.log('Refresh comments')
  }

  const handleReply = (commentId) => {
    console.log('Reply to comment:', commentId)
  }

  const handleLike = (commentId) => {
    setComments(comments.map(comment =>
      comment.id === commentId
        ? { ...comment, likes: comment.likes + 1 }
        : comment
    ))
  }

  return (
    <div className="flex flex-col gap-8 pb-8">
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
        <CommentList
          comments={comments}
          onRefresh={handleRefresh}
          onReply={handleReply}
          onLike={handleLike}
        />

        <div className="mt-8">
          <CommentForm onSubmit={handleCommentSubmit} />
        </div>
      </section>

      <PostNavigation prevPost={prevPost} nextPost={nextPost} />
    </div>
  )
}

export default ThreadPage
