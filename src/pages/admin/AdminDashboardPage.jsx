import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'

function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalComments: 0,
    totalTags: 0,
    recentPosts: [],
    recentComments: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats')
      const data = await response.json()

      if (response.ok && data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>仪表盘</title>
      </Helmet>
      <div>
      <h1 className="text-2xl font-normal text-[#23282d] mb-6">仪表盘</h1>

      {loading ? (
        <div className="text-center py-8 text-[#646970]">加载中...</div>
      ) : (
        <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stats cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#646970] mb-1">文章总数</p>
              <p className="text-3xl font-semibold text-[#23282d]">{stats.totalPosts}</p>
            </div>
            <div className="text-4xl text-[#0073aa]">📝</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#646970] mb-1">评论总数</p>
              <p className="text-3xl font-semibold text-[#23282d]">{stats.totalComments}</p>
            </div>
            <div className="text-4xl text-[#0073aa]">💬</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#646970] mb-1">标签总数</p>
              <p className="text-3xl font-semibold text-[#23282d]">{stats.totalTags}</p>
            </div>
            <div className="text-4xl text-[#0073aa]">🏷️</div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-[#23282d] mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/threads/new"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded hover:border-[#0073aa] transition-colors"
          >
            <span className="text-2xl">➕</span>
            <div>
              <p className="font-medium text-[#23282d]">新建文章</p>
              <p className="text-xs text-[#646970]">发布新的博客文章</p>
            </div>
          </a>

          <a
            href="/admin/comments"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded hover:border-[#0073aa] transition-colors"
          >
            <span className="text-2xl">💬</span>
            <div>
              <p className="font-medium text-[#23282d]">管理评论</p>
              <p className="text-xs text-[#646970]">查看和管理评论</p>
            </div>
          </a>

          <a
            href="/admin/settings"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded hover:border-[#0073aa] transition-colors"
          >
            <span className="text-2xl">⚙️</span>
            <div>
              <p className="font-medium text-[#23282d]">站点设置</p>
              <p className="text-xs text-[#646970]">配置站点选项</p>
            </div>
          </a>
        </div>
      </div>
        </>
      )}
    </div>
    </>
  )
}

export default AdminDashboardPage
