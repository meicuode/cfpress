import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'

function AdminCommentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()
  const confirm = useConfirm()

  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedComments, setSelectedComments] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [commentStats, setCommentStats] = useState({
    all: 0,
    mine: 0,
    pending: 0,
    approved: 0,
    spam: 0,
    trash: 0
  })

  // Get filter from URL params
  const filterType = searchParams.get('filter') || 'all'

  // Load comments from API
  const loadComments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterType !== 'all') {
        params.append('status', filterType)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/admin/comments?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setComments(data.comments || [])
        setCommentStats(data.stats || {})
      } else {
        toast.error(data.error || '加载评论失败')
      }
    } catch (error) {
      console.error('Error loading comments:', error)
      toast.error('加载评论失败')
    } finally {
      setLoading(false)
    }
  }, [filterType, searchQuery])

  // Load comments when filter changes
  useEffect(() => {
    loadComments()
  }, [loadComments])

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

  const handleBulkApply = async () => {
    if (!bulkAction || selectedComments.length === 0) {
      toast.warning('请选择批量操作和至少一条评论')
      return
    }

    const actionText = {
      'approve': '批准',
      'spam': '标记为垃圾',
      'delete': '移至回收站'
    }[bulkAction]

    const confirmed = await confirm({
      title: `${actionText}评论`,
      message: `确定要${actionText} ${selectedComments.length} 条评论吗？`,
      confirmText: actionText,
      type: bulkAction === 'delete' ? 'danger' : 'default'
    })

    if (!confirmed) return

    try {
      // Determine the status based on action
      let status
      if (bulkAction === 'approve') status = 'approved'
      else if (bulkAction === 'spam') status = 'spam'
      else if (bulkAction === 'delete') status = 'trash'

      // Update each comment
      const promises = selectedComments.map(id =>
        fetch(`/api/admin/comments/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        })
      )

      await Promise.all(promises)

      toast.success(`已${actionText} ${selectedComments.length} 条评论`)
      setSelectedComments([])
      setBulkAction('')
      loadComments()
    } catch (error) {
      console.error('Bulk action error:', error)
      toast.error('批量操作失败')
    }
  }

  const handleApprove = async (id) => {
    try {
      const response = await fetch(`/api/admin/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('评论已批准')
        loadComments()
      } else {
        toast.error(data.error || '批准失败')
      }
    } catch (error) {
      console.error('Approve error:', error)
      toast.error('批准失败')
    }
  }

  const handleReject = async (id) => {
    try {
      const response = await fetch(`/api/admin/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('评论已驳回')
        loadComments()
      } else {
        toast.error(data.error || '驳回失败')
      }
    } catch (error) {
      console.error('Reject error:', error)
      toast.error('驳回失败')
    }
  }

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: '删除评论',
      message: '确定要永久删除这条评论吗？此操作不可恢复。',
      confirmText: '删除',
      type: 'danger'
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/comments/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('评论已删除')
        loadComments()
      } else {
        toast.error(data.error || '删除失败')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('删除失败')
    }
  }

  const handleSpam = async (id) => {
    try {
      const response = await fetch(`/api/admin/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'spam' })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('评论已标记为垃圾')
        loadComments()
      } else {
        toast.error(data.error || '标记失败')
      }
    } catch (error) {
      console.error('Spam error:', error)
      toast.error('标记失败')
    }
  }

  const handleSearch = () => {
    loadComments()
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\//g, '-')
  }

  return (
    <>
      <Helmet>
        <title>评论</title>
      </Helmet>
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
            className="px-3 py-1 border border-gray-300 rounded text-sm text-[#23282d]"
          >
            <option value="">批量操作</option>
            <option value="approve">批准</option>
            <option value="spam">标记为垃圾</option>
            <option value="delete">移至回收站</option>
          </select>
          <button
            onClick={handleBulkApply}
            className="px-4 py-1 border border-gray-300 rounded text-sm text-[#23282d] hover:bg-gray-50"
          >
            应用
          </button>

          <select
            className="px-3 py-1 border border-gray-300 rounded text-sm text-[#23282d] ml-2"
          >
            <option value="all">全部评论类型</option>
            <option value="comment">评论</option>
            <option value="pingback">引用通告</option>
          </select>

          <button className="px-4 py-1 border border-gray-300 rounded text-sm text-[#23282d] hover:bg-gray-50">
            筛选
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="搜索评论..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="px-3 py-1 border border-gray-300 rounded text-sm text-[#23282d] w-[200px]"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-1 bg-[#0073aa] text-white rounded text-sm hover:bg-[#005a87]"
          >
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
            {loading ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-[#646970]">
                  加载中...
                </td>
              </tr>
            ) : comments.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-[#646970]">
                  暂无评论
                </td>
              </tr>
            ) : (
              comments.map((comment) => (
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
                        <span className="font-medium text-sm text-[#23282d]">{comment.author_name}</span>
                        <a href={`mailto:${comment.author_email}`} className="text-xs text-[#0073aa] hover:underline">
                          {comment.author_email}
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
                            className="text-[#0073aa] hover:text-[#005a87] hover:underline"
                          >
                            驳回
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApprove(comment.id)}
                            className="text-[#0073aa] hover:text-[#005a87] hover:underline"
                          >
                            批准
                          </button>
                        )}
                        <span>|</span>
                        <button className="text-[#0073aa] hover:text-[#005a87] hover:underline">回复</button>
                        <span>|</span>
                        <button className="text-[#0073aa] hover:text-[#005a87] hover:underline">快速编辑</button>
                        <span>|</span>
                        <button className="text-[#0073aa] hover:text-[#005a87] hover:underline">编辑</button>
                        <span>|</span>
                        <button
                          onClick={() => handleSpam(comment.id)}
                          className="text-[#0073aa] hover:text-[#005a87] hover:underline"
                        >
                          标记为垃圾
                        </button>
                        <span>|</span>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-red-600 hover:text-red-800 hover:underline"
                        >
                          移至回收站
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/thread/${comment.thread_id}`}
                      className="text-sm text-[#0073aa] hover:underline"
                    >
                      {comment.thread_title || '未知文章'}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-[#23282d]">{formatDate(comment.created_at)}</span>
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
        <div className="text-sm text-[#646970]">共 {commentStats.all || 0} 项</div>
      </div>
    </div>
    </>
  )
}

export default AdminCommentsPage
