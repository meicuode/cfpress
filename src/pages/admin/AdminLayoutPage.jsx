import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useLayout, AVAILABLE_MODULES } from '../../contexts/LayoutContext'
import { useToast } from '../../contexts/ToastContext'

function AdminLayoutPage() {
  const { getLayoutConfig, updateLayout, resetLayout } = useLayout()
  const toast = useToast()

  const currentConfig = getLayoutConfig('home')

  // 保存初始配置的快照（用于比较是否有变化）
  const [initialConfig, setInitialConfig] = useState(null)

  // 临时布局状态
  const [tempLayout, setTempLayout] = useState({
    leftSidebar: currentConfig?.leftSidebar || ['profile', 'categories'],
    main: currentConfig?.main || ['posts'],
    rightSidebar: currentConfig?.rightSidebar || []
  })

  const [hasChanges, setHasChanges] = useState(false)
  const [draggedItem, setDraggedItem] = useState(null) // { moduleId, fromZone }
  const [dragOverZone, setDragOverZone] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  // 初始化时保存配置快照
  useEffect(() => {
    if (!initialConfig && currentConfig) {
      const snapshot = {
        leftSidebar: [...(currentConfig.leftSidebar || ['profile', 'categories'])],
        main: [...(currentConfig.main || ['posts'])],
        rightSidebar: [...(currentConfig.rightSidebar || [])]
      }
      setInitialConfig(snapshot)
      setTempLayout(snapshot)
    }
  }, [currentConfig, initialConfig])

  // 获取未使用的模块
  const getUnusedModules = () => {
    const usedModules = [
      ...tempLayout.leftSidebar,
      ...tempLayout.main,
      ...tempLayout.rightSidebar
    ]
    return Object.keys(AVAILABLE_MODULES).filter(id => !usedModules.includes(id))
  }

  // 检测变化 - 与初始快照比较
  useEffect(() => {
    if (!initialConfig) return
    const isDifferent = JSON.stringify(tempLayout) !== JSON.stringify(initialConfig)
    setHasChanges(isDifferent)
  }, [tempLayout, initialConfig])

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
    if (!draggedItem) return

    const { moduleId, fromZone } = draggedItem

    // 深拷贝布局对象
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
      toast.error('文章列表模块不能删除')
      return
    }
    // 深拷贝布局对象
    const newLayout = {
      leftSidebar: [...tempLayout.leftSidebar],
      main: [...tempLayout.main],
      rightSidebar: [...tempLayout.rightSidebar]
    }
    newLayout[zone] = newLayout[zone].filter(id => id !== moduleId)
    setTempLayout(newLayout)
  }

  const handleSave = async () => {
    const result = await updateLayout('home', tempLayout)
    if (result.success !== false) {
      // 保存成功后更新初始快照
      setInitialConfig({
        leftSidebar: [...tempLayout.leftSidebar],
        main: [...tempLayout.main],
        rightSidebar: [...tempLayout.rightSidebar]
      })
      setHasChanges(false)
      toast.success('布局已保存')
    } else {
      toast.error(result.error || '保存失败')
    }
  }

  const handleCancel = () => {
    if (initialConfig) {
      setTempLayout({
        leftSidebar: [...initialConfig.leftSidebar],
        main: [...initialConfig.main],
        rightSidebar: [...initialConfig.rightSidebar]
      })
    }
    setHasChanges(false)
    toast.info('已取消更改')
  }

  const handleReset = async () => {
    if (window.confirm('确定要重置为默认布局吗？')) {
      const defaultLayout = {
        leftSidebar: ['profile', 'categories'],
        main: ['posts'],
        rightSidebar: []
      }
      setTempLayout(defaultLayout)
      await resetLayout('home')
      // 更新初始快照为默认布局
      setInitialConfig({
        leftSidebar: ['profile', 'categories'],
        main: ['posts'],
        rightSidebar: []
      })
      setHasChanges(false)
      toast.success('布局已重置')
    }
  }

  // 渲染模块卡片
  const renderModuleCard = (moduleId, zone, index) => {
    const module = AVAILABLE_MODULES[moduleId]
    if (!module) return null

    const isDragging = draggedItem?.moduleId === moduleId
    const isDropTarget = dragOverZone === zone && dragOverIndex === index

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
          ${isDropTarget ? 'ring-4 ring-blue-500' : ''}
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

  return (
    <>
      <Helmet>
        <title>页面布局 - 管理后台</title>
      </Helmet>

      <div className="p-6">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#23282d]">页面布局</h1>
            <p className="text-sm text-[#666] mt-1">拖拽模块调整首页布局</p>
          </div>
          <div className="flex gap-3">
            {hasChanges && (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-[#f0f0f1] hover:bg-[#e0e0e0] text-[#23282d] rounded text-sm font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white rounded text-sm font-medium transition-colors"
                >
                  保存布局
                </button>
              </>
            )}
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-[#d63638] hover:bg-[#b32d2e] text-white rounded text-sm font-medium transition-colors"
            >
              重置
            </button>
          </div>
        </div>

        {hasChanges && (
          <div className="mb-4 p-3 bg-[#fff3cd] border border-[#ffc107] rounded text-sm text-[#856404]">
            有未保存的更改
          </div>
        )}

        {/* 可用模块池 */}
        {unusedModules.length > 0 && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-[#ddd]">
            <h3 className="text-sm font-bold text-[#23282d] mb-3">可添加的模块（拖拽到下方区域）</h3>
            <div className="flex flex-wrap gap-2">
              {unusedModules.map(moduleId => {
                const module = AVAILABLE_MODULES[moduleId]
                return (
                  <div
                    key={moduleId}
                    draggable
                    onDragStart={() => handleDragStart(moduleId, 'unused')}
                    onDragEnd={handleDragEnd}
                    className={`
                      px-3 py-2 rounded-lg cursor-move ${module.color} text-white
                      flex items-center gap-2 hover:shadow-lg transition-all
                      ${draggedItem?.moduleId === moduleId ? 'opacity-50' : ''}
                    `}
                  >
                    <span>{module.icon}</span>
                    <span className="text-sm font-medium">{module.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 布局预览 */}
        <div className="bg-white rounded-lg border border-[#ddd] p-4">
          <h3 className="text-sm font-bold text-[#23282d] mb-4">布局预览</h3>
          <div className="flex gap-4">
            {/* 左侧边栏 */}
            <div className="w-64 flex-shrink-0">
              {renderDropZone('leftSidebar', '左侧边栏', tempLayout.leftSidebar)}
            </div>

            {/* 主内容区 */}
            <div className="flex-1">
              {renderDropZone('main', '主内容区', tempLayout.main)}
            </div>

            {/* 右侧边栏 */}
            <div className="w-64 flex-shrink-0">
              {renderDropZone('rightSidebar', '右侧边栏', tempLayout.rightSidebar)}
            </div>
          </div>
        </div>

        {/* 说明 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <h4 className="font-bold mb-2">操作说明：</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>拖拽模块到不同区域可改变布局</li>
            <li>在同一区域内拖拽可调整上下顺序</li>
            <li>点击模块右上角的 ✕ 可移除模块（文章列表除外）</li>
            <li>移除的模块会出现在"可添加的模块"中</li>
            <li>修改后点击"保存布局"按钮生效</li>
          </ul>
        </div>
      </div>
    </>
  )
}

export default AdminLayoutPage
