import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

function Sidebar() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [authorInfo, setAuthorInfo] = useState({
    avatar: '/avatar.png',
    name: '没有梦想的成品',
    bio: '在计时赛金会是怎样的表现呢就看想',
    socialPlatforms: []
  })

  useEffect(() => {
    loadCategories()
    loadAuthorInfo()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (response.ok) {
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('加载分类失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAuthorInfo = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()

        // 解析社交平台信息
        let socialPlatforms = []
        if (data.author_social_platforms) {
          try {
            const allPlatforms = JSON.parse(data.author_social_platforms)
            console.log('所有社交平台数据:', allPlatforms)

            // 过滤：只显示启用的平台，且有name，最多显示6个
            socialPlatforms = allPlatforms
              .filter(p => {
                const isValid = p.enabled && p.name
                if (!isValid) {
                  console.log('平台被过滤:', p.name || '未命名', {
                    enabled: p.enabled,
                    hasName: !!p.name
                  })
                }
                return isValid
              })
              .slice(0, 6)

            console.log('最终显示的平台数量:', socialPlatforms.length, socialPlatforms)
          } catch (e) {
            console.error('解析社交平台数据失败:', e)
          }
        }

        setAuthorInfo({
          avatar: data.author_avatar || '/avatar.png',
          name: data.author_name || '没有梦想的成品',
          bio: data.author_bio || '在计时赛金会是怎样的表现呢就看想',
          socialPlatforms
        })
      }
    } catch (error) {
      console.error('加载博主信息失败:', error)
    }
  }

  // 分类图标映射（可以根据分类 slug 或名称自定义）
  const getCategoryIcon = (category) => {
    const iconMap = {
      'tech': '💻',
      'life': '📅',
      'share': '📝',
      'archive': '📦',
      'uncategorized': '📂'
    }
    return iconMap[category.slug] || '📌'
  }

  // 根据社交平台数量返回自适应的样式类
  const getSocialIconClasses = () => {
    const count = authorInfo.socialPlatforms.length

    if (count <= 2) {
      // 2个：大图标
      return {
        containerGap: 'gap-3',
        iconSize: 'w-11 h-11',
        iconText: 'text-xl'
      }
    } else if (count <= 4) {
      // 3-4个：中等图标
      return {
        containerGap: 'gap-2.5',
        iconSize: 'w-9 h-9',
        iconText: 'text-lg'
      }
    } else {
      // 5-6个：小图标
      return {
        containerGap: 'gap-2',
        iconSize: 'w-8 h-8',
        iconText: 'text-base'
      }
    }
  }

  const socialStyles = authorInfo.socialPlatforms.length >= 2 ? getSocialIconClasses() : {
    containerGap: 'gap-2.5',
    iconSize: 'w-9 h-9',
    iconText: 'text-lg'
  }

  return (
    <aside className="w-[280px] flex-shrink-0 flex flex-col gap-5 max-[968px]:w-full sticky top-[90px] self-start max-h-[calc(100vh-110px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {/* Profile Card */}
      <div className="bg-bg-card backdrop-blur-md rounded-xl p-8 px-5 text-center border border-border">
        <div className="w-[120px] h-[120px] mx-auto mb-4 rounded-xl overflow-hidden border-2 border-border">
          <img src={authorInfo.avatar} alt={authorInfo.name} className="w-full h-full object-cover" />
        </div>
        <h2 className="text-lg font-semibold mb-2 text-text-primary">{authorInfo.name}</h2>
        <p className="text-[13px] text-text-secondary mb-5 leading-relaxed">
          {authorInfo.bio}
        </p>

        {/* 社交平台图标 - 自适应大小，确保不换行 */}
        {authorInfo.socialPlatforms.length >= 2 && (
          <div className={`flex justify-center items-center flex-nowrap ${socialStyles.containerGap}`}>
            {authorInfo.socialPlatforms.map((platform, index) => {
              // 判断是图片URL还是emoji
              const isImageUrl = platform.icon && (platform.icon.startsWith('http') || platform.icon.startsWith('/'))

              return (
                <a
                  key={index}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${socialStyles.iconSize} flex items-center justify-center bg-white/5 rounded-lg transition-all hover:bg-white/10 hover:-translate-y-0.5 flex-shrink-0`}
                  title={platform.name}
                >
                  {isImageUrl ? (
                    <img
                      src={platform.icon}
                      alt={platform.name}
                      className="w-[60%] h-[60%] object-contain"
                    />
                  ) : (
                    <span className={socialStyles.iconText}>{platform.icon || '🔗'}</span>
                  )}
                </a>
              )
            })}
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="bg-bg-card backdrop-blur-md rounded-xl p-5 border border-border">
        <h3 className="text-base font-semibold mb-2 text-text-primary">分类</h3>
        <div className="flex flex-col gap-1">
          {loading ? (
            <div className="text-sm text-text-secondary text-center py-4">加载中...</div>
          ) : categories.length === 0 ? (
            <div className="text-sm text-text-secondary text-center py-4">暂无分类</div>
          ) : (
            categories.slice(0, 5).map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-text-secondary transition-all text-sm hover:bg-white/5 hover:text-text-primary"
              >
                <span className="text-base">{getCategoryIcon(category)}</span>
                <span className="flex-1">{category.name}</span>
                <span className="bg-accent-blue/20 text-accent-blue px-2 py-0.5 rounded-xl text-xs font-medium">
                  {category.thread_count || 0}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
