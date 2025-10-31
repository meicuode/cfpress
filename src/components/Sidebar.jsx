import { Link } from 'react-router-dom'

function Sidebar() {
  const categories = [
    { name: '分享', count: 23, icon: '📝' },
    { name: '存档', count: 15, icon: '📦' },
    { name: '折腾', count: 32, icon: '🔧' },
    { name: '日常', count: 18, icon: '📅' },
  ]

  return (
    <aside className="w-[280px] flex-shrink-0 flex flex-col gap-5 max-[968px]:w-full">
      {/* Profile Card */}
      <div className="bg-bg-card backdrop-blur-md rounded-xl p-8 px-5 text-center border border-border">
        <div className="w-[120px] h-[120px] mx-auto mb-4 rounded-xl overflow-hidden border-2 border-border">
          <img src="/avatar.png" alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-lg font-semibold mb-2 text-text-primary">没有梦想的成品</h2>
        <p className="text-[13px] text-text-secondary mb-5 leading-relaxed">
          在计时赛金会是怎样的表现呢就看想
        </p>

        <div className="flex justify-center gap-2.5">
          <a
            href="#"
            className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-lg transition-all text-lg hover:bg-white/10 hover:-translate-y-0.5"
            title="GitHub"
          >
            <span>💻</span>
          </a>
          <a
            href="#"
            className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-lg transition-all text-lg hover:bg-white/10 hover:-translate-y-0.5"
            title="WeChat"
          >
            <span>💬</span>
          </a>
          <a
            href="#"
            className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-lg transition-all text-lg hover:bg-white/10 hover:-translate-y-0.5"
            title="Steam"
          >
            <span>🎮</span>
          </a>
          <a
            href="#"
            className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-lg transition-all text-lg hover:bg-white/10 hover:-translate-y-0.5"
            title="Email"
          >
            <span>✉️</span>
          </a>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-bg-card backdrop-blur-md rounded-xl p-5 border border-border">
        <h3 className="text-base font-semibold mb-4 text-text-primary">分类</h3>
        <div className="flex flex-col gap-2">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={`/tag/${category.name}`}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-text-secondary transition-all text-sm hover:bg-white/5 hover:text-text-primary"
            >
              <span className="text-base">{category.icon}</span>
              <span className="flex-1">{category.name}</span>
              <span className="bg-accent-blue/20 text-accent-blue px-2 py-0.5 rounded-xl text-xs font-medium">
                {category.count}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
