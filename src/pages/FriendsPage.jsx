import { Helmet } from 'react-helmet-async'

function FriendsPage() {
  const friends = [
    {
      name: '友链站点 1',
      url: 'https://example1.com',
      description: '这是一个很棒的博客',
      avatar: '🌟'
    },
    {
      name: '友链站点 2',
      url: 'https://example2.com',
      description: '技术分享与生活记录',
      avatar: '💡'
    },
    {
      name: '友链站点 3',
      url: 'https://example3.com',
      description: '热爱编程和摄影',
      avatar: '📷'
    }
  ]

  return (
    <>
      <Helmet>
        <title>友情链接 - CFPress</title>
      </Helmet>
      <div className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-10 max-md:p-6">
      <div className="mb-8 pb-5 border-b border-border">
        <h1 className="text-[28px] font-bold text-text-primary mb-2">友链</h1>
        <p className="text-sm text-text-secondary">这里是我的朋友们</p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 mb-10 max-md:grid-cols-1">
        {friends.map((friend, index) => (
          <a
            key={index}
            href={friend.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/[0.03] border border-border rounded-xl p-6 text-center transition-all block hover:bg-white/5 hover:border-accent-blue hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
          >
            <div className="w-[60px] h-[60px] mx-auto mb-4 flex items-center justify-center bg-bg-card rounded-xl text-[30px]">
              {friend.avatar}
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {friend.name}
            </h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              {friend.description}
            </p>
          </a>
        ))}
      </div>

      <div className="pt-8 border-t border-border">
        <h2 className="text-xl font-semibold text-text-primary mb-2.5">申请友链</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          如果你想和我交换友链，请通过邮件联系我。
        </p>
      </div>
    </div>
    </>
  )
}

export default FriendsPage
