import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useToast } from '../contexts/ToastContext'
import CommentForm from '../components/CommentForm'
import CommentList from '../components/CommentList'
import PostNavigation from '../components/PostNavigation'

function ThreadPage() {
  const { id } = useParams()
  const toast = useToast()
  const contentRef = useRef(null)
  const articleRef = useRef(null)
  const [thread, setThread] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [replyTo, setReplyTo] = useState(null) // 回复的评论 ID
  const [lightboxImage, setLightboxImage] = useState(null) // 图片预览
  const [showOriginalSize, setShowOriginalSize] = useState(false) // 是否显示原图尺寸
  const [readingProgress, setReadingProgress] = useState(0) // 阅读进度 0-100

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-')
  }

  // 加载文章详情
  useEffect(() => {
    loadThread()
  }, [id])

  // 加载评论
  useEffect(() => {
    if (id) {
      loadComments()
    }
  }, [id])

  // 应用代码高亮和添加复制按钮
  useEffect(() => {
    const initHighlight = async () => {
      if (thread && contentRef.current) {
        // 检查是否有代码块
        const codeBlocks = contentRef.current.querySelectorAll('pre.ql-syntax, pre code')
        if (codeBlocks.length === 0) return // 没有代码块，不加载 highlight.js

        // 动态导入 highlight.js 和常用语言
        const { default: hljs } = await import('highlight.js/lib/core')
        const [
          javascript, typescript, python, java, cpp, csharp,
          go, rust, php, ruby, sql, json, xml, css, bash, yaml, markdown
        ] = await Promise.all([
          import('highlight.js/lib/languages/javascript'),
          import('highlight.js/lib/languages/typescript'),
          import('highlight.js/lib/languages/python'),
          import('highlight.js/lib/languages/java'),
          import('highlight.js/lib/languages/cpp'),
          import('highlight.js/lib/languages/csharp'),
          import('highlight.js/lib/languages/go'),
          import('highlight.js/lib/languages/rust'),
          import('highlight.js/lib/languages/php'),
          import('highlight.js/lib/languages/ruby'),
          import('highlight.js/lib/languages/sql'),
          import('highlight.js/lib/languages/json'),
          import('highlight.js/lib/languages/xml'),
          import('highlight.js/lib/languages/css'),
          import('highlight.js/lib/languages/bash'),
          import('highlight.js/lib/languages/yaml'),
          import('highlight.js/lib/languages/markdown'),
        ])

        // 动态导入 CSS
        await import('highlight.js/styles/github-dark.css')

        // 注册语言
        hljs.registerLanguage('javascript', javascript.default)
        hljs.registerLanguage('typescript', typescript.default)
        hljs.registerLanguage('python', python.default)
        hljs.registerLanguage('java', java.default)
        hljs.registerLanguage('cpp', cpp.default)
        hljs.registerLanguage('csharp', csharp.default)
        hljs.registerLanguage('go', go.default)
        hljs.registerLanguage('rust', rust.default)
        hljs.registerLanguage('php', php.default)
        hljs.registerLanguage('ruby', ruby.default)
        hljs.registerLanguage('sql', sql.default)
        hljs.registerLanguage('json', json.default)
        hljs.registerLanguage('xml', xml.default)
        hljs.registerLanguage('html', xml.default) // HTML 使用 xml
        hljs.registerLanguage('css', css.default)
        hljs.registerLanguage('bash', bash.default)
        hljs.registerLanguage('shell', bash.default) // shell 使用 bash
        hljs.registerLanguage('yaml', yaml.default)
        hljs.registerLanguage('markdown', markdown.default)

        // 对所有代码块应用语法高亮
        codeBlocks.forEach((block) => {
          // 如果是 pre 标签，需要包装成 code 标签
          let codeElement = block
          let preElement = block

          if (block.tagName === 'PRE') {
            // Quill 格式: <pre class="ql-syntax">
            // 创建 code 元素并转移内容
            if (!block.querySelector('code')) {
              const code = document.createElement('code')
              code.textContent = block.textContent
              block.textContent = ''
              block.appendChild(code)
              codeElement = code
            } else {
              codeElement = block.querySelector('code')
            }
            preElement = block
          } else {
            // 标准格式: <pre><code>
            preElement = block.parentElement
            codeElement = block
          }

          // 应用语法高亮
          if (codeElement && !codeElement.classList.contains('hljs')) {
            hljs.highlightElement(codeElement)
          }

          // 为每个代码块添加复制按钮
          if (preElement && !preElement.querySelector('.copy-button')) {
            // 创建容器
            preElement.style.position = 'relative'

            // 创建复制按钮
            const copyButton = document.createElement('button')
            copyButton.className = 'copy-button'
            copyButton.innerHTML = '📋 复制'
            copyButton.style.cssText = `
              position: absolute;
              top: 8px;
              right: 8px;
              padding: 4px 12px;
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 4px;
              color: #e0e0e0;
              font-size: 12px;
              cursor: pointer;
              transition: all 0.2s;
              z-index: 1;
            `

            // 鼠标悬停效果
            copyButton.onmouseenter = () => {
              copyButton.style.background = 'rgba(255, 255, 255, 0.2)'
            }
            copyButton.onmouseleave = () => {
              copyButton.style.background = 'rgba(255, 255, 255, 0.1)'
            }

            // 复制功能
            copyButton.onclick = async () => {
              try {
                await navigator.clipboard.writeText(codeElement.textContent)
                copyButton.innerHTML = '✅ 已复制'
                setTimeout(() => {
                  copyButton.innerHTML = '📋 复制'
                }, 2000)
                toast.success('代码已复制到剪贴板')
              } catch (err) {
                console.error('复制失败:', err)
                toast.error('复制失败')
              }
            }

            preElement.appendChild(copyButton)
          }
        })
      }
    }

    initHighlight()
  }, [thread, toast])

  // 为文章内容中的图片添加点击放大功能，并将图片替换为缩略图
  useEffect(() => {
    if (thread && contentRef.current) {
      const images = contentRef.current.querySelectorAll('img')

      const handleImageClick = (e) => {
        const img = e.target
        if (img.tagName === 'IMG') {
          // 使用原图 URL（存储在 data-original 属性中）
          const originalUrl = img.getAttribute('data-original') || img.src
          setLightboxImage(originalUrl)
        }
      }

      images.forEach(img => {
        const originalSrc = img.src

        // 保存原图 URL
        img.setAttribute('data-original', originalSrc)

        // 如果是我们的 R2 图片（包含 /api/files/），使用 srcset 让浏览器自动选择
        if (originalSrc.includes('/api/files/') && !originalSrc.includes('/thumbnails/')) {
          // 提取 r2_key 部分
          const urlParts = originalSrc.split('/api/files/')
          if (urlParts.length === 2) {
            const r2Key = urlParts[1]
            const filename = r2Key.split('/').pop().replace(/\.(jpg|jpeg|png|gif)$/i, '.webp')

            const thumbUrl = `/api/files/thumbnails/thumb/${filename}`
            const mediumUrl = `/api/files/thumbnails/medium/${filename}`

            // 使用 srcset 让浏览器根据显示尺寸自动选择最合适的图片
            // thumb: 300px, medium: 800px, 原图用于更大尺寸
            img.srcset = `${thumbUrl} 300w, ${mediumUrl} 800w, ${originalSrc} 1200w`

            // sizes 告诉浏览器图片在不同屏幕宽度下的显示尺寸
            // 这里假设图片最大宽度为容器宽度，可以根据实际情况调整
            img.sizes = '(max-width: 400px) 300px, (max-width: 900px) 800px, 1200px'

            // 设置默认 src 为 medium（兼容不支持 srcset 的浏览器）
            img.src = mediumUrl

            console.log(`✓ 设置图片 srcset: thumb(300w), medium(800w), original(1200w)`)
          }
        }

        img.style.cursor = 'pointer'
        img.addEventListener('click', handleImageClick)
      })

      return () => {
        images.forEach(img => {
          img.removeEventListener('click', handleImageClick)
        })
      }
    }
  }, [thread])

  // 关闭图片预览
  const closeLightbox = () => {
    setLightboxImage(null)
    setShowOriginalSize(false)
  }

  // 处理ESC键关闭图片预览
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && lightboxImage) {
        closeLightbox()
      }
    }

    if (lightboxImage) {
      document.addEventListener('keydown', handleEscape)
      // 防止背景滚动
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [lightboxImage])

  // 阅读进度条
  useEffect(() => {
    const calculateProgress = () => {
      if (!articleRef.current) return

      const article = articleRef.current
      const articleRect = article.getBoundingClientRect()
      const articleTop = articleRect.top + window.scrollY
      const articleHeight = article.offsetHeight
      const windowHeight = window.innerHeight
      const scrollY = window.scrollY

      // 计算文章可见区域的进度
      // 当文章顶部到达视口顶部时开始计算
      // 当文章底部到达视口底部时完成
      const startPoint = articleTop
      const endPoint = articleTop + articleHeight - windowHeight

      if (scrollY <= startPoint) {
        setReadingProgress(0)
      } else if (scrollY >= endPoint) {
        setReadingProgress(100)
      } else {
        const progress = ((scrollY - startPoint) / (endPoint - startPoint)) * 100
        setReadingProgress(Math.min(100, Math.max(0, progress)))
      }
    }

    // 使用 requestAnimationFrame 优化滚动性能
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          calculateProgress()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    // 初始计算
    calculateProgress()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [thread])

  const loadThread = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/threads/${id}`)
      const data = await response.json()

      if (response.ok) {
        setThread(data.thread)
      } else {
        setError(data.error || '加载文章失败')
      }
    } catch (err) {
      console.error('加载文章失败:', err)
      setError('加载文章失败')
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/comments?thread_id=${id}`)
      const data = await response.json()

      if (response.ok) {
        setComments(data.comments || [])
      }
    } catch (err) {
      console.error('加载评论失败:', err)
    }
  }

  const handleCommentSubmit = async (formData) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thread_id: id,
          parent_id: replyTo, // 如果是回复，传递 parent_id
          author_name: formData.nickname,
          author_email: formData.email,
          author_website: formData.website || null,
          content: formData.content,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // 重新加载评论列表
        await loadComments()
        // 重新加载文章以更新评论数
        await loadThread()
        // 清除回复状态
        setReplyTo(null)
        toast.success(replyTo ? '回复发布成功！' : '评论发布成功！')
      } else {
        toast.error(data.error || '评论发布失败')
      }
    } catch (err) {
      console.error('发布评论失败:', err)
      toast.error('评论发布失败')
    }
  }

  const handleRefresh = () => {
    loadComments()
  }

  const handleReply = (commentId) => {
    setReplyTo(commentId)
    // 滚动到评论表单
    const formElement = document.querySelector('#comment-form')
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    toast.info('正在回复评论...')
  }

  const handleCancelReply = () => {
    setReplyTo(null)
  }

  const handleLike = async (commentId) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        // 更新本地评论的点赞数
        setComments(comments.map(comment =>
          comment.id === commentId
            ? { ...comment, like_count: data.likeCount }
            : comment
        ))
        toast.success('点赞成功！')
      } else {
        toast.error(data.error || '点赞失败')
      }
    } catch (err) {
      console.error('点赞失败:', err)
      toast.error('点赞失败')
    }
  }

  // 加载状态
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-text-secondary">加载中...</div>
      </div>
    )
  }

  // 错误状态
  if (error || !thread) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-red-400">{error || '文章不存在'}</div>
      </div>
    )
  }

  // 提取文章中的第一张图片作为封面图
  const getFirstImage = (content) => {
    if (!content) return null
    const match = content.match(/<img[^>]+src="([^"]+)"/)
    return match ? match[1] : null
  }

  // 生成纯文本摘要
  const getPlainTextExcerpt = (content, maxLength = 160) => {
    if (!content) return ''
    // 移除 HTML 标签
    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const articleUrl = `${window.location.origin}/thread/${thread.id}`
  const coverImage = getFirstImage(thread.content) || '/avatar.png'
  const excerpt = thread.excerpt || getPlainTextExcerpt(thread.content)
  const publishDate = thread.published_at || thread.created_at
  const modifiedDate = thread.updated_at || publishDate

  // Schema.org 结构化数据
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: thread.title,
    description: excerpt,
    image: coverImage.startsWith('http') ? coverImage : `${window.location.origin}${coverImage}`,
    datePublished: publishDate,
    dateModified: modifiedDate,
    author: {
      '@type': 'Person',
      name: thread.author_name || 'Admin'
    },
    publisher: {
      '@type': 'Organization',
      name: 'CFPress',
      logo: {
        '@type': 'ImageObject',
        url: `${window.location.origin}/avatar.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl
    }
  }

  return (
    <>
      <Helmet>
        {/* 基础 SEO */}
        <title>{thread.title} - CFPress</title>
        <meta name="description" content={excerpt} />
        <link rel="canonical" href={articleUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={articleUrl} />
        <meta property="og:title" content={thread.title} />
        <meta property="og:description" content={excerpt} />
        <meta property="og:image" content={coverImage.startsWith('http') ? coverImage : `${window.location.origin}${coverImage}`} />
        <meta property="og:site_name" content="CFPress" />
        <meta property="article:published_time" content={publishDate} />
        <meta property="article:modified_time" content={modifiedDate} />
        {thread.tags?.map(tag => (
          <meta key={tag.id} property="article:tag" content={tag.name} />
        ))}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={articleUrl} />
        <meta name="twitter:title" content={thread.title} />
        <meta name="twitter:description" content={excerpt} />
        <meta name="twitter:image" content={coverImage.startsWith('http') ? coverImage : `${window.location.origin}${coverImage}`} />

        {/* Schema.org 结构化数据 */}
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      </Helmet>

      {/* 阅读进度条 - 通过 Portal 渲染到导航栏底部 */}
      {typeof document !== 'undefined' && document.getElementById('reading-progress-bar') && createPortal(
        <div className="h-[3px] bg-black/10">
          <div
            className="h-full bg-gradient-to-r from-accent-blue to-blue-400 transition-all duration-150 ease-out shadow-[0_0_8px_rgba(74,158,255,0.5)]"
            style={{ width: `${readingProgress}%` }}
          />
        </div>,
        document.getElementById('reading-progress-bar')
      )}

      <div className="flex flex-col gap-8">
      <article ref={articleRef} className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-10 max-md:p-6">
        <header className="mb-8 pb-5 border-b border-border">
          <h1 className="text-[28px] font-bold text-text-primary mb-4 leading-tight">
            {thread.title}
          </h1>
          <div className="flex gap-5 text-[13px] text-text-secondary mb-3">
            <span>📅 {formatDate(thread.published_at || thread.created_at)}</span>
            <span>👁 {thread.view_count || 0}</span>
            <span>💬 {thread.comment_count || 0}</span>
          </div>
          {thread.tags && thread.tags.length > 0 && (
            <div className="flex gap-2.5 flex-wrap">
              {thread.tags.map((tag) => (
                <span key={tag.id} className="text-accent-blue text-[13px]">
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
          {thread.categories && thread.categories.length > 0 && (
            <div className="flex gap-2.5 flex-wrap mt-2">
              {thread.categories.map((category) => (
                <span key={category.id} className="text-text-secondary text-[13px] px-2 py-0.5 bg-bg-primary/50 rounded">
                  {category.name}
                </span>
              ))}
            </div>
          )}
        </header>

        <div
          className="text-base leading-loose text-text-primary prose prose-invert max-w-none
            [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:my-6 [&_h1]:text-text-primary
            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-5 [&_h2]:text-text-primary
            [&_h3]:text-xl [&_h3]:font-bold [&_h3]:my-4 [&_h3]:text-text-primary
            [&_h4]:text-lg [&_h4]:font-bold [&_h4]:my-3 [&_h4]:text-text-primary
            [&_p]:mb-4 [&_p]:text-text-primary
            [&_a]:text-accent-blue [&_a]:hover:underline
            [&_strong]:font-bold [&_strong]:text-text-primary
            [&_em]:italic
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
            [&_li]:mb-2 [&_li]:text-text-primary
            [&_blockquote]:border-l-4 [&_blockquote]:border-accent-blue [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4
            [&_code]:bg-gray-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
            [&_pre]:bg-gray-800 [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:my-4
            [&_img]:rounded-lg [&_img]:my-4 [&_img]:max-w-full
            [&_table]:w-full [&_table]:my-4 [&_table]:border-collapse
            [&_th]:border [&_th]:border-border [&_th]:px-4 [&_th]:py-2 [&_th]:bg-bg-primary
            [&_td]:border [&_td]:border-border [&_td]:px-4 [&_td]:py-2"
          ref={contentRef}
          dangerouslySetInnerHTML={{ __html: thread.content }}
        />
      </article>

      <section className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-8 max-md:p-5">
        <CommentList
          comments={comments.map(comment => ({
            id: comment.id,
            parent_id: comment.parent_id,
            author: comment.author_name,
            date: formatDate(comment.created_at),
            created_at: comment.created_at, // 传递原始时间戳用于排序
            content: comment.content,
            location: comment.location || '未知',
            os: comment.os || '未知',
            browser: comment.browser || '未知',
            likes: comment.like_count || 0
          }))}
          onRefresh={handleRefresh}
          onReply={handleReply}
          onLike={handleLike}
        />

        <div id="comment-form" className="mt-8">
          {replyTo && (
            <div className="mb-4 p-3 bg-accent-blue/10 border border-accent-blue/30 rounded-lg flex items-center justify-between">
              <span className="text-text-primary text-sm">
                正在回复评论 #{replyTo}
              </span>
              <button
                onClick={handleCancelReply}
                className="text-text-secondary hover:text-text-primary text-sm transition-colors"
              >
                取消回复
              </button>
            </div>
          )}
          <CommentForm onSubmit={handleCommentSubmit} />
        </div>
      </section>

      {/* TODO: 实现上一篇/下一篇导航 */}
      {/* <PostNavigation prevPost={prevPost} nextPost={nextPost} /> */}
    </div>

    {/* 图片预览 Lightbox */}
    {lightboxImage && (
      <div
        className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm"
        onClick={closeLightbox}
      >
        {/* 固定在视口顶部的按钮栏 - 不随滚动移动 */}
        <div className="fixed top-0 left-0 right-0 z-[10000] flex justify-between items-center p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
          {/* 左侧工具栏 */}
          <div className="flex gap-2 pointer-events-auto">
            {/* 切换原图尺寸 */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowOriginalSize(!showOriginalSize)
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-colors text-sm flex items-center gap-2"
              title={showOriginalSize ? "适应屏幕" : "显示原图"}
            >
              {showOriginalSize ? (
                <>
                  <span>🔍</span>
                  <span>适应屏幕</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>查看原图</span>
                </>
              )}
            </button>

            {/* 新标签页打开 */}
            <a
              href={lightboxImage}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-colors text-sm flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
              title="在新标签页打开"
            >
              <span>↗</span>
              <span>新窗口打开</span>
            </a>
          </div>

          {/* 右侧关闭按钮 */}
          <button
            className="text-white text-4xl hover:text-gray-300 transition-colors pointer-events-auto leading-none"
            onClick={closeLightbox}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        {/* 可滚动的图片容器 */}
        <div className="w-full h-full overflow-auto">
          <div className="min-h-full flex items-center justify-center p-4 pt-20 pb-4">
            <img
              src={lightboxImage}
              alt="预览"
              className={showOriginalSize ? "block" : "max-w-full max-h-[calc(100vh-8rem)] object-contain cursor-zoom-in"}
              style={showOriginalSize ? {} : {}}
              onClick={(e) => {
                e.stopPropagation()
                setShowOriginalSize(!showOriginalSize)
              }}
            />
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default ThreadPage
