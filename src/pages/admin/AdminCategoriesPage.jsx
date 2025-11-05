import { useEffect } from 'react'

function AdminCategoriesPage() {
  useEffect(() => {
    document.title = '分类管理'
  }, [])

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 p-6 pb-4">
        <h1 className="text-2xl font-normal text-[#23282d] mb-2">分类管理</h1>
        <p className="text-sm text-[#646970]">管理文章分类和标签</p>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h2 className="text-xl font-medium text-[#23282d] mb-2">分类管理功能</h2>
          <p className="text-[#646970] mb-6">此功能正在开发中，敬请期待...</p>
          <div className="text-sm text-[#646970] bg-gray-50 p-4 rounded-lg inline-block">
            <p className="mb-2">将支持以下功能：</p>
            <ul className="text-left space-y-1">
              <li>• 创建和编辑文章分类</li>
              <li>• 设置分类层级结构</li>
              <li>• 为分类设置别名和描述</li>
              <li>• 批量管理分类</li>
              <li>• 查看分类下的文章数量</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminCategoriesPage
