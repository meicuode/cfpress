import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { useToast } from '../../contexts/ToastContext'

function AdminThreadEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const quillRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [content, setContent] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    status: 'draft',
    category_ids: [],
    tag_names: []
  })

  const [categories, setCategories] = useState([])
  const [tagInput, setTagInput] = useState('')

  // Quill 工具栏配置 - 包含字体大小
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],  // 字体大小
      [{ 'font': [] }],  // 字体系列
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ]
  }

  const formats = [
    'header', 'size', 'font',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'blockquote', 'code-block',
    'list', 'bullet', 'indent',
    'align',
    'link', 'image', 'video'
  ]

  useEffect(() => {
    loadCategories()
    if (id && id !== 'new') {
      loadThread()
    } else {
      setLoading(false)
    }
    console.log('当前文章 ID:', id, '是否显示查看按钮:', id && id !== 'new')
  }, [id])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (response.ok) {
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  }

  const loadThread = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/threads/${id}`)
      const data = await response.json()

      if (response.ok) {
        const thread = data.thread

        setFormData({
          title: thread.title || '',
          slug: thread.slug || '',
          excerpt: thread.excerpt || '',
          status: thread.status || 'draft',
          category_ids: thread.categories?.map(c => c.id) || [],
          tag_names: thread.tags?.map(t => t.name) || []
        })

        // 处理内容格式
        if (thread.content) {
          try {
            // 尝试解析 Editor.js JSON 格式
            const parsed = JSON.parse(thread.content)
            if (parsed.blocks) {
              // 转换 Editor.js 格式为 HTML
              setContent(convertEditorJsToHtml(parsed))
            } else {
              setContent(thread.content)
            }
          } catch {
            // 如果不是 JSON，直接使用 HTML
            setContent(thread.content)
          }
        }
      } else {
        toast.error('加载文章失败')
        navigate('/admin/threads')
      }
    } catch (error) {
      console.error('加载文章失败:', error)
      toast.error('加载文章失败')
    } finally {
      setLoading(false)
    }
  }

  // 简单的 Editor.js 到 HTML 转换
  const convertEditorJsToHtml = (editorData) => {
    let html = ''
    editorData.blocks.forEach(block => {
      switch (block.type) {
        case 'header':
          html += `<h${block.data.level}>${block.data.text}</h${block.data.level}>`
          break
        case 'paragraph':
          html += `<p>${block.data.text}</p>`
          break
        case 'list':
          const tag = block.data.style === 'ordered' ? 'ol' : 'ul'
          html += `<${tag}>`
          block.data.items.forEach(item => {
            html += `<li>${item}</li>`
          })
          html += `</${tag}>`
          break
        case 'quote':
          html += `<blockquote>${block.data.text}</blockquote>`
          break
        case 'code':
          html += `<pre><code>${block.data.code}</code></pre>`
          break
        case 'delimiter':
          html += '<hr/>'
          break
        default:
          if (block.data.text) {
            html += `<p>${block.data.text}</p>`
          }
      }
    })
    return html
  }

  const handleSave = async (publishNow = false) => {
    if (!formData.title.trim()) {
      toast.error('请输入文章标题')
      return
    }

    setSaving(true)
    try {
      const postData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: content, // 直接保存 HTML
        categories: formData.category_ids,
        tags: formData.tag_names,
        status: publishNow ? 'publish' : formData.status
      }

      // 判断是新建还是更新
      const isNewThread = !id || id === 'new'
      const url = isNewThread ? '/api/threads' : `/api/threads/${id}`
      const method = isNewThread ? 'POST' : 'PUT'

      console.log('保存文章 - URL:', url, 'Method:', method, 'ID:', id, 'isNewThread:', isNewThread)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      })

      const data = await response.json()
      console.log('API 响应:', data)

      if (response.ok) {
        toast.success(publishNow ? '文章已发布' : '文章已保存')

        // 如果是新建文章，跳转到编辑页面
        if (isNewThread && data.id) {
          console.log('新建文章，准备跳转到:', `/admin/threads/${data.id}/edit`)
          // 使用 replace 而不是 push，避免返回时回到 new 页面
          navigate(`/admin/threads/${data.id}/edit`, { replace: true })
        } else if (isNewThread && !data.id) {
          console.error('API 未返回文章 ID:', data)
          toast.error('保存成功但无法跳转，请刷新页面')
        }
      } else {
        toast.error(data.error || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }))
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tag_names.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tag_names: [...prev.tag_names, tag]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tag_names: prev.tag_names.filter(t => t !== tag)
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#646970]">加载中...</div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>
          {id && id !== 'new'
            ? (formData.title ? `编辑 - ${formData.title}` : '编辑文章')
            : (formData.title ? `新建 - ${formData.title}` : '新建文章')
          }
        </title>
      </Helmet>
      <div className="max-w-7xl mx-auto">
      <div className="flex gap-6">
        {/* 主编辑区域 */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow p-6">
            {/* 标题输入 */}
            <div className="mb-6">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="添加标题"
                className="w-full text-3xl font-bold border-none outline-none focus:ring-0 p-0 text-[#23282d]"
              />
            </div>

            {/* Slug 输入 */}
            <div className="mb-6">
              <label className="block text-xs text-[#646970] mb-1">固定链接</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="文章别名（用于URL）"
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded text-[#23282d]"
              />
            </div>

            {/* Quill 编辑器 */}
            <div className="mb-6">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                placeholder="开始写作..."
                className="bg-white"
                style={{ height: 'auto' }}
              />
            </div>

            {/* 摘要输入 */}
            <div className="mb-6 pt-6 border-t border-gray-200">
              <label className="block text-sm font-medium text-[#23282d] mb-2">摘要</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
                placeholder="可选，如果留空将自动生成"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-[#23282d] resize-none"
              />
            </div>
          </div>
        </div>

        {/* 侧边栏 */}
        <div className="w-80 flex flex-col gap-4">
          {/* 发布设置 */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-[#23282d]">发布</h3>
              {/* 查看文章链接 - 仅在编辑已存在文章时显示 */}
              {id && id !== 'new' && (
                <a
                  href={`/thread/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#0073aa] hover:text-[#005a87] hover:underline"
                >
                  查看文章
                </a>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs text-[#646970] mb-1">状态</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded text-[#23282d] bg-white"
                style={{ color: '#23282d' }}
              >
                <option value="draft" style={{ color: '#23282d' }}>草稿</option>
                <option value="publish" style={{ color: '#23282d' }}>已发布</option>
                <option value="private" style={{ color: '#23282d' }}>私密</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded text-sm text-[#23282d] hover:bg-gray-200 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存草稿'}
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-[#0073aa] text-white rounded text-sm hover:bg-[#005a87] disabled:opacity-50"
              >
                {formData.status === 'publish' ? '更新' : '发布'}
              </button>
            </div>
          </div>

          {/* 分类 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-[#23282d] mb-3">分类目录</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map(category => (
                <label key={category.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.category_ids.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="rounded"
                  />
                  <span className="text-sm text-[#23282d]">{category.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 标签 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-[#23282d] mb-3">标签</h3>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="添加标签"
                className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded text-[#23282d]"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-1 bg-[#0073aa] text-white rounded text-sm hover:bg-[#005a87]"
              >
                添加
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.tag_names.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-xs rounded text-[#23282d]"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default AdminThreadEditPage
