import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Quote from '@editorjs/quote'
import Code from '@editorjs/code'
import InlineCode from '@editorjs/inline-code'
import Delimiter from '@editorjs/delimiter'
import Table from '@editorjs/table'
import Marker from '@editorjs/marker'
import Checklist from '@editorjs/checklist'
import Embed from '@editorjs/embed'
import Warning from '@editorjs/warning'
import ColorPlugin from 'editorjs-text-color-plugin'
import { useToast } from '../../contexts/ToastContext'

function AdminThreadEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const editorRef = useRef(null)
  const [editor, setEditor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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

  useEffect(() => {
    loadCategories()
    if (id && id !== 'new') {
      loadThread()
    } else {
      setLoading(false)
    }

    return () => {
      if (editor) {
        editor.destroy()
      }
    }
  }, [id])

  useEffect(() => {
    if (!loading && !editor) {
      initEditor()
    }
  }, [loading])

  const initEditor = () => {
    const editorInstance = new EditorJS({
      holder: 'editorjs',
      placeholder: '开始写作...',
      tools: {
        header: {
          class: Header,
          config: {
            placeholder: '输入标题',
            levels: [1, 2, 3, 4, 5, 6],
            defaultLevel: 2
          },
          inlineToolbar: true
        },
        list: {
          class: List,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered'
          }
        },
        checklist: {
          class: Checklist,
          inlineToolbar: true
        },
        quote: {
          class: Quote,
          inlineToolbar: true,
          config: {
            quotePlaceholder: '输入引用',
            captionPlaceholder: '引用来源'
          }
        },
        code: {
          class: Code,
          config: {
            placeholder: '输入代码'
          }
        },
        inlineCode: {
          class: InlineCode
        },
        marker: {
          class: Marker
        },
        Color: {
          class: ColorPlugin,
          config: {
            colorCollections: ['#FF1300','#EC7878','#9C27B0','#673AB7','#3F51B5','#0070FF','#03A9F4','#00BCD4','#4CAF50','#8BC34A','#CDDC39', '#FFF'],
            defaultColor: '#FF1300',
            type: 'text'
          }
        },
        Marker: {
          class: ColorPlugin,
          config: {
            defaultColor: '#FFBF00',
            type: 'marker'
          }
        },
        delimiter: Delimiter,
        table: {
          class: Table,
          inlineToolbar: true,
          config: {
            rows: 2,
            cols: 3
          }
        },
        warning: {
          class: Warning,
          inlineToolbar: true,
          config: {
            titlePlaceholder: '标题',
            messagePlaceholder: '消息'
          }
        },
        embed: {
          class: Embed,
          config: {
            services: {
              youtube: true,
              coub: true,
              codepen: true,
              imgur: true,
              vimeo: true
            }
          }
        }
      },
      data: editorRef.current || {},
      onChange: () => {
        // 内容变化时可以自动保存草稿
      }
    })

    setEditor(editorInstance)
  }

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
        const thread = data.thread // 获取 thread 对象

        setFormData({
          title: thread.title || '',
          slug: thread.slug || '',
          excerpt: thread.excerpt || '',
          status: thread.status || 'draft',
          category_ids: thread.categories?.map(c => c.id) || [],
          tag_names: thread.tags?.map(t => t.name) || []
        })

        // 解析内容为 Editor.js 格式
        if (thread.content) {
          try {
            editorRef.current = JSON.parse(thread.content)
          } catch {
            // 如果不是 JSON，转换为简单的段落
            editorRef.current = {
              blocks: [{
                type: 'paragraph',
                data: {
                  text: thread.content
                }
              }]
            }
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

  const handleSave = async (publishNow = false) => {
    if (!formData.title.trim()) {
      toast.error('请输入文章标题')
      return
    }

    setSaving(true)
    try {
      const editorData = await editor.save()

      const postData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: JSON.stringify(editorData),
        categories: formData.category_ids, // API 期望的参数名
        tags: formData.tag_names, // API 期望的参数名
        status: publishNow ? 'publish' : formData.status
      }

      const url = id && id !== 'new' ? `/api/threads/${id}` : '/api/threads'
      const method = id && id !== 'new' ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(publishNow ? '文章已发布' : '文章已保存')
        if (id === 'new') {
          navigate(`/admin/threads/${data.id}/edit`)
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

            {/* Editor.js 编辑器 */}
            <div className="mb-6">
              <div id="editorjs" className="prose max-w-none"></div>
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
            <h3 className="font-medium text-[#23282d] mb-3">发布</h3>

            <div className="mb-4">
              <label className="block text-xs text-[#646970] mb-1">状态</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded"
              >
                <option value="draft">草稿</option>
                <option value="publish">已发布</option>
                <option value="private">私密</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded text-sm text-[#23282d] hover:bg-gray-50 disabled:opacity-50"
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
                className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded"
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
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-xs rounded"
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
  )
}

export default AdminThreadEditPage
