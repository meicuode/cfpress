import { useState, useEffect } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'

function AdminMenusPage() {
  const toast = useToast()
  const confirm = useConfirm()

  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingMenu, setEditingMenu] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState('header')

  const [formData, setFormData] = useState({
    label: '',
    path: '',
    icon: '',
    parent_id: null,
    target: '_self',
    sort_order: 0,
    is_home: false,
    is_active: true,
    position: 'header'
  })

  useEffect(() => {
    loadMenus()
  }, [])

  const loadMenus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/navigation')
      const data = await response.json()
      if (response.ok) {
        setMenus(data.menus || [])
      } else {
        toast.error(data.error || '加载菜单失败')
      }
    } catch (error) {
      console.error('Error loading menus:', error)
      toast.error('加载菜单失败')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      label: '',
      path: '',
      icon: '',
      parent_id: null,
      target: '_self',
      sort_order: 0,
      is_home: false,
      is_active: true,
      position: selectedPosition
    })
    setEditingMenu(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const url = editingMenu
        ? `/api/admin/navigation/${editingMenu.id}`
        : '/api/admin/navigation'

      const response = await fetch(url, {
        method: editingMenu ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (response.ok) {
        toast.success(editingMenu ? '菜单项已更新' : '菜单项已创建')
        resetForm()
        loadMenus()
      } else {
        toast.error(data.error || '操作失败')
      }
    } catch (error) {
      console.error('Error saving menu:', error)
      toast.error('操作失败')
    }
  }

  const handleEdit = (menu) => {
    setEditingMenu(menu)
    setFormData({
      label: menu.label,
      path: menu.path,
      icon: menu.icon || '',
      parent_id: menu.parent_id,
      target: menu.target || '_self',
      sort_order: menu.sort_order || 0,
      is_home: menu.is_home === 1,
      is_active: menu.is_active === 1,
      position: menu.position || 'header'
    })
    setShowForm(true)
  }

  const handleDelete = async (menu) => {
    const confirmed = await confirm({
      title: '删除菜单项',
      message: `确定要删除"${menu.label}"吗？`,
      confirmText: '删除',
      type: 'danger'
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/navigation/${menu.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('菜单项已删除')
        loadMenus()
      } else {
        toast.error(data.error || '删除失败')
      }
    } catch (error) {
      console.error('Error deleting menu:', error)
      toast.error('删除失败')
    }
  }

  const getMenusByPosition = (position) => {
    return menus.filter(m => m.position === position)
  }

  const getParentMenus = (position) => {
    return menus.filter(m => m.position === position && !m.parent_id)
  }

  const getChildMenus = (parentId) => {
    return menus.filter(m => m.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order)
  }

  const renderMenuTree = (position) => {
    const positionMenus = getParentMenus(position).sort((a, b) => a.sort_order - b.sort_order)

    if (positionMenus.length === 0) {
      return (
        <div className="text-center py-8 text-[#646970]">
          暂无菜单项
        </div>
      )
    }

    return positionMenus.map((menu) => (
      <div key={menu.id} className="mb-2">
        <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <div className="flex items-center gap-3 flex-1">
            {menu.icon && <span className="text-xl">{menu.icon}</span>}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#23282d]">{menu.label}</span>
                {menu.is_home === 1 && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">首页</span>
                )}
                {menu.is_active === 0 && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">已禁用</span>
                )}
              </div>
              <div className="text-xs text-[#646970] mt-1">
                {menu.path} • 排序: {menu.sort_order}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(menu)}
              className="text-sm text-[#0073aa] hover:text-[#005a87] hover:underline"
            >
              编辑
            </button>
            <button
              onClick={() => handleDelete(menu)}
              className="text-sm text-red-600 hover:text-red-800 hover:underline"
            >
              删除
            </button>
          </div>
        </div>

        {/* 子菜单 */}
        {getChildMenus(menu.id).length > 0 && (
          <div className="ml-8 mt-2 space-y-2">
            {getChildMenus(menu.id).map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center gap-3 flex-1">
                  {child.icon && <span className="text-lg">{child.icon}</span>}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#23282d]">{child.label}</span>
                      {child.is_active === 0 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">已禁用</span>
                      )}
                    </div>
                    <div className="text-xs text-[#646970] mt-1">
                      {child.path} • 排序: {child.sort_order}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(child)}
                    className="text-xs text-[#0073aa] hover:text-[#005a87] hover:underline"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(child)}
                    className="text-xs text-red-600 hover:text-red-800 hover:underline"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-normal text-[#23282d] mb-2">菜单管理</h1>
            <p className="text-sm text-[#646970]">管理前台网站的导航菜单</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="px-4 py-2 bg-[#0073aa] text-white rounded text-sm hover:bg-[#005a87]"
          >
            添加菜单项
          </button>
        </div>
      </div>

      {/* 位置选择标签 */}
      <div className="border-b border-gray-200 p-6 py-3 flex gap-4">
        {['header', 'footer', 'sidebar'].map((pos) => (
          <button
            key={pos}
            onClick={() => setSelectedPosition(pos)}
            className={`px-4 py-2 text-sm rounded ${
              selectedPosition === pos
                ? 'bg-[#0073aa] text-white'
                : 'bg-gray-100 text-[#23282d] hover:bg-gray-200'
            }`}
          >
            {pos === 'header' && '顶部菜单'}
            {pos === 'footer' && '底部菜单'}
            {pos === 'sidebar' && '侧边栏菜单'}
            {' '}
            ({getMenusByPosition(pos).length})
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 菜单列表 */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-medium text-[#23282d] mb-4">
              {selectedPosition === 'header' && '顶部菜单'}
              {selectedPosition === 'footer' && '底部菜单'}
              {selectedPosition === 'sidebar' && '侧边栏菜单'}
            </h2>

            {loading ? (
              <div className="text-center py-8 text-[#646970]">加载中...</div>
            ) : (
              <div>{renderMenuTree(selectedPosition)}</div>
            )}
          </div>

          {/* 添加/编辑表单 */}
          {showForm && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-base font-medium text-[#23282d] mb-4">
                {editingMenu ? '编辑菜单项' : '添加菜单项'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#23282d] mb-1">
                    菜单名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-[#23282d]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#23282d] mb-1">
                    链接地址 *
                  </label>
                  <input
                    type="text"
                    value={formData.path}
                    onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                    placeholder="/about"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-[#23282d]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#23282d] mb-1">
                    图标 (emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="📚"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-[#23282d]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#23282d] mb-1">
                    父菜单
                  </label>
                  <select
                    value={formData.parent_id || ''}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-[#23282d]"
                  >
                    <option value="">无（顶级菜单）</option>
                    {getParentMenus(selectedPosition).map((menu) => (
                      <option key={menu.id} value={menu.id}>
                        {menu.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#23282d] mb-1">
                    打开方式
                  </label>
                  <select
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-[#23282d]"
                  >
                    <option value="_self">当前窗口</option>
                    <option value="_blank">新窗口</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#23282d] mb-1">
                    排序序号
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-[#23282d]"
                  />
                  <p className="text-xs text-[#646970] mt-1">数字越小越靠前</p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_home}
                      onChange={(e) => setFormData({ ...formData, is_home: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-[#23282d]">设为首页链接</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-[#23282d]">启用此菜单项</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#0073aa] text-white rounded text-sm hover:bg-[#005a87]"
                  >
                    {editingMenu ? '更新' : '添加'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 text-[#23282d] rounded text-sm hover:bg-gray-300"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminMenusPage
