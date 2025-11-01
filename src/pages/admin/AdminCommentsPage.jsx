import { useState } from 'react'
import { Link } from 'react-router-dom'

function AdminCommentsPage() {
  // Mock data - will be replaced with API calls
  const [comments, setComments] = useState([
    {
      id: 1,
      author: '一位 WordPress 评论者',
      email: 'wapuu@wordpress.example',
      content: '您好，这是一条评论。若需要审核、编辑或删除评论，请访问仪表盘的评论界面。评论者头像来自 Gravatar。',
      threadTitle: '世界，您好！',
      threadId: 1,
      status: 'approved',
      date: '2025-08-06 下午10:20',
      replies: 1
    }
  ])

  const [selectedComments, setSelectedComments] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [filterType, setFilterType] = useState('all')

  const commentStats = {
    all: comments.length,
    mine: 0,
    pending: 0,
    approved: comments.filter(c => c.status === 'approved').length,
    spam: 0,
    trash: 0
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedComments(comments.map(c => c.id))
    } else {
      setSelectedComments([])
    }
  }

  const handleSelectComment = (id) => {
    setSelectedComments(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    )
  }

  const handleBulkApply = () => {
    if (bulkAction && selectedComments.length > 0) {
      console.log(`Applying ${bulkAction} to comments:`, selectedComments)
      // TODO: Implement bulk action API call
    }
  }

  const handleApprove = (id) => {
    setComments(comments.map(c =>
      c.id === id ? { ...c, status: 'approved' } : c
    ))
  }

  const handleReject = (id) => {
    setComments(comments.map(c =>
      c.id === id ? { ...c, status: 'pending' } : c
    ))
  }

  const handleDelete = (id) => {
    if (confirm('确定要删除这条评论吗？')) {
      setComments(comments.filter(c => c.id !== id))
    }
  }

  const handleSpam = (id) => {
    setComments(comments.map(c =>
      c.id === id ? { ...c, status: 'spam' } : c
    ))
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 p-6 pb-4">
        <h1 className="text-2xl font-normal text-[#23282d] mb-4">评论</h1>

        <div className="flex items-center gap-2 text-sm text-[#646970]">
          <Link
            to="/admin/comments"
            className={filterType === 'all' ? 'text-[#0073aa]' : 'hover:underline'}
          >
            全部 ({commentStats.all})
          </Link>
          <span>|</span>
          <Link
            to="/admin/comments?filter=mine"
            className={filterType === 'mine' ? 'text-[#0073aa]' : 'hover:underline'}
          >
            我的 ({commentStats.mine})
          </Link>
          <span>|</span>
          <Link
            to="/admin/comments?filter=pending"
            className={filterType === 'pending' ? 'text-[#0073aa]' : 'hover:underline'}
          >
            待审 ({commentStats.pending})
          </Link>
          <span>|</span>
          <Link
            to="/admin/comments?filter=approved"
            className={filterType === 'approved' ? 'text-[#0073aa]' : 'hover:underline'}
          >
            已批准 ({commentStats.approved})
          </Link>
          <span>|</span>
          <Link
            to="/admin/comments?filter=spam"
            className={filterType === 'spam' ? 'text-[#0073aa]' : 'hover:underline'}
          >
            垃圾 ({commentStats.spam})
          </Link>
          <span>|</span>
          <Link
            to="/admin/comments?filter=trash"
            className={filterType === 'trash' ? 'text-[#0073aa]' : 'hover:underline'}
          >
            回收站 ({commentStats.trash})
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
            <option value="approve">批准</option>
            <option value="spam">标记为垃圾</option>
            <option value="delete">移至回收站</option>
          </select>
          <button
            onClick={handleBulkApply}
            className="px-4 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
          >
            应用
          </button>

          <select
            className="px-3 py-1 border border-gray-300 rounded text-sm ml-2"
          >
            <option value="all">全部评论类型</option>
            <option value="comment">评论</option>
            <option value="pingback">引用通告</option>
          </select>

          <button className="px-4 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
            筛选
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="搜索评论..."
            className="px-3 py-1 border border-gray-300 rounded text-sm w-[200px]"
          />
          <button className="px-4 py-1 bg-[#0073aa] text-white rounded text-sm hover:bg-[#005a87]">
            搜索评论
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
                  checked={selectedComments.length === comments.length}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="text-left px-4 py-3 font-medium text-sm text-[#646970]">作者</th>
              <th className="text-left px-4 py-3 font-medium text-sm text-[#646970]">评论</th>
              <th className="text-left px-4 py-3 font-medium text-sm text-[#646970]">回复至</th>
              <th className="text-left px-4 py-3 font-medium text-sm text-[#646970]">提交于</th>
            </tr>
          </thead>
          <tbody>
            {comments.map((comment) => (
              <tr key={comment.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedComments.includes(comment.id)}
                    onChange={() => handleSelectComment(comment.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl">
                      👤
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm text-[#23282d]">{comment.author}</span>
                      <a href={`mailto:${comment.email}`} className="text-xs text-[#0073aa] hover:underline">
                        {comment.email}
                      </a>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-[#23282d]">{comment.content}</p>
                    <div className="flex gap-2 text-xs text-[#646970]">
                      {comment.status === 'approved' ? (
                        <button
                          onClick={() => handleReject(comment.id)}
                          className="hover:text-[#0073aa]"
                        >
                          驳回
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApprove(comment.id)}
                          className="hover:text-[#0073aa]"
                        >
                          批准
                        </button>
                      )}
                      <span>|</span>
                      <button className="hover:text-[#0073aa]">回复</button>
                      <span>|</span>
                      <button className="hover:text-[#0073aa]">快速编辑</button>
                      <span>|</span>
                      <button className="hover:text-[#0073aa]">编辑</button>
                      <span>|</span>
                      <button
                        onClick={() => handleSpam(comment.id)}
                        className="hover:text-[#0073aa]"
                      >
                        标记为垃圾
                      </button>
                      <span>|</span>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="hover:text-red-600"
                      >
                        移至回收站
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/thread/${comment.threadId}`}
                    className="text-sm text-[#0073aa] hover:underline"
                  >
                    {comment.threadTitle}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-[#23282d]">{comment.date}</span>
                    {comment.replies > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="bg-gray-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                          {comment.replies}
                        </span>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-[#646970]">共 {comments.length} 项</div>
      </div>
    </div>
  )
}

export default AdminCommentsPage
