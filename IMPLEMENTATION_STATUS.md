# 主题和布局系统 - 完成指南

##  已完成的主题系统

### ✅ 完成的文件
1. `src/contexts/ThemeContext.jsx` - 增强的主题上下文
2. `functions/api/theme.js` - 主题 API（D1 + 缓存）
3. `functions/api/init-db.js` - 添加 site_themes 表
4. `src/components/ThemeSelector.jsx` - 主题选择器组件

### 🔧 下一步操作

#### 1. 初始化数据库
访问: `http://127.0.0.1:8788/api/init-db`

#### 2. 更新 Tailwind 配置（可选）
如果要使用 CSS 变量替换现有的 Tailwind 类，可以更新 `tailwind.config.js`

#### 3. 创建设置页面
创建 `src/pages/SettingsPage.jsx` 来集成 ThemeSelector

```jsx
import ThemeSelector from '../components/ThemeSelector'

function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">站点设置</h1>
      <ThemeSelector />
    </div>
  )
}

export default SettingsPage
```

#### 4. 添加路由
在 `src/App.jsx` 中添加设置页面路由

---

## 📋 拖拽布局系统（待实现）

### 需要创建的文件
1. `src/contexts/LayoutContext.jsx` - 布局管理器
2. `src/components/DraggableLayout.jsx` - 拖拽容器组件
3. 布局 API（可选，可以先用 localStorage）

### 关键功能
- 网格化拖拽
- 响应式断点
- 布局持久化
- 编辑模式开关

---

## 🚀 快速开始

### 测试主题系统

1. **启动服务**
   ```bash
   npm run pages:dev
   ```

2. **初始化数据库**
   访问: http://127.0.0.1:8788/api/init-db

3. **测试主题 API**
   ```bash
   # 获取当前主题
   curl http://127.0.0.1:8788/api/theme

   # 切换主题
   curl -X POST http://127.0.0.1:8788/api/theme \
     -H "Content-Type: application/json" \
     -d '{"theme_name":"midnight","custom_colors":null}'
   ```

4. **在页面中使用**
   ```jsx
   import { useTheme } from './contexts/ThemeContext'

   function MyComponent() {
     const { currentTheme, switchTheme } = useTheme()

     return (
       <div>
         <p>Current theme: {currentTheme}</p>
         <button onClick={() => switchTheme('midnight')}>
           Switch to Midnight
         </button>
       </div>
     )
   }
   ```

---

## ⚠️ 注意事项

### 缓存刷新
- 更新主题时会自动清除边缘缓存
- 缓存有效期：2 小时
- 缓存 Key: GET /api/theme

### 降级策略
- API 失败时自动降级到 localStorage
- 确保用户体验不受影响

### CSS 变量
当前主题会自动设置以下 CSS 变量：
- `--color-primary`
- `--color-card`
- `--color-text-primary`
- `--color-text-secondary`
- `--color-accent-blue`
- `--color-border`

---

## 📝 建议

1. **先测试主题系统** - 确保基础功能正常
2. **再实现布局系统** - 避免一次性修改太多
3. **逐步迁移** - 可以先在新页面使用，旧页面保持不变

---

## 🐛 故障排查

### 主题不生效？
1. 检查浏览器控制台是否有错误
2. 确认 API 返回正确的数据
3. 检查 CSS 变量是否正确设置

### 缓存问题？
1. 清除浏览器缓存
2. 重启 Wrangler Pages 开发服务器
3. 检查 Cache API 是否正常工作

---

**您现在想要：**
A. 先测试主题系统是否工作
B. 继续实现拖拽布局系统
C. 创建完整的设置页面

请告诉我您的选择！
