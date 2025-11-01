import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

function AdminThreadEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  // 状态管理
  const [categoriesList, setCategoriesList] = useState([])
  const [popularTags, setPopularTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [thread, setThread] = useState({
    title: '',
    content: '',
    categories: [], // 存储分类 ID
    tags: [], // 存储标签名称
    status: 'draft'
  })

  const [newTag, setNewTag] = useState('')

  // 加载分类和标签
  useEffect(() => {
    loadCategories()
    loadPopularTags()

    // 如果是编辑模式，加载文章数据
    if (isEditing) {
      loadThread()
    }
  }, [id])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategoriesList(data.categories || [])
    } catch (error) {
      console.error('加载分类失败:', error)
      alert('加载分类失败')
    }
  }

  const loadPopularTags = async () => {
    try {
      const response = await fetch('/api/tags?order=popular')
      const data = await response.json()
      setPopularTags((data.tags || []).slice(0, 12))
    } catch (error) {
      console.error('加载标签失败:', error)
    }
  }

  const loadThread = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/threads/${id}`)
      const data = await response.json()

      if (response.ok) {
        const threadData = data.thread
        setThread({
          title: threadData.title || '',
          content: threadData.content || '',
          categories: threadData.categories?.map(c => c.id) || [],
          tags: threadData.tags?.map(t => t.name) || [],
          status: threadData.status || 'draft'
        })
      } else {
        alert('加载文章失败: ' + (data.error || '未知错误'))
        navigate('/admin/threads')
      }
    } catch (error) {
      console.error('加载文章失败:', error)
      alert('加载文章失败: ' + error.message)
      navigate('/admin/threads')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (status) => {
    if (!thread.title.trim()) {
      alert('请输入文章标题')
      return
    }
    if (!thread.content.trim()) {
      alert('请输入文章内容')
      return
    }

    setSaving(true)
    try {
      const data = {
        ...thread,
        status,
        author_id: 1 // TODO: 从认证系统获取
      }

      // 根据是否是编辑模式决定使用 POST 还是 PUT
      const url = isEditing ? `/api/threads/${id}` : '/api/threads'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        alert(result.message || (status === 'publish' ? '文章已发布' : '草稿已保存'))
        navigate('/admin/threads')
      } else {
        alert(result.error || '保存失败')
      }
    } catch (error) {
      console.error('保存文章失败:', error)
      alert('保存失败: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCategoryToggle = (categoryId) => {
    setThread(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId]
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
      {/* 加载中状态 */}
      {loading ? (
        <div className="flex-1 bg-white rounded-lg shadow p-8">
          <div className="text-center text-gray-500">加载中...</div>
        </div>
      ) : (
        <>
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
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存草稿'}
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
              预览
            </button>
            <button
              onClick={() => handleSubmit('publish')}
              disabled={saving}
              className="px-4 py-2 bg-[#0073aa] text-white rounded text-sm hover:bg-[#005a87] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '发布中...' : '发布'}
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
            {categoriesList.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-2">加载中...</div>
            ) : (
              categoriesList.map((category) => (
                <label key={category.id} className="flex items-center gap-2 py-1 hover:bg-gray-50 px-2 rounded">
                  <input
                    type="checkbox"
                    checked={thread.categories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="rounded"
                  />
                  <span className="text-sm text-[#23282d]">{category.name}</span>
                </label>
              ))
            )}
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
              {popularTags.length === 0 ? (
                <div className="text-xs text-gray-500">暂无常用标签</div>
              ) : (
                popularTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      if (!thread.tags.includes(tag.name)) {
                        setThread(prev => ({ ...prev, tags: [...prev.tags, tag.name] }))
                      }
                    }}
                    className="text-xs text-[#0073aa] hover:underline"
                  >
                    {tag.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  )
}

export default AdminThreadEditorPage
