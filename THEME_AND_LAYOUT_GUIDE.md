# 自定义主题和拖拽布局实现方案

## 一、主题系统增强

### 1.1 安装依赖

无需额外依赖，使用 CSS 变量即可。

### 1.2 增强 ThemeContext

修改 `src/contexts/ThemeContext.jsx`，支持：
- 多个预设主题
- 自定义主题颜色
- 主题预览
- 导入导出主题

```jsx
// 参考实现见下方代码
```

### 1.3 更新 Tailwind 配置

修改 `tailwind.config.js`，使用 CSS 变量：

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'bg-card': 'var(--color-card)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'accent-blue': 'var(--color-accent-blue)',
        border: 'var(--color-border)',
      }
    }
  }
}
```

### 1.4 添加主题切换组件

创建 `src/components/ThemeSelector.jsx`

---

## 二、拖拽布局系统

### 2.1 安装依赖

```bash
npm install react-grid-layout
```

### 2.2 创建布局管理器

创建 `src/contexts/LayoutContext.jsx`

### 2.3 定义可拖拽区域

```jsx
// 首页布局配置
const defaultHomeLayout = [
  { i: 'profile', x: 0, y: 0, w: 3, h: 4 },      // 左侧个人信息卡片
  { i: 'categories', x: 0, y: 4, w: 3, h: 6 },   // 分类菜单
  { i: 'posts', x: 3, y: 0, w: 9, h: 10 },       // 文章列表
  { i: 'tags', x: 3, y: 10, w: 9, h: 3 },        // 标签云
]
```

### 2.4 实现拖拽容器组件

创建 `src/components/DraggableLayout.jsx`

---

## 三、实现步骤

### 步骤 1: 增强主题系统

1. 更新 `ThemeContext.jsx`
2. 修改 `tailwind.config.js`
3. 创建主题选择器组件
4. 添加到导航栏或设置页面

### 步骤 2: 实现拖拽布局

1. 安装 `react-grid-layout`
2. 创建 `LayoutContext.jsx`
3. 创建 `DraggableLayout.jsx` 组件
4. 改造现有页面使用拖拽布局

### 步骤 3: 创建设置页面

创建 `src/pages/SettingsPage.jsx`，包含：
- 主题切换
- 颜色自定义
- 布局编辑模式开关
- 重置布局按钮

---

## 四、关键代码示例

### 4.1 增强的 ThemeContext

详见附件 `ThemeContext.enhanced.jsx`

### 4.2 主题选择器组件

详见附件 `ThemeSelector.jsx`

### 4.3 布局管理器

详见附件 `LayoutContext.jsx`

### 4.4 拖拽布局组件

详见附件 `DraggableLayout.jsx`

---

## 五、使用示例

### 5.1 在 App.jsx 中启用

```jsx
import { ThemeProvider } from './contexts/ThemeContext'
import { LayoutProvider } from './contexts/LayoutContext'

function App() {
  return (
    <ThemeProvider>
      <LayoutProvider>
        {/* 其他内容 */}
      </LayoutProvider>
    </ThemeProvider>
  )
}
```

### 5.2 在页面中使用

```jsx
import DraggableLayout from '../components/DraggableLayout'
import { useLayout } from '../contexts/LayoutContext'

function HomePage() {
  const { layout, isEditMode } = useLayout()

  return (
    <DraggableLayout layoutKey="home">
      <div key="profile">个人信息卡片</div>
      <div key="categories">分类菜单</div>
      <div key="posts">文章列表</div>
      <div key="tags">标签云</div>
    </DraggableLayout>
  )
}
```

---

## 六、优化建议

### 6.1 性能优化
- 使用 `React.memo` 优化拖拽组件
- 防抖保存布局配置
- 使用 CSS `will-change` 优化动画

### 6.2 用户体验
- 添加拖拽时的视觉反馈
- 提供布局预设模板
- 支持导入/导出配置
- 添加撤销/重做功能

### 6.3 移动端适配
- 在移动端禁用拖拽
- 使用固定布局或简化版布局
- 提供移动端专用的布局配置

---

## 七、技术栈

- **主题系统**: CSS Variables + React Context
- **拖拽功能**: react-grid-layout
- **状态持久化**: localStorage
- **样式**: Tailwind CSS

---

## 八、下一步行动

您想让我：
1. **实现增强的主题系统**（多主题 + 自定义颜色）
2. **实现拖拽布局系统**
3. **两者都实现**

请告诉我您的选择，我会开始实现代码！
