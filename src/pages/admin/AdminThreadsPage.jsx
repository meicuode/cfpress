import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function AdminThreadsPage() {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const [selectedThreads, setSelectedThreads] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [filterDate, setFilterDate] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 加载文章列表
  useEffect(() => {
    loadThreads()
  }, [])

  const loadThreads = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/threads?status=all&limit=100')
      const data = await response.json()

      if (response.ok) {
        setThreads(data.threads || [])
        setTotalCount(data.total || 0)
      } else {
        console.error('加载文章失败:', data.error)
        alert('加载文章列表失败')
      }
    } catch (error) {
      console.error('加载文章失败:', error)
      alert('加载文章列表失败: ' + error.message)
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

  const handleBulkApply = () => {
    if (bulkAction && selectedThreads.length > 0) {
      console.log(`Applying ${bulkAction} to threads:`, selectedThreads)
      // TODO: Implement bulk action API call
    }
  }

  const handleDeleteThread = async (id) => {
    if (!confirm('确定要删除这篇文章吗？')) return

    try {
      const response = await fetch(`/api/threads/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        alert('文章已删除')
        // 重新加载列表
        loadThreads()
      } else {
        alert('删除失败: ' + (data.error || '未知错误'))
      }
    } catch (error) {
      console.error('删除文章失败:', error)
      alert('删除失败: ' + error.message)
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
          <Link to="/admin/threads" className="text-[#0073aa] hover:underline">
            全部 ({totalCount})
          </Link>
          <span>|</span>
          <Link to="/admin/threads?status=published" className="hover:underline">
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
            className="px-4 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
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
            <option value="tech">技术</option>
            <option value="life">生活</option>
          </select>

          <button className="px-4 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
            筛选
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文章..."
            className="px-3 py-1 border border-gray-300 rounded text-sm w-[200px]"
          />
          <button className="px-4 py-1 bg-[#0073aa] text-white rounded text-sm hover:bg-[#005a87]">
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
