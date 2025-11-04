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

  // 拖拽相关状态
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverItem, setDragOverItem] = useState(null)
  const [originalMenus, setOriginalMenus] = useState([]) // 用于取消拖拽时恢复
  const [hasOrderChanged, setHasOrderChanged] = useState(false) // 是否发生了排序变化
  const [savingOrder, setSavingOrder] = useState(false) // 是否正在保存排序

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

  // 拖拽开始
  const handleDragStart = (e, menu) => {
    setDraggedItem(menu)
    // 如果是第一次拖拽，保存原始顺序（使用深拷贝）
    if (!hasOrderChanged) {
      const deepCopy = JSON.parse(JSON.stringify(menus))
      setOriginalMenus(deepCopy)
    }
    e.dataTransfer.effectAllowed = 'move'
  }

  // 拖拽经过
  const handleDragOver = (e, menu) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    if (draggedItem && menu.id !== draggedItem.id) {
      setDragOverItem(menu)
    }
  }

  // 拖拽离开
  const handleDragLeave = (e) => {
    // 只在真正离开元素时清除
    if (e.currentTarget.contains(e.relatedTarget)) return
    setDragOverItem(null)
  }

  // 放置
  const handleDrop = (e, targetMenu) => {
    e.preventDefault()
    setDragOverItem(null)

    if (!draggedItem || draggedItem.id === targetMenu.id) {
      setDraggedItem(null)
      return
    }

    // 只允许在同一位置（header/footer/sidebar）和同一层级（parent_id相同）的菜单间拖拽
    if (draggedItem.position !== targetMenu.position || draggedItem.parent_id !== targetMenu.parent_id) {
      toast.warning('只能在同一位置和同一层级的菜单间调整顺序')
      setDraggedItem(null)
      return
    }

    // 临时更新UI顺序
    const updatedMenus = [...menus]
    const draggedIndex = updatedMenus.findIndex(m => m.id === draggedItem.id)
    const targetIndex = updatedMenus.findIndex(m => m.id === targetMenu.id)

    // 移除拖拽项
    const [removed] = updatedMenus.splice(draggedIndex, 1)
    // 插入到目标位置
    updatedMenus.splice(targetIndex, 0, removed)

    // 更新sort_order
    const samePositionMenus = updatedMenus.filter(m =>
      m.position === draggedItem.position && m.parent_id === draggedItem.parent_id
    )
    samePositionMenus.forEach((menu, index) => {
      menu.sort_order = index + 1
    })

    setMenus(updatedMenus)
    setHasOrderChanged(true) // 标记发生了变化
    setDraggedItem(null)
  }

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }

  // 保存排序
  const handleSaveOrder = async () => {
    setSavingOrder(true)
    try {
      // 获取所有需要更新的菜单项
      const allItems = menus.map(menu => ({
        id: menu.id,
        sort_order: menu.sort_order,
        parent_id: menu.parent_id
      }))

      const response = await fetch('/api/admin/navigation/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: allItems })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('菜单顺序已保存')
        setHasOrderChanged(false)
        setOriginalMenus([])
        loadMenus() // 重新加载
      } else {
        toast.error(data.error || '保存失败')
      }
    } catch (error) {
      console.error('Error saving order:', error)
      toast.error('保存失败')
    } finally {
      setSavingOrder(false)
    }
  }

  // 取消排序更改
  const handleCancelOrder = () => {
    if (originalMenus.length > 0) {
      setMenus(originalMenus)
      setHasOrderChanged(false)
      setOriginalMenus([])
      toast.info('已取消排序更改')
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
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, menu)}
          onDragOver={(e) => handleDragOver(e, menu)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, menu)}
          onDragEnd={handleDragEnd}
          className={`flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-move transition-all ${
            draggedItem?.id === menu.id ? 'opacity-50 scale-95' : ''
          } ${
            dragOverItem?.id === menu.id ? 'border-blue-500 border-2 bg-blue-50' : ''
          }`}
        >
          <div className="flex items-center gap-3 flex-1">
            <span className="text-gray-400 cursor-grab active:cursor-grabbing">⋮⋮</span>
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
                draggable
                onDragStart={(e) => handleDragStart(e, child)}
                onDragOver={(e) => handleDragOver(e, child)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, child)}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-move transition-all ${
                  draggedItem?.id === child.id ? 'opacity-50 scale-95' : ''
                } ${
                  dragOverItem?.id === child.id ? 'border-blue-500 border-2 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-gray-400 cursor-grab active:cursor-grabbing text-sm">⋮⋮</span>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-[#23282d]">
                {selectedPosition === 'header' && '顶部菜单'}
                {selectedPosition === 'footer' && '底部菜单'}
                {selectedPosition === 'sidebar' && '侧边栏菜单'}
              </h2>

              {/* 保存/取消排序按钮 */}
              {hasOrderChanged && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelOrder}
                    disabled={savingOrder}
                    className="px-4 py-2 bg-gray-200 text-[#23282d] rounded text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveOrder}
                    disabled={savingOrder}
                    className="px-4 py-2 bg-[#0073aa] text-white rounded text-sm hover:bg-[#005a87] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingOrder ? '保存中...' : '保存排序'}
                  </button>
                </div>
              )}
            </div>

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
