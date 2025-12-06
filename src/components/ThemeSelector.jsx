import { useState } from 'react'
import { useTheme, presetThemes } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'

function ThemeSelector() {
  const { currentTheme, customColors, switchTheme, setCustomTheme, getCurrentColors } = useTheme()
  const toast = useToast()
  const [showCustomEditor, setShowCustomEditor] = useState(false)
  const [editingColors, setEditingColors] = useState(getCurrentColors())

  // 切换预设主题
  const handleThemeSwitch = async (themeName) => {
    await switchTheme(themeName)
    toast.success(`已切换到${presetThemes[themeName].name}`)
  }

  // 应用自定义颜色
  const handleApplyCustom = async () => {
    await setCustomTheme(editingColors)
    toast.success('自定义主题已应用')
    setShowCustomEditor(false)
  }

  // 重置为当前颜色
  const handleReset = () => {
    setEditingColors(getCurrentColors())
  }

  return (
    <div className="space-y-6">
      {/* 预设主题选择 */}
      <div>
        <h3 className="text-lg font-medium text-text-primary mb-4">预设主题</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(presetThemes).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => handleThemeSwitch(key)}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${currentTheme === key && !customColors
                  ? 'border-accent-blue bg-accent-blue/10'
                  : 'border-border hover:border-accent-blue/50 bg-bg-card'
                }
              `}
            >
              <div className="flex items-center gap-3">
                {/* 颜色预览 */}
                <div className="flex gap-1">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: theme.colors.accentBlue }}
                  />
                </div>
                <span className="text-sm font-medium text-text-primary">
                  {theme.name}
                </span>
              </div>
              {currentTheme === key && !customColors && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-accent-blue rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 自定义颜色 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-text-primary">自定义颜色</h3>
          <button
            onClick={() => setShowCustomEditor(!showCustomEditor)}
            className="px-4 py-2 bg-accent-blue hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
          >
            {showCustomEditor ? '关闭编辑器' : '自定义颜色'}
          </button>
        </div>

        {showCustomEditor && (
          <div className="bg-bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 主背景色 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  主背景色
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={editingColors.primary}
                    onChange={(e) => setEditingColors({
                      ...editingColors,
                      primary: e.target.value
                    })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingColors.primary}
                    onChange={(e) => setEditingColors({
                      ...editingColors,
                      primary: e.target.value
                    })}
                    className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded text-text-primary"
                  />
                </div>
              </div>

              {/* 卡片背景色 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  卡片背景色
                </label>
                <input
                  type="text"
                  value={editingColors.card}
                  onChange={(e) => setEditingColors({
                    ...editingColors,
                    card: e.target.value
                  })}
                  placeholder="rgba(40, 44, 60, 0.6)"
                  className="w-full px-3 py-2 bg-bg-secondary border border-border rounded text-text-primary"
                />
              </div>

              {/* 主文本色 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  主文本色
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={editingColors.textPrimary}
                    onChange={(e) => setEditingColors({
                      ...editingColors,
                      textPrimary: e.target.value
                    })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingColors.textPrimary}
                    onChange={(e) => setEditingColors({
                      ...editingColors,
                      textPrimary: e.target.value
                    })}
                    className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded text-text-primary"
                  />
                </div>
              </div>

              {/* 次要文本色 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  次要文本色
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={editingColors.textSecondary}
                    onChange={(e) => setEditingColors({
                      ...editingColors,
                      textSecondary: e.target.value
                    })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingColors.textSecondary}
                    onChange={(e) => setEditingColors({
                      ...editingColors,
                      textSecondary: e.target.value
                    })}
                    className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded text-text-primary"
                  />
                </div>
              </div>

              {/* 强调色 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  强调色（链接/按钮）
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={editingColors.accentBlue}
                    onChange={(e) => setEditingColors({
                      ...editingColors,
                      accentBlue: e.target.value
                    })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingColors.accentBlue}
                    onChange={(e) => setEditingColors({
                      ...editingColors,
                      accentBlue: e.target.value
                    })}
                    className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded text-text-primary"
                  />
                </div>
              </div>

              {/* 边框色 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  边框色
                </label>
                <input
                  type="text"
                  value={editingColors.border}
                  onChange={(e) => setEditingColors({
                    ...editingColors,
                    border: e.target.value
                  })}
                  placeholder="rgba(255, 255, 255, 0.1)"
                  className="w-full px-3 py-2 bg-bg-secondary border border-border rounded text-text-primary"
                />
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                onClick={handleApplyCustom}
                className="flex-1 px-4 py-2 bg-accent-blue hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                应用自定义主题
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-bg-secondary hover:bg-opacity-80 text-text-primary rounded-lg border border-border transition-colors"
              >
                重置
              </button>
            </div>
          </div>
        )}

        {/* 当前使用自定义主题的提示 */}
        {currentTheme === 'custom' && customColors && !showCustomEditor && (
          <div className="p-4 bg-accent-blue/10 border border-accent-blue/30 rounded-lg">
            <p className="text-sm text-text-primary">
              ✨ 当前使用自定义主题
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ThemeSelector
