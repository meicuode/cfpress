import { Responsive, WidthProvider } from 'react-grid-layout'
import { useLayout } from '../contexts/LayoutContext'
import 'react-grid-layout/css/styles.css'
import 'react-grid-layout/css/resizable.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

/**
 * 拖拽布局容器组件
 * @param {string} layoutKey - 布局配置的键（如 'home', 'thread'）
 * @param {React.ReactNode} children - 子组件，每个子组件需要有 key 属性
 */
function DraggableLayout({ layoutKey = 'home', children }) {
  const { getLayout, saveLayout, isEditMode } = useLayout()

  // 响应式断点配置
  const breakpoints = { lg: 1200, md: 996, sm: 768 }
  const cols = { lg: 12, md: 8, sm: 6 }

  // 获取所有断点的布局
  const layouts = {
    lg: getLayout(layoutKey, 'lg'),
    md: getLayout(layoutKey, 'md'),
    sm: getLayout(layoutKey, 'sm'),
  }

  // 布局变化时保存
  const handleLayoutChange = (currentLayout, allLayouts) => {
    if (isEditMode) {
      Object.keys(allLayouts).forEach(breakpoint => {
        saveLayout(layoutKey, allLayouts[breakpoint], breakpoint)
      })
    }
  }

  return (
    <div className={`relative ${isEditMode ? 'edit-mode' : ''}`}>
      {/* 编辑模式提示 */}
      {isEditMode && (
        <div className="fixed top-20 right-4 z-[9999] bg-accent-blue text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">📐 编辑模式已开启</p>
          <p className="text-xs opacity-90">拖拽和调整组件大小</p>
        </div>
      )}

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={50}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        containerPadding={[0, 0]}
        margin={[16, 16]}
      >
        {children}
      </ResponsiveGridLayout>

      {/* 编辑模式样式 */}
      <style>{`
        .edit-mode .react-grid-item {
          border: 2px dashed rgba(74, 158, 255, 0.3);
          background: rgba(74, 158, 255, 0.05);
          transition: all 0.2s;
        }

        .edit-mode .react-grid-item:hover {
          border-color: rgba(74, 158, 255, 0.6);
          background: rgba(74, 158, 255, 0.1);
          cursor: move;
        }

        .react-grid-item.react-grid-placeholder {
          background: rgba(74, 158, 255, 0.2);
          border: 2px dashed #4a9eff;
        }

        .react-resizable-handle {
          background: none;
        }

        .react-resizable-handle::after {
          content: '';
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 8px;
          height: 8px;
          border-right: 2px solid rgba(74, 158, 255, 0.6);
          border-bottom: 2px solid rgba(74, 158, 255, 0.6);
        }

        .edit-mode .react-grid-item.react-draggable-dragging {
          opacity: 0.8;
          z-index: 1000;
        }

        /* 拖拽手柄样式 */
        .drag-handle {
          cursor: move;
          padding: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .edit-mode .drag-handle {
          opacity: 1;
        }

        .drag-handle:hover {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  )
}

export default DraggableLayout
