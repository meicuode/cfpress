import { Helmet } from 'react-helmet-async'
import ThemeSelector from '../../components/ThemeSelector'

function AdminThemeColorPage() {
  return (
    <>
      <Helmet>
        <title>颜色主题 - 管理后台</title>
      </Helmet>

      <div className="p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-2">颜色主题</h1>
          <p className="text-text-secondary">选择预设主题或自定义颜色</p>
        </header>

        <div className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-6">
          <ThemeSelector />
        </div>
      </div>
    </>
  )
}

export default AdminThemeColorPage
