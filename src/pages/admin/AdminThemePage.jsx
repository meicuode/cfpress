import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import ThemeSelector from '../../components/ThemeSelector'
import { useLayout } from '../../contexts/LayoutContext'
import { useToast } from '../../contexts/ToastContext'

function AdminThemePage() {
  const { isEditMode, toggleEditMode, resetLayout } = useLayout()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('theme') // theme | layout

  const handleResetLayout = (layoutKey) => {
    if (window.confirm(`确定要重置 "${layoutKey}" 页面的布局吗？`)) {
      resetLayout(layoutKey)
      toast.success('布局已重置')
    }
  }

  return (
    <>
      <Helmet>
        <title>主题设置 - 管理后台</title>
      </Helmet>

      <div className="p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-2">主题设置</h1>
          <p className="text-text-secondary">自定义网站主题和页面布局</p>
        </header>

        {/* 标签页 */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('theme')}
            className={`px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'theme'
                ? 'text-accent-blue'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            颜色主题
            {activeTab === 'theme' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('layout')}
            className={`px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'layout'
                ? 'text-accent-blue'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            页面布局
            {activeTab === 'layout' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue" />
            )}
          </button>
        </div>

        {/* 内容区域 */}
        <div className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-6">
          {/* 颜色主题 */}
          {activeTab === 'theme' && (
            <div>
              <ThemeSelector />
            </div>
          )}

          {/* 页面布局 */}
          {activeTab === 'layout' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">布局编辑模式</h3>
                <p className="text-sm text-text-secondary mb-4">
                  开启编辑模式后，前台页面的组件可以拖拽调整位置和大小。
                </p>
                <button
                  onClick={toggleEditMode}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    isEditMode
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-accent-blue hover:bg-blue-500 text-white'
                  }`}
                >
                  {isEditMode ? '🔒 关闭编辑模式' : '🔓 开启编辑模式'}
                </button>
                {isEditMode && (
                  <p className="mt-3 text-sm text-accent-blue">
                    ✓ 编辑模式已开启，请访问前台页面进行布局调整
                  </p>
                )}
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-medium text-text-primary mb-4">重置布局</h3>
                <p className="text-sm text-text-secondary mb-4">
                  将页面布局恢复为默认设置。
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleResetLayout('home')}
                    className="px-4 py-2 bg-bg-secondary hover:bg-opacity-80 text-text-primary rounded-lg border border-border transition-colors"
                  >
                    重置首页布局
                  </button>
                  {/* 可以添加更多页面的重置按钮 */}
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-medium text-text-primary mb-3">使用说明</h3>
                <div className="bg-bg-secondary/50 rounded-lg p-4">
                  <ul className="space-y-2 text-sm text-text-secondary">
                    <li className="flex items-start gap-2">
                      <span className="text-accent-blue mt-0.5">▪</span>
                      <span>点击"开启编辑模式"后，访问首页等支持拖拽的页面</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-blue mt-0.5">▪</span>
                      <span>拖拽组件边框可以移动位置</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-blue mt-0.5">▪</span>
                      <span>拖拽组件右下角可以调整大小</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-blue mt-0.5">▪</span>
                      <span>布局会自动保存到浏览器本地</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-blue mt-0.5">▪</span>
                      <span>移动端暂不支持拖拽功能</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default AdminThemePage
