import { useState, useEffect } from 'react'

function ProfileCard() {
  const [authorInfo, setAuthorInfo] = useState({
    avatar: '/avatar.png',
    name: '没有梦想的成品',
    bio: '在计时赛金会是怎样的表现呢就看想',
    socialPlatforms: []
  })

  useEffect(() => {
    loadAuthorInfo()
  }, [])

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
            // 过滤：只显示启用的平台，且有name，最多显示6个
            socialPlatforms = allPlatforms
              .filter(p => p.enabled && p.name)
              .slice(0, 6)
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

  // 根据社交平台数量返回自适应的样式类
  const getSocialIconClasses = () => {
    const count = authorInfo.socialPlatforms.length

    if (count <= 2) {
      return {
        containerGap: 'gap-3',
        iconSize: 'w-11 h-11',
        iconText: 'text-xl'
      }
    } else if (count <= 4) {
      return {
        containerGap: 'gap-2.5',
        iconSize: 'w-9 h-9',
        iconText: 'text-lg'
      }
    } else {
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
    <div className="bg-bg-card backdrop-blur-md rounded-xl p-8 px-5 text-center border border-border">
      <div className="w-[120px] h-[120px] mx-auto mb-4 rounded-xl overflow-hidden border-2 border-border">
        <img src={authorInfo.avatar} alt={authorInfo.name} className="w-full h-full object-cover" />
      </div>
      <h2 className="text-lg font-semibold mb-2 text-text-primary">{authorInfo.name}</h2>
      <p className="text-[13px] text-text-secondary mb-5 leading-relaxed">
        {authorInfo.bio}
      </p>

      {/* 社交平台图标 */}
      {authorInfo.socialPlatforms.length >= 2 && (
        <div className={`flex justify-center items-center flex-nowrap ${socialStyles.containerGap}`}>
          {authorInfo.socialPlatforms.map((platform, index) => {
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
  )
}

export default ProfileCard
