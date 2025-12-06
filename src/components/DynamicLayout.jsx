import { useLayout, AVAILABLE_MODULES } from '../contexts/LayoutContext'
import { ProfileCard, CategoriesCard, TagsCloud, RecentPosts } from './modules'

// 模块ID到组件的映射
const MODULE_COMPONENTS = {
  profile: ProfileCard,
  categories: CategoriesCard,
  tags: TagsCloud,
  recentPosts: RecentPosts,
  // posts 模块由 children (Outlet) 渲染，不在这里处理
}

// 渲染单个模块
function ModuleRenderer({ moduleId }) {
  const Component = MODULE_COMPONENTS[moduleId]
  if (!Component) return null
  return <Component />
}

// 渲染侧边栏（左或右）
function SidebarColumn({ modules }) {
  if (!modules || modules.length === 0) return null

  return (
    <aside className="w-[280px] flex-shrink-0 flex flex-col gap-5 max-[968px]:w-full sticky top-[90px] self-start max-h-[calc(100vh-110px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {modules.map(moduleId => (
        <ModuleRenderer key={moduleId} moduleId={moduleId} />
      ))}
    </aside>
  )
}

function DynamicLayout({ children }) {
  const { getLayoutConfig } = useLayout()
  const config = getLayoutConfig('home')

  // 获取各区域的模块（排除 posts，因为 posts 由 children 渲染）
  const leftModules = (config.leftSidebar || []).filter(id => id !== 'posts')
  const rightModules = (config.rightSidebar || []).filter(id => id !== 'posts')

  // 检测 posts 在哪个区域
  const postsInLeft = (config.leftSidebar || []).includes('posts')
  const postsInRight = (config.rightSidebar || []).includes('posts')
  const postsInMain = (config.main || []).includes('posts')

  // 如果 posts 在侧边栏，主内容区需要调整宽度
  const mainClass = postsInMain
    ? 'flex-1 min-w-0'
    : 'w-[280px] flex-shrink-0'

  return (
    <div className="flex max-w-[1200px] mx-auto mt-[96px] px-6 gap-8 w-full flex-1 max-[968px]:flex-col max-[968px]:px-5 pb-16">
      {/* 左侧边栏 */}
      {leftModules.length > 0 && (
        <SidebarColumn modules={leftModules} />
      )}

      {/* 如果 posts 在左边栏 */}
      {postsInLeft && (
        <aside className="w-[280px] flex-shrink-0 flex flex-col gap-5 max-[968px]:w-full">
          {children}
        </aside>
      )}

      {/* 主内容区 - 只有 posts 在 main 区域时才渲染 */}
      {postsInMain && (
        <main className={mainClass}>
          {children}
        </main>
      )}

      {/* 如果 posts 在右边栏 */}
      {postsInRight && (
        <aside className="w-[280px] flex-shrink-0 flex flex-col gap-5 max-[968px]:w-full">
          {children}
        </aside>
      )}

      {/* 右侧边栏 */}
      {rightModules.length > 0 && (
        <SidebarColumn modules={rightModules} />
      )}
    </div>
  )
}

export default DynamicLayout
