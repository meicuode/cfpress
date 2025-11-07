import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import FilePickerModal from '../../components/FilePickerModal'

function AdminThreadEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const isEditing = !!id
  const contentTextareaRef = useRef(null)

  // 状态管理
  const [categoriesList, setCategoriesList] = useState([])
  const [popularTags, setPopularTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showFilePicker, setShowFilePicker] = useState(false)

  const [thread, setThread] = useState({
    title: '',
    content: '',
    categories: [], // 存储分类 ID
    tags: [], // 存储标签名称
    status: 'draft'
  })

  const [newTag, setNewTag] = useState('')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

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
      toast.error('加载分类失败')
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
        toast.error('加载文章失败: ' + (data.error || '未知错误'))
        navigate('/admin/threads')
      }
    } catch (error) {
      console.error('加载文章失败:', error)
      toast.error('加载文章失败: ' + error.message)
      navigate('/admin/threads')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (status) => {
    if (!thread.title.trim()) {
      toast.warning('请输入文章标题')
      return
    }
    if (!thread.content.trim()) {
      toast.warning('请输入文章内容')
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
        toast.success(result.message || (status === 'publish' ? '文章已发布' : '草稿已保存'))
        navigate('/admin/threads')
      } else {
        toast.error(result.error || '保存失败')
      }
    } catch (error) {
      console.error('保存文章失败:', error)
      toast.error('保存失败: ' + error.message)
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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.warning('请输入分类名称')
      return
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName.trim()
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('分类创建成功')
        setNewCategoryName('')
        setShowAddCategory(false)
        // 重新加载分类列表
        await loadCategories()
        // 自动选中新创建的分类
        if (result.id) {
          setThread(prev => ({
            ...prev,
            categories: [...prev.categories, result.id]
          }))
        }
      } else {
        toast.error(result.error || '创建分类失败')
      }
    } catch (error) {
      console.error('创建分类失败:', error)
      toast.error('创建分类失败: ' + error.message)
    }
  }

  const handleDeleteCategory = async (categoryId, categoryName) => {
    const confirmed = await confirm({
      title: '删除分类',
      message: `确定要删除分类"${categoryName}"吗？`,
      confirmText: '删除',
      cancelText: '取消',
      type: 'danger'
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('分类已删除')
        // 从当前文章的选中分类中移除
        setThread(prev => ({
          ...prev,
          categories: prev.categories.filter(c => c !== categoryId)
        }))
        // 重新加载分类列表
        await loadCategories()
      } else {
        toast.error(result.error || '删除分类失败')
      }
    } catch (error) {
      console.error('删除分类失败:', error)
      toast.error('删除分类失败: ' + error.message)
    }
  }

  const handleInsertImage = (file) => {
    const textarea = contentTextareaRef.current
    if (!textarea) return

    // 获取光标位置
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = thread.content.substring(start, end)

    // 生成 Markdown 图片语法
    const imageMarkdown = `![${selectedText || file.filename}](${file.url})`

    // 插入图片
    const newContent =
      thread.content.substring(0, start) +
      imageMarkdown +
      thread.content.substring(end)

    setThread({ ...thread, content: newContent })

    // 恢复光标位置（移到插入内容之后）
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + imageMarkdown.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)

    toast.success('图片已插入')
  }

  return (
    <div className="flex gap-1 h-[calc(100vh-62px)]">
      {/* 加载中状态 */}
      {loading ? (
        <div className="flex-1 bg-white rounded-lg shadow p-8">
          <div className="text-center text-gray-500">加载中...</div>
        </div>
      ) : (
        <>
      {/* Main editor area */}
      <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
        {/* Top toolbar */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilePicker(true)}
              className="px-3 py-2 flex items-center gap-2 bg-[#0073aa] text-white rounded hover:bg-[#005a87]"
              title="插入图片"
            >
              🖼️ 插入图片
            </button>
            <button className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">
              ↶
            </button>
            <button className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">
              ↷
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
        <div className="p-8 flex-shrink-0">
          <input
            type="text"
            value={thread.title}
            onChange={(e) => setThread({ ...thread, title: e.target.value })}
            placeholder="添加标题"
            className="w-full text-4xl font-normal text-[#23282d] border-none outline-none placeholder:text-gray-300"
          />
        </div>

        {/* Content editor */}
        <div className="px-0.5 pb-2 flex-1 flex flex-col">
          <textarea
            ref={contentTextareaRef}
            value={thread.content}
            onChange={(e) => setThread({ ...thread, content: e.target.value })}
            placeholder="输入 / 来选择一个区块"
            className="w-full flex-1 text-base text-[#23282d] border-t border-gray-200 border-l-0 border-r-0 border-b-0 rounded-none p-4 outline-none resize-none"
          />
        </div>
      </div>

      {/* File Picker Modal */}
      <FilePickerModal
        isOpen={showFilePicker}
        onClose={() => setShowFilePicker(false)}
        onSelect={handleInsertImage}
        fileType="image"
      />

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
              categoriesList.map((category) => {
                // 判断是否是"未分类"
                const isUncategorized = category.slug === 'uncategorized' || category.name === '未分类';

                return (
                  <div key={category.id} className="flex items-center justify-between py-1 hover:bg-gray-50 px-2 rounded group">
                    <label className="flex items-center gap-2 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={thread.categories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="rounded"
                      />
                      <span className="text-sm text-[#23282d]">{category.name}</span>
                    </label>
                    {!isUncategorized && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          handleDeleteCategory(category.id, category.name)
                        }}
                        className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="删除分类"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Add category form */}
          {showAddCategory ? (
            <div className="mt-3 p-3 bg-gray-50 rounded">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                placeholder="新分类名称"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddCategory}
                  className="flex-1 px-3 py-1 bg-[#0073aa] text-white rounded text-xs hover:bg-[#005a87]"
                >
                  添加
                </button>
                <button
                  onClick={() => {
                    setShowAddCategory(false)
                    setNewCategoryName('')
                  }}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddCategory(true)}
              className="text-xs text-[#0073aa] hover:underline mt-2"
            >
              + 添加分类
            </button>
          )}
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
