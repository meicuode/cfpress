import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useLayout, AVAILABLE_MODULES, PAGE_TYPES, getAvailableModulesForPage } from '../../contexts/LayoutContext'
import { useToast } from '../../contexts/ToastContext'

function AdminLayoutPage() {
  const { reloadLayouts } = useLayout()
  const toast = useToast()

  // 布局模板列表
  const [layouts, setLayouts] = useState([])
  // 页面布局绑定
  const [pageLayoutMap, setPageLayoutMap] = useState({})
  // 当前选中的页面类型
  const [selectedPageType, setSelectedPageType] = useState('home')
  // 当前编辑的布局
  const [editingLayout, setEditingLayout] = useState(null)
  // 临时布局配置
  const [tempLayout, setTempLayout] = useState(null)
  // 初始配置快照
  const [initialConfig, setInitialConfig] = useState(null)
  // 是否有未保存的更改
  const [hasChanges, setHasChanges] = useState(false)
  // 拖拽状态
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverZone, setDragOverZone] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  // 加载状态
  const [loading, setLoading] = useState(true)
  // 新建布局弹窗
  const [showNewLayoutModal, setShowNewLayoutModal] = useState(false)
  const [newLayoutName, setNewLayoutName] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)

  // 加载布局数据
  useEffect(() => {
    loadLayouts()
  }, [])

  const loadLayouts = async () => {
    try {
      const response = await fetch('/api/admin/layouts')
      if (response.ok) {
        const data = await response.json()
        setLayouts(data.layouts || [])
        setPageLayoutMap(data.pageLayoutMap || {})
      }
    } catch (error) {
      console.error('Failed to load layouts:', error)
      toast.error('加载布局失败')
    } finally {
      setLoading(false)
    }
  }

  // 切换页面类型时加载对应布局
  useEffect(() => {
    if (layouts.length === 0) return

    const boundLayoutId = pageLayoutMap[selectedPageType]
    if (boundLayoutId) {
      const layout = layouts.find(l => l.id === boundLayoutId)
      if (layout) {
        setEditingLayout(layout)
        const config = JSON.parse(layout.layout_config)
        setTempLayout({ ...config })
        setInitialConfig({ ...config })
        setHasChanges(false)
        return
      }
    }
    // 没有绑定的布局，使用默认
    setEditingLayout(null)
    const defaultConfig = getDefaultLayoutForPage(selectedPageType)
    setTempLayout(defaultConfig)
    setInitialConfig(defaultConfig)
    setHasChanges(false)
  }, [selectedPageType, pageLayoutMap, layouts])

  // 检测变化
  useEffect(() => {
    if (!initialConfig || !tempLayout) return
    const isDifferent = JSON.stringify(tempLayout) !== JSON.stringify(initialConfig)
    setHasChanges(isDifferent)
  }, [tempLayout, initialConfig])

  // 获取页面默认布局
  const getDefaultLayoutForPage = (pageType) => {
    const defaults = {
      home: { leftSidebar: ['profile', 'categories'], main: ['posts'], rightSidebar: [] },
      thread: { leftSidebar: ['profile', 'categories'], main: ['content', 'comments'], rightSidebar: ['toc', 'recentPosts'] },
      category: { leftSidebar: ['profile', 'categories'], main: ['posts'], rightSidebar: [] },
      tag: { leftSidebar: ['profile', 'categories'], main: ['posts'], rightSidebar: [] }
    }
    return { ...defaults[pageType] } || { ...defaults.home }
  }

  // 获取当前页面可用的模块
  const availableModules = getAvailableModulesForPage(selectedPageType)

  // 获取未使用的模块
  const getUnusedModules = () => {
    if (!tempLayout) return []
    const usedModules = [
      ...tempLayout.leftSidebar,
      ...tempLayout.main,
      ...tempLayout.rightSidebar
    ]
    return availableModules.filter(module => !usedModules.includes(module.id))
  }

  // 拖拽处理
  const handleDragStart = (moduleId, fromZone) => {
    setDraggedItem({ moduleId, fromZone })
  }

  const handleDragOver = (e, zone, index) => {
    e.preventDefault()
    setDragOverZone(zone)
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverZone(null)
    setDragOverIndex(null)
  }

  const handleDrop = (e, toZone, toIndex) => {
    e.preventDefault()
    if (!draggedItem || !tempLayout) return

    const { moduleId, fromZone } = draggedItem

    const newLayout = {
      leftSidebar: [...tempLayout.leftSidebar],
      main: [...tempLayout.main],
      rightSidebar: [...tempLayout.rightSidebar]
    }

    // 从原位置移除
    if (fromZone && fromZone !== 'unused') {
      newLayout[fromZone] = newLayout[fromZone].filter(id => id !== moduleId)
    }

    // 添加到新位置
    if (toIndex !== undefined && toIndex !== null) {
      newLayout[toZone].splice(toIndex, 0, moduleId)
    } else {
      newLayout[toZone].push(moduleId)
    }

    setTempLayout(newLayout)
    setDraggedItem(null)
    setDragOverZone(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverZone(null)
    setDragOverIndex(null)
  }

  const handleRemoveModule = (moduleId, zone) => {
    const module = AVAILABLE_MODULES[moduleId]
    if (module?.required) {
      toast.error(`${module.name}模块不能删除`)
      return
    }
    const newLayout = {
      leftSidebar: [...tempLayout.leftSidebar],
      main: [...tempLayout.main],
      rightSidebar: [...tempLayout.rightSidebar]
    }
    newLayout[zone] = newLayout[zone].filter(id => id !== moduleId)
    setTempLayout(newLayout)
  }

  // 保存当前布局
  const handleSave = async () => {
    if (!editingLayout) {
      // 需要先创建新布局
      setShowNewLayoutModal(true)
      return
    }

    try {
      const response = await fetch(`/api/admin/layouts/${editingLayout.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingLayout.name,
          layoutConfig: tempLayout
        })
      })

      if (response.ok) {
        toast.success('布局已保存')
        setInitialConfig({ ...tempLayout })
        setHasChanges(false)
        await loadLayouts()
        await reloadLayouts()
      } else {
        const data = await response.json()
        toast.error(data.error || '保存失败')
      }
    } catch (error) {
      toast.error('保存失败')
    }
  }

  // 创建新布局
  const handleCreateLayout = async () => {
    if (!newLayoutName.trim()) {
      toast.error('请输入布局名称')
      return
    }

    // 根据选择的模板获取布局配置
    let layoutConfig
    if (selectedTemplateId) {
      const template = layouts.find(l => l.id === selectedTemplateId)
      if (template) {
        layoutConfig = JSON.parse(template.layout_config)
      }
    }
    if (!layoutConfig) {
      layoutConfig = getDefaultLayoutForPage(selectedPageType)
    }

    try {
      const response = await fetch('/api/admin/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLayoutName,
          pageType: selectedPageType,
          layoutConfig: layoutConfig
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('布局已创建')
        setShowNewLayoutModal(false)
        setNewLayoutName('')
        setSelectedTemplateId(null)

        // 绑定到当前页面
        await bindLayoutToPage(data.id)
        await loadLayouts()
        await reloadLayouts()
      } else {
        const data = await response.json()
        toast.error(data.error || '创建失败')
      }
    } catch (error) {
      toast.error('创建失败')
    }
  }

  // 绑定布局到页面
  const bindLayoutToPage = async (layoutId) => {
    try {
      const response = await fetch(`/api/admin/page-layouts/${selectedPageType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layoutId })
      })

      if (response.ok) {
        toast.success('布局已应用到页面')
        await loadLayouts()
        await reloadLayouts()
      } else {
        const data = await response.json()
        toast.error(data.error || '应用失败')
      }
    } catch (error) {
      toast.error('应用失败')
    }
  }

  // 取消编辑
  const handleCancel = () => {
    if (initialConfig) {
      setTempLayout({ ...initialConfig })
    }
    setHasChanges(false)
    toast.info('已取消更改')
  }

  // 重置为默认
  const handleReset = () => {
    if (window.confirm('确定要重置为默认布局吗？')) {
      const defaultConfig = getDefaultLayoutForPage(selectedPageType)
      setTempLayout(defaultConfig)
      toast.info('已重置为默认布局，请保存以生效')
    }
  }

  // 删除布局
  const handleDeleteLayout = async (layoutId) => {
    if (!window.confirm('确定要删除此布局吗？')) return

    try {
      const response = await fetch(`/api/admin/layouts/${layoutId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('布局已删除')
        await loadLayouts()
        await reloadLayouts()
      } else {
        const data = await response.json()
        toast.error(data.error || '删除失败')
      }
    } catch (error) {
      toast.error('删除失败')
    }
  }

  // 渲染模块卡片
  const renderModuleCard = (moduleId, zone, index) => {
    const module = AVAILABLE_MODULES[moduleId]
    if (!module) return null

    const isDragging = draggedItem?.moduleId === moduleId

    return (
      <div
        key={moduleId}
        draggable
        onDragStart={() => handleDragStart(moduleId, zone)}
        onDragOver={(e) => handleDragOver(e, zone, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, zone, index)}
        onDragEnd={handleDragEnd}
        className={`
          relative p-3 rounded-lg border-2 cursor-move transition-all
          ${module.color} text-white
          ${isDragging ? 'opacity-50 border-dashed' : 'border-transparent'}
          hover:shadow-lg
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{module.icon}</span>
            <span className="font-medium text-sm">{module.name}</span>
          </div>
          {!module.required && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveModule(moduleId, zone)
              }}
              className="w-5 h-5 flex items-center justify-center bg-black bg-opacity-20 rounded hover:bg-opacity-40 text-xs"
              title="移除模块"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    )
  }

  // 渲染放置区域
  const renderDropZone = (zone, title, modules) => {
    const isDropTarget = dragOverZone === zone && dragOverIndex === null
    const isEmpty = modules.length === 0

    return (
      <div
        className={`
          flex-1 min-h-[200px] rounded-lg border-2 border-dashed p-4 transition-all
          ${zone === 'main' ? 'border-red-300 bg-red-50' : 'border-blue-300 bg-blue-50'}
          ${isDropTarget ? 'ring-4 ring-blue-500 bg-blue-100' : ''}
        `}
        onDragOver={(e) => handleDragOver(e, zone, null)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, zone, modules.length)}
      >
        <div className="text-center mb-3">
          <span className={`text-sm font-bold ${zone === 'main' ? 'text-red-600' : 'text-blue-600'}`}>
            {title}
          </span>
        </div>
        <div className="space-y-2">
          {modules.map((moduleId, index) => renderModuleCard(moduleId, zone, index))}
          {isEmpty && (
            <div className="text-center py-8 text-gray-400 text-sm">
              拖拽模块到这里
            </div>
          )}
        </div>
      </div>
    )
  }

  const unusedModules = getUnusedModules()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-[#666]">加载中...</div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>页面布局 - 管理后台</title>
      </Helmet>

      <div className="p-6 max-w-6xl mx-auto">
        {/* 顶部标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#23282d]">页面布局</h1>
          <p className="text-sm text-[#666] mt-1">管理不同页面的布局配置</p>
        </div>

        {/* 页面类型选择 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-sm font-semibold text-[#23282d] mb-3">选择页面类型</h3>
          <div className="flex gap-2 flex-wrap">
            {Object.values(PAGE_TYPES).map(pageType => (
              <button
                key={pageType.id}
                onClick={() => setSelectedPageType(pageType.id)}
                className={`
                  px-4 py-2 rounded text-sm font-medium transition-colors
                  ${selectedPageType === pageType.id
                    ? 'bg-[#2271b1] text-white'
                    : 'bg-[#f0f0f1] text-[#23282d] hover:bg-[#e0e0e0]'
                  }
                `}
              >
                {pageType.name}
                {pageLayoutMap[pageType.id] && (
                  <span className="ml-2 text-xs opacity-75">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 当前页面使用的布局 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-sm font-semibold text-[#23282d] mb-3">选择布局模板</h3>
          <div className="flex gap-2 flex-wrap items-center">
            {layouts
              .filter(layout => layout.page_type === selectedPageType)
              .map(layout => {
                const isBound = pageLayoutMap[selectedPageType] === layout.id
                return (
                  <button
                    key={layout.id}
                    onClick={() => bindLayoutToPage(layout.id)}
                    className={`
                      px-4 py-2 rounded text-sm font-medium transition-colors border
                      ${isBound
                        ? 'bg-[#2271b1] text-white border-[#2271b1]'
                        : 'bg-white text-[#23282d] border-[#ddd] hover:border-[#2271b1]'
                      }
                    `}
                  >
                    {layout.name}
                    {layout.is_default === 1 && <span className="ml-1 text-xs opacity-75">(默认)</span>}
                    {isBound && ' ✓'}
                  </button>
                )
              })}
            <button
              onClick={() => {
                setNewLayoutName('')
                setSelectedTemplateId(null)
                setShowNewLayoutModal(true)
              }}
              className="px-4 py-2 rounded text-sm font-medium bg-green-500 hover:bg-green-600 text-white transition-colors"
            >
              + 新建布局
            </button>
          </div>
        </div>

        {/* 布局编辑器 */}
        {tempLayout && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            {/* 标题栏和操作按钮 */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#23282d]">
                编辑布局: {editingLayout?.name || '新布局'}
                <span className="text-sm font-normal text-[#666] ml-2">
                  ({PAGE_TYPES[selectedPageType]?.name})
                </span>
              </h3>
              <div className="flex items-center gap-3">
                {hasChanges && (
                  <span className="text-sm text-[#856404] bg-[#fff3cd] px-2 py-1 rounded">
                    有未保存的更改
                  </span>
                )}
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-[#f0f0f1] hover:bg-[#e0e0e0] text-[#23282d] rounded text-sm font-medium transition-colors"
                >
                  重置
                </button>
                {hasChanges && (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 bg-[#f0f0f1] hover:bg-[#e0e0e0] text-[#23282d] rounded text-sm font-medium transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-3 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded text-sm font-medium transition-colors"
                    >
                      保存布局
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 可添加的模块 */}
            {unusedModules.length > 0 && (
              <div className="mb-6 p-4 bg-[#f8f9fa] rounded-lg">
                <h4 className="text-sm font-semibold text-[#666] mb-3">可添加的模块（拖拽到下方区域）</h4>
                <div className="flex gap-2 flex-wrap">
                  {unusedModules.map(module => (
                    <div
                      key={module.id}
                      draggable
                      onDragStart={() => handleDragStart(module.id, 'unused')}
                      onDragEnd={handleDragEnd}
                      className={`
                        px-3 py-2 rounded-lg cursor-move ${module.color} text-white
                        flex items-center gap-2 hover:shadow-lg transition-all
                        ${draggedItem?.moduleId === module.id ? 'opacity-50' : ''}
                      `}
                    >
                      <span>{module.icon}</span>
                      <span className="text-sm font-medium">{module.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 三栏布局编辑器 */}
            <div className="flex gap-4">
              <div className="w-64 flex-shrink-0">
                {renderDropZone('leftSidebar', '左侧边栏', tempLayout.leftSidebar)}
              </div>
              <div className="flex-1">
                {renderDropZone('main', '主内容区', tempLayout.main)}
              </div>
              <div className="w-64 flex-shrink-0">
                {renderDropZone('rightSidebar', '右侧边栏', tempLayout.rightSidebar)}
              </div>
            </div>
          </div>
        )}

        {/* 当前页面类型的所有布局列表 */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-[#23282d] mb-3">
            {PAGE_TYPES[selectedPageType]?.name}布局列表
          </h3>
          <div className="space-y-2">
            {layouts
              .filter(layout => layout.page_type === selectedPageType)
              .map(layout => {
                // 检查此布局是否被当前页面使用
                const isBound = pageLayoutMap[selectedPageType] === layout.id
                const isDefault = layout.is_default === 1

                return (
                  <div
                    key={layout.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${isBound ? 'bg-blue-50 border border-blue-200' : 'bg-[#f8f9fa]'}`}
                  >
                    <div>
                      <span className="font-medium text-[#23282d]">{layout.name}</span>
                      {isDefault && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                          默认
                        </span>
                      )}
                      {isBound && (
                        <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">
                          当前使用
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!isDefault && (
                        <>
                          <button
                            onClick={() => {
                              setEditingLayout(layout)
                              const config = JSON.parse(layout.layout_config)
                              setTempLayout({ ...config })
                              setInitialConfig({ ...config })
                              setHasChanges(false)
                            }}
                            className="px-3 py-1 text-sm bg-[#2271b1] text-white rounded hover:bg-[#135e96] transition-colors"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteLayout(layout.id)}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            删除
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            {layouts.filter(layout => layout.page_type === selectedPageType).length === 0 && (
              <div className="text-center py-4 text-[#666]">
                暂无{PAGE_TYPES[selectedPageType]?.name}布局模板，请点击"新建布局"创建
              </div>
            )}
          </div>
        </div>

        {/* 说明 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <h4 className="font-bold mb-2">操作说明：</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>选择页面类型后，可以选择或创建布局模板</li>
            <li>拖拽模块到不同区域可改变布局</li>
            <li>不同页面类型有不同的可用模块</li>
            <li>一个布局模板可以应用到多个页面</li>
            <li>修改后点击"保存布局"按钮生效</li>
          </ul>
        </div>
      </div>

      {/* 新建布局弹窗 */}
      {showNewLayoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-[#23282d] mb-4">新建布局</h3>

            {/* 布局名称输入 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#23282d] mb-1">布局名称</label>
              <input
                type="text"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                placeholder="输入布局名称"
                className="w-full px-3 py-2 border border-[#ddd] rounded focus:outline-none focus:border-[#2271b1]"
                autoFocus
              />
            </div>

            {/* 模板选择下拉框 - 只显示当前页面类型的模板 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#23282d] mb-1">基于模板</label>
              <select
                value={selectedTemplateId || ''}
                onChange={(e) => setSelectedTemplateId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-[#ddd] rounded focus:outline-none focus:border-[#2271b1] bg-white"
              >
                <option value="">使用默认配置</option>
                {layouts
                  .filter(layout => layout.page_type === selectedPageType)
                  .map(layout => (
                    <option key={layout.id} value={layout.id}>
                      {layout.name}
                      {layout.is_default === 1 ? ' (默认)' : ''}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-[#666] mt-1">选择一个现有的{PAGE_TYPES[selectedPageType]?.name || ''}布局作为基础</p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewLayoutModal(false)
                  setNewLayoutName('')
                  setSelectedTemplateId(null)
                }}
                className="px-4 py-2 bg-[#f0f0f1] hover:bg-[#e0e0e0] text-[#23282d] rounded text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateLayout}
                className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white rounded text-sm font-medium transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AdminLayoutPage
