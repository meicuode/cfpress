import { useLayout, AVAILABLE_MODULES } from '../contexts/LayoutContext'
import { ProfileCard, CategoriesCard, TagsCloud, RecentPosts } from './modules'

// 模块ID到组件的映射
const MODULE_COMPONENTS = {
  profile: ProfileCard,
  categories: CategoriesCard,
  tags: TagsCloud,
  recentPosts: RecentPosts,
  // posts, content, comments, toc 模块由 children 渲染，不在这里处理
}

// 需要由 children 渲染的核心模块
const CORE_MODULES = ['posts', 'content', 'comments', 'toc']

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

function DynamicLayout({ children, pageType = 'home' }) {
  const { getLayoutConfig } = useLayout()
  const config = getLayoutConfig(pageType)

  // 获取各区域的模块（排除核心模块，因为核心模块由 children 渲染）
  const leftModules = (config.leftSidebar || []).filter(id => !CORE_MODULES.includes(id))
  const rightModules = (config.rightSidebar || []).filter(id => !CORE_MODULES.includes(id))

  // 检测核心模块在哪个区域（只取第一个匹配的区域）
  const coreInLeft = (config.leftSidebar || []).some(id => CORE_MODULES.includes(id))
  const coreInMain = (config.main || []).some(id => CORE_MODULES.includes(id))
  const coreInRight = (config.rightSidebar || []).some(id => CORE_MODULES.includes(id))

  // 确定核心内容放在哪个区域（优先级：main > left > right）
  let corePosition = 'main' // 默认放在 main
  if (coreInMain) {
    corePosition = 'main'
  } else if (coreInLeft) {
    corePosition = 'left'
  } else if (coreInRight) {
    corePosition = 'right'
  }

  return (
    <div className="flex max-w-[1200px] mx-auto mt-[96px] px-6 gap-8 w-full flex-1 max-[968px]:flex-col max-[968px]:px-5 pb-16">
      {/* 左侧边栏 */}
      {leftModules.length > 0 && (
        <SidebarColumn modules={leftModules} />
      )}

      {/* 如果核心模块在左边栏 */}
      {corePosition === 'left' && (
        <aside className="w-[280px] flex-shrink-0 flex flex-col gap-5 max-[968px]:w-full">
          {children}
        </aside>
      )}

      {/* 主内容区 */}
      {corePosition === 'main' && (
        <main className="flex-1 min-w-0">
          {children}
        </main>
      )}

      {/* 如果核心模块在右边栏 */}
      {corePosition === 'right' && (
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
