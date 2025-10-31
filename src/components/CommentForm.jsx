import { useState } from 'react'

function CommentForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    website: '',
    content: '',
  })
  const [showEmoji, setShowEmoji] = useState(false)

  const maxLength = 500
  const contentLength = formData.content.length

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.nickname.trim() && formData.email.trim() && formData.content.trim()) {
      onSubmit(formData)
      setFormData({ nickname: '', email: '', website: '', content: '' })
    }
  }

  const handlePreview = () => {
    // TODO: Implement preview functionality
    console.log('Preview:', formData)
  }

  const insertEmoji = (emoji) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + emoji
    }))
    setShowEmoji(false)
  }

  const commonEmojis = ['😀', '😂', '😊', '😍', '🤔', '👍', '👎', '❤️', '🎉', '🔥']

  return (
    <div className="bg-white/[0.03] rounded-lg border border-border p-6">
      {/* Content textarea */}
      <div className="relative mb-4">
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value.slice(0, maxLength) })}
          placeholder="写下你的评论..."
          className="w-full h-32 p-4 bg-bg-card border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary resize-none focus:outline-none focus:border-accent-blue"
          maxLength={maxLength}
        />
        <div className="absolute bottom-3 right-3 text-xs text-text-secondary">
          {contentLength}/{maxLength}
        </div>
      </div>

      {/* Form inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <input
            type="text"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            placeholder="昵称"
            required
            className="w-full px-4 py-2 bg-bg-card border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-blue"
          />
          <span className="text-xs text-text-secondary ml-2">必填</span>
        </div>
        <div>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="邮箱"
            required
            className="w-full px-4 py-2 bg-bg-card border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-blue"
          />
          <span className="text-xs text-text-secondary ml-2">必填</span>
        </div>
        <div>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="网址"
            className="w-full px-4 py-2 bg-bg-card border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-blue"
          />
          <span className="text-xs text-text-secondary ml-2">选填</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-bg-card rounded-md transition-colors"
            title="插入表情"
          >
            😀
          </button>
          {showEmoji && (
            <div className="absolute bottom-full left-0 mb-2 p-3 bg-bg-card border border-border rounded-lg shadow-lg flex gap-2 flex-wrap w-64">
              {commonEmojis.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="w-8 h-8 text-lg hover:bg-white/5 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handlePreview}
            className="px-4 py-2 bg-bg-card text-text-primary border border-border rounded-md text-sm transition-all hover:bg-white/5"
          >
            预览
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-accent-blue text-white rounded-md text-sm font-medium transition-all hover:bg-[#3a8eef]"
          >
            提交
          </button>
        </div>
      </div>
    </div>
  )
}

export default CommentForm
