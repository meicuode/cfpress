import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

function CategoryPage() {
  const { slug } = useParams()
  const [threads, setThreads] = useState([])
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  // 设置页面标题
  useEffect(() => {
    if (slug) {
      document.title = `${category?.name || '分类'} - CFPress`
    } else {
      document.title = '归档 - CFPress'
    }
  }, [slug, category])

  // 加载分类文章
  useEffect(() => {
    if (slug) {
      loadCategoryThreads()
    } else {
      setLoading(false)
    }
  }, [slug])

  const loadCategoryThreads = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/threads?category=${slug}&status=publish&limit=100`)
      const data = await response.json()
      if (response.ok) {
        setThreads(data.threads || [])
        // 从第一个文章中获取分类名称
        if (data.threads && data.threads.length > 0 && data.threads[0].categories) {
          const cat = data.threads[0].categories.find(c => c.slug === slug)
          setCategory(cat)
        }
      }
    } catch (error) {
      console.error('加载分类文章失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  // 如果有 slug 参数，显示分类文章列表
  if (slug) {
    return (
      <div className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-10 max-md:p-6">
        <div className="mb-8 pb-5 border-b border-border">
          <h1 className="text-[28px] font-bold text-text-primary mb-2">
            {loading ? '加载中...' : category?.name || slug}
          </h1>
          <p className="text-sm text-text-secondary">
            共 {threads.length} 篇文章
          </p>
        </div>

        {loading ? (
          <div className="text-center text-text-secondary py-8">加载中...</div>
        ) : threads.length === 0 ? (
          <div className="text-center text-text-secondary py-8">该分类下暂无文章</div>
        ) : (
          <div className="flex flex-col gap-3">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                to={`/thread/${thread.id}`}
                className="flex items-center gap-2.5 p-3 px-4 bg-white/[0.03] rounded-lg border border-border transition-all text-text-primary hover:bg-white/5 hover:border-accent-blue hover:translate-x-1 max-md:flex-wrap"
              >
                <span className="text-[13px] text-text-secondary min-w-[50px]">
                  {formatDate(thread.published_at || thread.created_at)}
                </span>
                <span className="text-text-secondary">·</span>
                <span className="text-sm flex-1">{thread.title}</span>
                <div className="flex gap-2 max-md:w-full">
                  {thread.tags && thread.tags.map((tag) => (
                    <span key={tag.id} className="text-xs text-accent-blue">
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 没有 slug 参数，显示归档页面
  const archives = [
    {
      year: 2025,
      count: 11,
      posts: [
        { id: 1, date: '03-18', title: '一年只需 10 HKD 的香港保号卡 hahaSIM 开箱测评', tags: ['科技', '折腾'] },
      ]
    },
    {
      year: 2024,
      count: 45,
      posts: [
        { id: 2, date: '12-15', title: 'Firefox 扩展推荐 — Multi-Account Containers', tags: ['软件'] },
        { id: 3, date: '12-07', title: '把 Github 当作图床使用', tags: ['Github', '折腾'] },
        { id: 4, date: '08-08', title: '浅谈我眼中的关于 WindowsXP 的 Chromium108', tags: ['Chromium'] },
      ]
    },
    {
      year: 2023,
      count: 32,
      posts: [
        { id: 5, date: '05-05', title: '来自多设备协作发 Chris Lonsdale 的通法方法论', tags: ['技巧', '通法完想'] },
      ]
    }
  ]

  return (
    <div className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-10 max-md:p-6">
      <div className="mb-8 pb-5 border-b border-border">
        <h1 className="text-[28px] font-bold text-text-primary mb-2">归档</h1>
        <p className="text-sm text-text-secondary">按年份查看所有文章</p>
      </div>

      <div className="flex flex-col gap-10">
        {archives.map((archive) => (
          <div key={archive.year} className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold text-text-primary">{archive.year}</h2>
              <span className="text-[13px] text-text-secondary bg-white/5 px-3 py-1 rounded-xl">
                {archive.count} 篇文章
              </span>
            </div>

            <div className="flex flex-col gap-3 pl-8 max-md:pl-0">
              {archive.posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/thread/${post.id}`}
                  className="flex items-center gap-2.5 p-3 px-4 bg-white/[0.03] rounded-lg border border-border transition-all text-text-primary hover:bg-white/5 hover:border-accent-blue hover:translate-x-1 max-md:flex-wrap"
                >
                  <span className="text-[13px] text-text-secondary min-w-[50px]">
                    {post.date}
                  </span>
                  <span className="text-text-secondary">·</span>
                  <span className="text-sm flex-1">{post.title}</span>
                  <div className="flex gap-2 max-md:w-full">
                    {post.tags.map((tag, index) => (
                      <span key={index} className="text-xs text-accent-blue">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CategoryPage
