import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import ImageResize from 'quill-image-resize-module-react'
import { useToast } from '../../contexts/ToastContext'
import FilePickerModal from '../../components/FilePickerModal'

// 注册图片调整大小模块
Quill.register('modules/imageResize', ImageResize)

// 自定义工具栏图标 - 使用 SVG 图标
const icons = Quill.import('ui/icons')
icons['image-r2'] = '<svg viewbox="0 0 18 18"><rect class="ql-stroke" height="10" width="12" x="3" y="4"></rect><circle class="ql-fill" cx="6" cy="7" r="1"></circle><polyline class="ql-even ql-fill" points="5 12 5 11 7 9 8 10 11 7 13 9 13 12 5 12"></polyline><path class="ql-stroke" d="M14,9.5V4a1,1,0,0,0-1-1H5A1,1,0,0,0,4,4V9.5"></path></svg>'

function AdminThreadEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const quillRef = useRef(null)
  const fileInputRef = useRef(null)
  const autoSaveTimerRef = useRef(null)
  const lastSavedContentRef = useRef(null) // 记录上次保存的内容，用于检测变化
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [content, setContent] = useState('')
  const [showFilePicker, setShowFilePicker] = useState(false)
  const [showDraftPrompt, setShowDraftPrompt] = useState(false) // 显示草稿恢复提示
  const [pendingDraft, setPendingDraft] = useState(null) // 待恢复的草稿数据

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

  // 确保 categories 总是数组
  const safeCategories = Array.isArray(categories) ? categories : []
  const safeCategoryIds = Array.isArray(formData.category_ids) ? formData.category_ids : []
  const safeTagNames = Array.isArray(formData.tag_names) ? formData.tag_names : []

  // 插入 R2 图片到编辑器
  const handleInsertR2Image = useCallback((file) => {
    const quill = quillRef.current?.getEditor()
    if (!quill) return

    const range = quill.getSelection(true)
    const cursorPosition = range ? range.index : 0

    // 使用 Quill Delta API 插入图片
    const Delta = quill.constructor.import('delta')
    const delta = new Delta()
      .retain(cursorPosition)
      .insert({ image: file.url })

    quill.updateContents(delta, 'user')

    toast.success('图片已插入')
  }, [toast])

  // Quill 工具栏配置 - 包含字体大小和自定义图片处理器
  const modules = useMemo(() => {
    return {
      toolbar: {
        container: [
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
          ['link', 'image', 'image-r2', 'video'],  // 添加 image-r2 自定义按钮
          ['clean']
        ],
        handlers: {
          image: function() {
            // 本地上传图片
            fileInputRef.current?.click()
          },
          'image-r2': () => setShowFilePicker(true)  // R2 图片选择
        }
      },
      imageResize: {
        parchment: Quill.import('parchment'),
        modules: ['Resize', 'DisplaySize', 'Toolbar']
      },
      clipboard: {
        // 禁用 Quill 默认的图片 base64 转换
        matchVisual: false
      }
    }
  }, []) // 空依赖数组，只初始化一次

  // 处理文件上传（通用函数）
  const uploadImageToR2 = useCallback(async (file) => {
    const formData = new FormData()
    formData.append('files', file)
    formData.append('path', '/cfpress')
    formData.append('uploadUser', 'admin')

    const response = await fetch('/api/admin/files/upload', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    if (response.ok && data.uploaded && data.uploaded.length > 0) {
      return data.uploaded[0].url
    } else {
      throw new Error(data.error || '上传失败')
    }
  }, [toast])

  // 处理文件上传（从文件选择器）
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const quill = quillRef.current?.getEditor()
    if (!quill) {
      console.error('Quill 编辑器未找到')
      return
    }

    // 保存当前光标位置
    const range = quill.getSelection(true)
    const cursorPosition = range ? range.index : 0

    try {
      const imageUrl = await uploadImageToR2(file)

      // 使用 Quill Delta API 插入图片
      const Delta = quill.constructor.import('delta')
      const delta = new Delta()
        .retain(cursorPosition)
        .insert({ image: imageUrl })

      quill.updateContents(delta, 'user')

      toast.success('图片上传成功')
    } catch (error) {
      console.error('图片上传失败:', error)
      toast.error('图片上传失败: ' + error.message)
    }

    // 清空 input，允许上传相同文件
    e.target.value = ''
  }

  // 处理粘贴图片 - 监听 text-change 事件检测 base64 图片并上传
  const handleQuillReady = useCallback(() => {
    const quill = quillRef.current?.getEditor()
    if (!quill) return

    const handleTextChange = async (delta, oldDelta, source) => {
      if (source !== 'user') return

      // 检查 delta 中是否有插入的图片
      const ops = delta.ops || []

      for (let i = 0; i < ops.length; i++) {
        const op = ops[i]

        // 检查是否插入了 base64 图片
        if (op.insert && op.insert.image && typeof op.insert.image === 'string' && op.insert.image.startsWith('data:image')) {
          const base64Data = op.insert.image

          // 先禁用历史记录，避免撤销时出现问题
          quill.history.cutoff()

          // 立即删除 base64 图片（获取当前所有内容，找到并删除）
          const currentContents = quill.getContents()
          let imageIndex = -1
          let currentIndex = 0

          for (let j = 0; j < currentContents.ops.length; j++) {
            const currentOp = currentContents.ops[j]

            if (currentOp.insert && currentOp.insert.image === base64Data) {
              imageIndex = currentIndex
              break
            }

            if (typeof currentOp.insert === 'string') {
              currentIndex += currentOp.insert.length
            } else {
              currentIndex += 1
            }
          }

          if (imageIndex !== -1) {
            quill.deleteText(imageIndex, 1, 'silent')

            toast.info('正在上传图片...')

            try {
              // 将 base64 转换为 File
              const response = await fetch(base64Data)
              const blob = await response.blob()
              const file = new File([blob], `paste-${Date.now()}.png`, { type: blob.type })

              const imageUrl = await uploadImageToR2(file)

              // 在相同位置插入 R2 URL 图片
              quill.insertEmbed(imageIndex, 'image', imageUrl, 'silent')
              quill.setSelection(imageIndex + 1)

              toast.success('粘贴图片上传成功')
            } catch (error) {
              console.error('粘贴图片上传失败:', error)
              toast.error('粘贴图片上传失败: ' + error.message)
            }
          }

          break
        }
      }
    }

    quill.on('text-change', handleTextChange)
  }, [uploadImageToR2, toast])

  const formats = [
    'header', 'size', 'font',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'blockquote', 'code-block',
    'list', 'bullet', 'indent',
    'align',
    'link', 'image', 'video',
    'width', 'height', 'style'  // 支持图片调整大小
  ]

  useEffect(() => {
    loadCategories()
    if (id && id !== 'new') {
      loadThread()
    } else {
      setLoading(false)
    }
  }, [id])

  // 30秒自动保存草稿
  useEffect(() => {
    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current)
    }

    // 设置30秒自动保存定时器
    autoSaveTimerRef.current = setInterval(() => {
      autoSaveDraft()
    }, 30000) // 30秒 = 30000毫秒

    // 清理函数
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [content, formData, id, saving])

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

        const threadFormData = {
          title: thread.title || '',
          slug: thread.slug || '',
          excerpt: thread.excerpt || '',
          status: thread.status || 'draft',
          category_ids: thread.categories?.map(c => c.id) || [],
          tag_names: thread.tags?.map(t => t.name) || []
        }

        // 处理内容格式
        let threadContent = ''
        if (thread.content) {
          try {
            // 尝试解析 Editor.js JSON 格式
            const parsed = JSON.parse(thread.content)
            if (parsed.blocks) {
              // 转换 Editor.js 格式为 HTML
              threadContent = convertEditorJsToHtml(parsed)
            } else {
              threadContent = thread.content
            }
          } catch {
            // 如果不是 JSON，直接使用 HTML
            threadContent = thread.content
          }
        }

        // 检查是否有草稿
        try {
          const draftResponse = await fetch(`/api/threads/${id}/draft`)
          const draftData = await draftResponse.json()

          if (draftData.exists && draftData.draft) {
            // 有草稿，保存待恢复的草稿数据并显示提示
            setPendingDraft(draftData.draft)
            setShowDraftPrompt(true)
          }
        } catch (draftError) {
          console.error('检查草稿失败:', draftError)
        }

        // 先加载原始文章内容
        setFormData(threadFormData)
        setContent(threadContent)

        // 记录初始内容用于变化检测
        lastSavedContentRef.current = JSON.stringify({
          title: threadFormData.title,
          content: threadContent,
          excerpt: threadFormData.excerpt,
          category_ids: threadFormData.category_ids,
          tag_names: threadFormData.tag_names
        })
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

  // 恢复草稿内容
  const handleRestoreDraft = () => {
    if (pendingDraft) {
      setFormData(prev => ({
        ...prev,
        title: pendingDraft.title || prev.title,
        excerpt: pendingDraft.excerpt || prev.excerpt,
        category_ids: pendingDraft.categories || prev.category_ids,
        tag_names: pendingDraft.tags || prev.tag_names
      }))
      setContent(pendingDraft.content || '')
      toast.success('草稿已恢复')
    }
    setShowDraftPrompt(false)
    setPendingDraft(null)
  }

  // 放弃草稿，使用原始内容
  const handleDiscardDraft = async () => {
    // 删除服务器上的草稿
    if (id && id !== 'new') {
      try {
        await fetch(`/api/threads/${id}/draft`, { method: 'DELETE' })
      } catch (error) {
        console.error('删除草稿失败:', error)
      }
    }
    setShowDraftPrompt(false)
    setPendingDraft(null)
    toast.info('已使用原始内容')
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

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(publishNow ? '文章已发布' : '文章已保存')

        // 删除草稿（因为已经保存到正式文章了）
        const savedId = isNewThread ? data.id : id
        if (savedId) {
          try {
            await fetch(`/api/threads/${savedId}/draft`, { method: 'DELETE' })
          } catch (draftError) {
            console.error('删除草稿失败:', draftError)
          }

          // 更新上次保存的内容记录
          lastSavedContentRef.current = JSON.stringify({
            title: formData.title,
            content: content,
            excerpt: formData.excerpt,
            category_ids: formData.category_ids,
            tag_names: formData.tag_names
          })
        }

        // 如果是新建文章，跳转到编辑页面
        if (isNewThread && data.id) {
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

  // 自动保存草稿到服务器（仅当内容有变化时）
  const autoSaveDraft = async () => {
    // 如果是新建文章，不自动保存草稿（因为还没有文章ID）
    const isNewThread = !id || id === 'new'
    if (isNewThread) {
      return
    }

    // 如果没有标题或内容，不自动保存
    if (!formData.title.trim() && !content.trim()) {
      return
    }

    // 如果正在保存中，跳过本次自动保存
    if (saving) {
      return
    }

    // 检测内容是否有变化
    const currentContent = JSON.stringify({
      title: formData.title,
      content: content,
      excerpt: formData.excerpt,
      category_ids: formData.category_ids,
      tag_names: formData.tag_names
    })

    if (currentContent === lastSavedContentRef.current) {
      // 内容没有变化，跳过保存
      return
    }

    // 显示自动保存提示
    toast.info('自动保存中...')

    try {
      const postData = {
        title: formData.title,
        content: content,
        excerpt: formData.excerpt,
        categories: formData.category_ids,
        tags: formData.tag_names
      }

      const response = await fetch(`/api/threads/${id}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      })

      if (response.ok) {
        // 更新上次保存的内容
        lastSavedContentRef.current = currentContent
        toast.success('草稿自动保存成功')
      } else {
        toast.error('草稿自动保存失败')
      }
    } catch (error) {
      console.error('草稿自动保存失败:', error)
      toast.error('草稿自动保存失败')
    }
  }

  // 手动保存到草稿副本（用于已发布文章的"保存副本"按钮）
  const saveAsDraftCopy = async () => {
    if (!id || id === 'new') {
      toast.error('请先保存文章')
      return
    }

    setSaving(true)
    toast.info('保存副本中...')

    try {
      const postData = {
        title: formData.title,
        content: content,
        excerpt: formData.excerpt,
        categories: formData.category_ids,
        tags: formData.tag_names
      }

      const response = await fetch(`/api/threads/${id}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      })

      if (response.ok) {
        // 更新上次保存的内容记录
        lastSavedContentRef.current = JSON.stringify({
          title: formData.title,
          content: content,
          excerpt: formData.excerpt,
          category_ids: formData.category_ids,
          tag_names: formData.tag_names
        })
        toast.success('副本已保存（不影响已发布文章）')
      } else {
        toast.error('保存副本失败')
      }
    } catch (error) {
      console.error('保存副本失败:', error)
      toast.error('保存副本失败')
    } finally {
      setSaving(false)
    }
  }

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => {
      const currentIds = Array.isArray(prev.category_ids) ? prev.category_ids : []
      return {
        ...prev,
        category_ids: currentIds.includes(categoryId)
          ? currentIds.filter(id => id !== categoryId)
          : [...currentIds, categoryId]
      }
    })
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    const currentTags = Array.isArray(formData.tag_names) ? formData.tag_names : []
    if (tag && !currentTags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tag_names: [...currentTags, tag]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag) => {
    setFormData(prev => {
      const currentTags = Array.isArray(prev.tag_names) ? prev.tag_names : []
      return {
        ...prev,
        tag_names: currentTags.filter(t => t !== tag)
      }
    })
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
              {/* 隐藏的文件input用于图片上传 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <ReactQuill
                ref={(el) => {
                  quillRef.current = el
                  if (el) {
                    // 延迟执行，确保 Quill 实例完全初始化
                    setTimeout(() => handleQuillReady(), 0)
                  }
                }}
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
              {/* 已发布文章：显示"保存副本"，保存到草稿表不影响正式文章 */}
              {/* 新建/草稿文章：显示"保存草稿"，保存到正式文章表 */}
              {formData.status === 'publish' ? (
                <button
                  onClick={saveAsDraftCopy}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded text-sm text-[#23282d] hover:bg-gray-200 disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存副本'}
                </button>
              ) : (
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded text-sm text-[#23282d] hover:bg-gray-200 disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存草稿'}
                </button>
              )}
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
              {safeCategories.map(category => (
                <label key={category.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={safeCategoryIds.includes(category.id)}
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
              {safeTagNames.map(tag => (
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

    {/* File Picker Modal */}
    <FilePickerModal
      isOpen={showFilePicker}
      onClose={() => setShowFilePicker(false)}
      onSelect={handleInsertR2Image}
      fileType="image"
    />

    {/* 草稿恢复提示对话框 */}
    {showDraftPrompt && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
          <h3 className="text-lg font-medium text-[#23282d] mb-3">发现未保存的草稿</h3>
          <p className="text-sm text-[#646970] mb-4">
            此文章存在自动保存的草稿副本（保存于 {pendingDraft?.updated_at ? new Date(pendingDraft.updated_at).toLocaleString() : '未知时间'}）。
            是否恢复草稿内容？
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleDiscardDraft}
              className="px-4 py-2 text-sm text-[#646970] hover:text-[#23282d] border border-gray-300 rounded hover:bg-gray-50"
            >
              放弃草稿
            </button>
            <button
              onClick={handleRestoreDraft}
              className="px-4 py-2 text-sm text-white bg-[#0073aa] rounded hover:bg-[#005a87]"
            >
              恢复草稿
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default AdminThreadEditPage
