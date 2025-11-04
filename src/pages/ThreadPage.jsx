import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import CommentForm from '../components/CommentForm'
import CommentList from '../components/CommentList'
import PostNavigation from '../components/PostNavigation'
import EditorJSRenderer from '../components/EditorJSRenderer'

function ThreadPage() {
  const { id } = useParams()
  const toast = useToast()
  const [thread, setThread] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [replyTo, setReplyTo] = useState(null) // 回复的评论 ID

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-')
  }

  // 加载文章详情
  useEffect(() => {
    loadThread()
  }, [id])

  // 加载评论
  useEffect(() => {
    if (id) {
      loadComments()
    }
  }, [id])

  // 设置页面标题
  useEffect(() => {
    if (thread) {
      document.title = `${thread.title} - CFPress`
    }
    // 组件卸载时恢复默认标题
    return () => {
      document.title = 'CFPress'
    }
  }, [thread])

  const loadThread = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/threads/${id}`)
      const data = await response.json()

      if (response.ok) {
        // 解析 Editor.js JSON 内容
        let parsedContent = data.thread.content
        try {
          parsedContent = JSON.parse(data.thread.content)
        } catch (e) {
          // 如果解析失败，保持原样（可能是旧的纯文本内容）
          console.warn('Content is not valid JSON, using as plain text')
        }

        setThread({
          ...data.thread,
          parsedContent // 添加解析后的内容
        })
      } else {
        setError(data.error || '加载文章失败')
      }
    } catch (err) {
      console.error('加载文章失败:', err)
      setError('加载文章失败')
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/comments?thread_id=${id}`)
      const data = await response.json()

      if (response.ok) {
        setComments(data.comments || [])
      }
    } catch (err) {
      console.error('加载评论失败:', err)
    }
  }

  const handleCommentSubmit = async (formData) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thread_id: id,
          parent_id: replyTo, // 如果是回复，传递 parent_id
          author_name: formData.nickname,
          author_email: formData.email,
          author_website: formData.website || null,
          content: formData.content,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // 重新加载评论列表
        await loadComments()
        // 重新加载文章以更新评论数
        await loadThread()
        // 清除回复状态
        setReplyTo(null)
        toast.success(replyTo ? '回复发布成功！' : '评论发布成功！')
      } else {
        toast.error(data.error || '评论发布失败')
      }
    } catch (err) {
      console.error('发布评论失败:', err)
      toast.error('评论发布失败')
    }
  }

  const handleRefresh = () => {
    loadComments()
  }

  const handleReply = (commentId) => {
    setReplyTo(commentId)
    // 滚动到评论表单
    const formElement = document.querySelector('#comment-form')
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    toast.info('正在回复评论...')
  }

  const handleCancelReply = () => {
    setReplyTo(null)
  }

  const handleLike = async (commentId) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        // 更新本地评论的点赞数
        setComments(comments.map(comment =>
          comment.id === commentId
            ? { ...comment, like_count: data.likeCount }
            : comment
        ))
        toast.success('点赞成功！')
      } else {
        toast.error(data.error || '点赞失败')
      }
    } catch (err) {
      console.error('点赞失败:', err)
      toast.error('点赞失败')
    }
  }

  // 加载状态
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-text-secondary">加载中...</div>
      </div>
    )
  }

  // 错误状态
  if (error || !thread) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-red-400">{error || '文章不存在'}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <article className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-10 max-md:p-6">
        <header className="mb-8 pb-5 border-b border-border">
          <h1 className="text-[28px] font-bold text-text-primary mb-4 leading-tight">
            {thread.title}
          </h1>
          <div className="flex gap-5 text-[13px] text-text-secondary mb-3">
            <span>📅 {formatDate(thread.published_at || thread.created_at)}</span>
            <span>👁 {thread.view_count || 0}</span>
            <span>💬 {thread.comment_count || 0}</span>
          </div>
          {thread.tags && thread.tags.length > 0 && (
            <div className="flex gap-2.5 flex-wrap">
              {thread.tags.map((tag) => (
                <span key={tag.id} className="text-accent-blue text-[13px]">
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
          {thread.categories && thread.categories.length > 0 && (
            <div className="flex gap-2.5 flex-wrap mt-2">
              {thread.categories.map((category) => (
                <span key={category.id} className="text-text-secondary text-[13px] px-2 py-0.5 bg-bg-primary/50 rounded">
                  {category.name}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="text-base leading-loose text-text-primary">
          {thread.parsedContent && typeof thread.parsedContent === 'object' ? (
            <EditorJSRenderer data={thread.parsedContent} />
          ) : (
            <div
              className="[&_h2]:text-[22px] [&_h2]:my-8 [&_h2]:mb-4 [&_h2]:text-text-primary [&_p]:mb-4 whitespace-pre-wrap"
              style={{ wordBreak: 'break-word' }}
            >
              {thread.content}
            </div>
          )}
        </div>
      </article>

      <section className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-8 max-md:p-5">
        <CommentList
          comments={comments.map(comment => ({
            id: comment.id,
            parent_id: comment.parent_id,
            author: comment.author_name,
            date: formatDate(comment.created_at),
            created_at: comment.created_at, // 传递原始时间戳用于排序
            content: comment.content,
            location: comment.location || '未知',
            os: comment.os || '未知',
            browser: comment.browser || '未知',
            likes: comment.like_count || 0
          }))}
          onRefresh={handleRefresh}
          onReply={handleReply}
          onLike={handleLike}
        />

        <div id="comment-form" className="mt-8">
          {replyTo && (
            <div className="mb-4 p-3 bg-accent-blue/10 border border-accent-blue/30 rounded-lg flex items-center justify-between">
              <span className="text-text-primary text-sm">
                正在回复评论 #{replyTo}
              </span>
              <button
                onClick={handleCancelReply}
                className="text-text-secondary hover:text-text-primary text-sm transition-colors"
              >
                取消回复
              </button>
            </div>
          )}
          <CommentForm onSubmit={handleCommentSubmit} />
        </div>
      </section>

      {/* TODO: 实现上一篇/下一篇导航 */}
      {/* <PostNavigation prevPost={prevPost} nextPost={nextPost} /> */}
    </div>
  )
}

export default ThreadPage
