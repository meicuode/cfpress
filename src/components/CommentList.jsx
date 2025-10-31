import { useState } from 'react'

function CommentList({ comments = [], onRefresh, onReply, onLike }) {
  const [showSettings, setShowSettings] = useState(false)

  // 生成头像占位符
  const getAvatarPlaceholder = (name) => {
    const colors = ['#4a9eff', '#6dd47e', '#ff6b6b', '#ffa502', '#a29bfe']
    const colorIndex = name.charCodeAt(0) % colors.length
    return {
      bg: colors[colorIndex],
      text: name.charAt(0).toUpperCase()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">
          {comments.length} 条评论
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="w-8 h-8 flex items-center justify-center text-accent-blue hover:bg-bg-card rounded-md transition-colors"
            title="刷新评论"
          >
            🔄
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-8 h-8 flex items-center justify-center text-text-secondary hover:bg-bg-card rounded-md transition-colors"
            title="评论设置"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.map((comment) => {
          const avatar = getAvatarPlaceholder(comment.author)

          return (
            <div
              key={comment.id}
              className="bg-white/[0.03] rounded-lg border border-border p-5 hover:border-accent-blue/30 transition-colors"
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ backgroundColor: avatar.bg }}
                >
                  {avatar.text}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Author and date */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-text-primary">
                        {comment.author}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {comment.date}
                      </span>
                    </div>
                  </div>

                  {/* Comment content */}
                  <p className="text-sm text-text-primary leading-relaxed mb-3">
                    {comment.content}
                  </p>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-xs text-text-secondary mb-3">
                    {comment.location && (
                      <span className="flex items-center gap-1">
                        📍 {comment.location}
                      </span>
                    )}
                    {comment.os && (
                      <span className="flex items-center gap-1">
                        💻 {comment.os}
                      </span>
                    )}
                    {comment.browser && (
                      <span className="flex items-center gap-1">
                        🌐 {comment.browser}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => onLike && onLike(comment.id)}
                      className="flex items-center gap-1 text-text-secondary hover:text-accent-blue transition-colors text-sm"
                    >
                      <span>👍</span>
                      {comment.likes > 0 && <span>{comment.likes}</span>}
                    </button>
                    <button
                      onClick={() => onReply && onReply(comment.id)}
                      className="flex items-center gap-1 text-text-secondary hover:text-accent-blue transition-colors text-sm"
                    >
                      <span>💬</span>
                      <span>回复</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {comments.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          <p>暂无评论，来发表第一条评论吧！</p>
        </div>
      )}
    </div>
  )
}

export default CommentList
