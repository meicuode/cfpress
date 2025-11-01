import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

function AdminThreadEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  // Mock categories data
  const categoriesList = [
    'NAT64', 'VPS测评', '前端', '前端面试题', '华为云考试',
    '教程', '未分类', '油猴插件', '测试', '游戏OS', '玩机',
    '移动云电脑', '耳机', '语言学习', '转载', '闲聊', '黑苹果'
  ]

  const [thread, setThread] = useState({
    title: '',
    content: '',
    categories: [],
    tags: [],
    status: 'draft'
  })

  const [newTag, setNewTag] = useState('')

  const handleSubmit = (status) => {
    const data = { ...thread, status }
    console.log('Saving thread:', data)
    // TODO: Implement API call to save thread
    alert(status === 'publish' ? '文章已发布' : '草稿已保存')
    navigate('/admin/threads')
  }

  const handleCategoryToggle = (category) => {
    setThread(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !thread.tags.includes(newTag.trim())) {
      setThread(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tag) => {
    setThread(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  return (
    <div className="flex gap-6">
      {/* Main editor area */}
      <div className="flex-1 bg-white rounded-lg shadow">
        {/* Top toolbar */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center bg-[#0073aa] text-white rounded hover:bg-[#005a87]">
              ➕
            </button>
            <button className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">
              ↶
            </button>
            <button className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">
              ↷
            </button>
            <button className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">
              ☰
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSubmit('draft')}
              className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              保存草稿
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
              预览
            </button>
            <button
              onClick={() => handleSubmit('publish')}
              className="px-4 py-2 bg-[#0073aa] text-white rounded text-sm hover:bg-[#005a87]"
            >
              发布
            </button>
          </div>
        </div>

        {/* Title input */}
        <div className="p-8">
          <input
            type="text"
            value={thread.title}
            onChange={(e) => setThread({ ...thread, title: e.target.value })}
            placeholder="添加标题"
            className="w-full text-4xl font-normal text-[#23282d] border-none outline-none placeholder:text-gray-300"
          />
        </div>

        {/* Content editor */}
        <div className="px-8 pb-8">
          <textarea
            value={thread.content}
            onChange={(e) => setThread({ ...thread, content: e.target.value })}
            placeholder="输入 / 来选择一个区块"
            className="w-full min-h-[400px] text-base text-[#23282d] border border-gray-200 rounded p-4 outline-none resize-none"
          />
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-[300px] bg-white rounded-lg shadow p-6 h-fit">
        {/* Categories */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[#23282d] mb-3 flex items-center justify-between">
            <span>分类目录</span>
            <button className="text-xs text-[#0073aa] hover:underline">▲</button>
          </h3>

          {/* Search categories */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="搜索分类"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>

          {/* Categories list */}
          <div className="max-h-[200px] overflow-y-auto border border-gray-200 rounded p-2">
            {categoriesList.map((category) => (
              <label key={category} className="flex items-center gap-2 py-1 hover:bg-gray-50 px-2 rounded">
                <input
                  type="checkbox"
                  checked={thread.categories.includes(category)}
                  onChange={() => handleCategoryToggle(category)}
                  className="rounded"
                />
                <span className="text-sm text-[#23282d]">{category}</span>
              </label>
            ))}
          </div>

          <button className="text-xs text-[#0073aa] hover:underline mt-2">
            + 添加分类
          </button>
        </div>

        {/* Tags */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-[#23282d] mb-3 flex items-center justify-between">
            <span>标签</span>
            <button className="text-xs text-[#0073aa] hover:underline">▲</button>
          </h3>

          {/* Add tag input */}
          <div className="mb-3">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="添加标签"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <p className="text-xs text-[#646970] mt-1">用逗号或回车键分隔。</p>
          </div>

          {/* Selected tags */}
          {thread.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {thread.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Most used tags */}
          <div>
            <p className="text-xs font-medium text-[#646970] mb-2">最多使用</p>
            <div className="flex flex-wrap gap-2">
              {['Dedirock', 'gaussDb', '开发者认证', '高斯db', '华为云', 'windows远程桌面',
                '实用脚本', 'js基础', '面试题', 'NodeLoc插件', '7$', 'Dedirock'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    if (!thread.tags.includes(tag)) {
                      setThread(prev => ({ ...prev, tags: [...prev.tags, tag] }))
                    }
                  }}
                  className="text-xs text-[#0073aa] hover:underline"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminThreadEditorPage
