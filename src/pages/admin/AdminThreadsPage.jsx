import { useState } from 'react'
import { Link } from 'react-router-dom'

function AdminThreadsPage() {
  // Mock data - will be replaced with API calls
  const [threads, setThreads] = useState([
    {
      id: 1,
      title: '一年只需 10 HKD 的香港保号卡 hahaSIM 开箱测评',
      author: 'skybreak',
      categories: ['华为云考试'],
      tags: ['gaussDb'],
      comments: 0,
      status: '已发布',
      date: '2025-10-29 下午9:41'
    },
    {
      id: 2,
      title: '华为云技术精髓入门级开发者认证考试-实验考试通关教程',
      author: 'skybreak',
      categories: ['华为云考试'],
      tags: ['开发者认证'],
      comments: 0,
      status: '已发布',
      date: '2025-10-27 下午10:47'
    },
    {
      id: 3,
      title: '华为云GaussDB开发者考试实验指南',
      author: 'skybreak',
      categories: ['华为云考试', '教程'],
      tags: ['华为云', '高斯db'],
      comments: 0,
      status: '已发布',
      date: '2025-10-27 下午10:45'
    }
  ])

  const [selectedThreads, setSelectedThreads] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [filterDate, setFilterDate] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleDeleteThread = (id) => {
    if (confirm('确定要删除这篇文章吗？')) {
      setThreads(threads.filter(t => t.id !== id))
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
            全部 ({threads.length})
          </Link>
          <span>|</span>
          <Link to="/admin/threads?status=published" className="hover:underline">
            已发布 ({threads.length})
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
            {threads.map((thread) => (
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
                <td className="px-4 py-3 text-sm text-[#646970]">{thread.author}</td>
                <td className="px-4 py-3 text-sm text-[#0073aa]">
                  {thread.categories.join(', ')}
                </td>
                <td className="px-4 py-3 text-sm text-[#0073aa]">
                  {thread.tags.join(', ')}
                </td>
                <td className="px-4 py-3 text-center text-sm text-[#646970]">
                  {thread.comments > 0 ? (
                    <Link to={`/admin/comments?thread=${thread.id}`} className="hover:text-[#0073aa]">
                      {thread.comments}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-[#646970]">
                  <div className="flex flex-col gap-1">
                    <span>{thread.status}</span>
                    <span className="text-xs">{thread.date}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-[#646970]">共 {threads.length} 项</div>
      </div>
    </div>
  )
}

export default AdminThreadsPage
