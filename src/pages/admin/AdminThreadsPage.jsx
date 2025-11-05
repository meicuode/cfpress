import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'

function AdminThreadsPage() {
  const location = useLocation()
  const toast = useToast()
  const confirm = useConfirm()
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [categories, setCategories] = useState([]) // 分类列表

  const [selectedThreads, setSelectedThreads] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [filterDate, setFilterDate] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // 加载分类列表
  useEffect(() => {
    document.title = '文章'
    loadCategories()
  }, [])

  // 监听 URL 变化，读取 status 参数
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const status = params.get('status')
    if (status === 'published') {
      setFilterStatus('publish')
    } else {
      setFilterStatus('all')
    }
  }, [location.search])

  // 加载文章列表（筛选和搜索时重新加载）
  useEffect(() => {
    loadThreads({ status: filterStatus })
  }, [filterStatus])

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

  const loadThreads = async (filters = {}) => {
    setLoading(true)
    try {
      // 构建查询参数
      const params = new URLSearchParams({
        status: filters.status || 'all',
        limit: '100'
      })

      // 添加筛选参数
      if (filters.search) {
        params.append('search', filters.search)
      }
      if (filters.year && filters.year !== 'all') {
        params.append('year', filters.year)
      }
      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category)
      }

      const response = await fetch(`/api/threads?${params}`)
      const data = await response.json()

      if (response.ok) {
        setThreads(data.threads || [])
        setTotalCount(data.total || 0)
      } else {
        console.error('加载文章失败:', data.error)
        toast.error('加载文章列表失败')
      }
    } catch (error) {
      console.error('加载文章失败:', error)
      toast.error('加载文章列表失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '未发布'
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 获取状态文本
  const getStatusText = (status) => {
    const statusMap = {
      'publish': '已发布',
      'draft': '草稿',
      'trash': '回收站'
    }
    return statusMap[status] || status
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedThreads(threads.map(t => t.id))
    } else {
      setSelectedThreads([])
    }
  }

  const handleSelectThread = (id) => {
    setSelectedThreads(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    )
  }

  const handleBulkApply = async () => {
    if (!bulkAction || selectedThreads.length === 0) {
      toast.warning('请选择操作和文章')
      return
    }

    if (bulkAction === 'delete') {
      const confirmed = await confirm({
        title: '批量删除文章',
        message: `确定要删除选中的 ${selectedThreads.length} 篇文章吗？`,
        confirmText: '删除',
        cancelText: '取消',
        type: 'danger'
      })

      if (!confirmed) return

      try {
        const promises = selectedThreads.map(id =>
          fetch(`/api/threads/${id}`, { method: 'DELETE' })
        )
        await Promise.all(promises)
        toast.success('批量删除成功')
        setSelectedThreads([])
        loadThreads({ status: filterStatus })
      } catch (error) {
        console.error('批量删除失败:', error)
        toast.error('批量删除失败')
      }
    }
  }

  const handleFilter = () => {
    loadThreads({
      status: filterStatus,
      year: filterDate,
      category: filterCategory
    })
  }

  const handleSearch = () => {
    const filters = {
      status: filterStatus,
      year: filterDate,
      category: filterCategory
    }

    // 只在有搜索内容时才添加 search 参数
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim()
    }

    loadThreads(filters)
  }

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleDeleteThread = async (id) => {
    const confirmed = await confirm({
      title: '删除文章',
      message: '确定要删除这篇文章吗？',
      confirmText: '删除',
      cancelText: '取消',
      type: 'danger'
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/threads/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('文章已删除')
        // 重新加载列表
        loadThreads({ status: filterStatus })
      } else {
        toast.error('删除失败: ' + (data.error || '未知错误'))
      }
    } catch (error) {
      console.error('删除文章失败:', error)
      toast.error('删除失败: ' + error.message)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-normal text-[#23282d]">文章</h1>
          <Link
            to="/admin/threads/new"
            className="px-4 py-2 bg-[#0073aa] text-white rounded hover:bg-[#005a87] text-sm"
          >
            添加文章
          </Link>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#646970]">
          <Link
            to="/admin/threads"
            className={filterStatus === 'all' ? 'text-[#0073aa] hover:underline' : 'hover:underline hover:text-[#0073aa]'}
          >
            全部 ({totalCount})
          </Link>
          <span>|</span>
          <Link
            to="/admin/threads?status=published"
            className={filterStatus === 'publish' ? 'text-[#0073aa] hover:underline' : 'hover:underline hover:text-[#0073aa]'}
          >
            已发布 ({threads.filter(t => t.status === 'publish').length})
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">批量操作</option>
            <option value="delete">移至回收站</option>
            <option value="edit">编辑</option>
          </select>
          <button
            onClick={handleBulkApply}
            className="px-4 py-1 border border-gray-300 rounded text-sm bg-white text-[#23282d] hover:bg-gray-50"
          >
            应用
          </button>

          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm ml-2"
          >
            <option value="all">全部日期</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">所有分类</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleFilter}
            className="px-4 py-1 border border-gray-300 rounded text-sm bg-white text-[#23282d] hover:bg-gray-50"
          >
            筛选
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            placeholder="搜索文章..."
            className="px-3 py-1 border border-gray-300 rounded text-sm w-[200px]"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-1 bg-[#0073aa] text-white rounded text-sm hover:bg-[#005a87]"
          >
            搜索文章
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedThreads.length === threads.length}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="text-left px-4 py-3 font-medium text-sm text-[#646970]">标题</th>
              <th className="text-left px-4 py-3 font-medium text-sm text-[#646970]">作者</th>
              <th className="text-left px-4 py-3 font-medium text-sm text-[#646970]">分类目录</th>
              <th className="text-left px-4 py-3 font-medium text-sm text-[#646970]">标签</th>
              <th className="text-center px-4 py-3 font-medium text-sm text-[#646970]">💬</th>
              <th className="text-left px-4 py-3 font-medium text-sm text-[#646970]">日期</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  加载中...
                </td>
              </tr>
            ) : threads.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  暂无文章
                </td>
              </tr>
            ) : (
              threads.map((thread) => (
              <tr key={thread.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedThreads.includes(thread.id)}
                    onChange={() => handleSelectThread(thread.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <Link
                      to={`/admin/threads/${thread.id}/edit`}
                      className="font-medium text-[#0073aa] hover:text-[#005a87]"
                    >
                      {thread.title}
                    </Link>
                    <div className="flex gap-2 text-xs text-[#646970]">
                      <Link to={`/admin/threads/${thread.id}/edit`} className="hover:text-[#0073aa]">
                        编辑
                      </Link>
                      <span>|</span>
                      <button className="hover:text-[#0073aa]">快速编辑</button>
                      <span>|</span>
                      <button
                        onClick={() => handleDeleteThread(thread.id)}
                        className="hover:text-red-600"
                      >
                        移至回收站
                      </button>
                      <span>|</span>
                      <Link to={`/thread/${thread.id}`} className="hover:text-[#0073aa]">
                        查看
                      </Link>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-[#646970]">{thread.author_name || 'Unknown'}</td>
                <td className="px-4 py-3 text-sm text-[#0073aa]">
                  {thread.categories && thread.categories.length > 0
                    ? thread.categories.map(c => c.name).join(', ')
                    : '未分类'}
                </td>
                <td className="px-4 py-3 text-sm text-[#0073aa]">
                  {thread.tags && thread.tags.length > 0
                    ? thread.tags.map(t => t.name).join(', ')
                    : '—'}
                </td>
                <td className="px-4 py-3 text-center text-sm text-[#646970]">
                  {thread.comment_count > 0 ? (
                    <Link to={`/admin/comments?thread=${thread.id}`} className="hover:text-[#0073aa]">
                      {thread.comment_count}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-[#646970]">
                  <div className="flex flex-col gap-1">
                    <span>{getStatusText(thread.status)}</span>
                    <span className="text-xs">{formatDate(thread.published_at || thread.created_at)}</span>
                  </div>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-[#646970]">共 {totalCount} 项</div>
      </div>
    </div>
  )
}

export default AdminThreadsPage
