import { useEffect } from 'react'

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  type = 'default', // 'default', 'danger', 'warning'
  onConfirm,
  onCancel
}) {
  // 按 ESC 键关闭
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onCancel])

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const getIconAndColor = () => {
    switch (type) {
      case 'danger':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          bgColor: 'bg-red-100',
          textColor: 'text-red-600',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        }
      case 'warning':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-600',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        }
      default:
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600',
          buttonColor: 'bg-[#0073aa] hover:bg-[#005a87]'
        }
    }
  }

  const { icon, bgColor, textColor, buttonColor } = getIconAndColor()

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* 对话框 */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 animate-scale-in">
        {/* 内容 */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* 图标 */}
            <div className={`flex-shrink-0 ${bgColor} ${textColor} rounded-full p-3`}>
              {icon}
            </div>

            {/* 文字 */}
            <div className="flex-1 pt-1">
              {title && (
                <h3 className="text-lg font-semibold text-[#23282d] mb-2">
                  {title}
                </h3>
              )}
              <p className="text-sm text-[#646970] leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-[#23282d] hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 ${buttonColor} text-white rounded-lg text-sm font-medium transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
