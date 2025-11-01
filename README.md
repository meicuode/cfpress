# CFPress - Cloudflare Pages 博客

基于 Cloudflare Pages + D1 数据库 + React 构建的现代博客系统。

## 技术栈

- **前端**: React 18 + Vite
- **样式**: Tailwind CSS v3.3.0
- **路由**: React Router v6
- **托管**: Cloudflare Pages
- **数据库**: Cloudflare D1 (SQLite)
- **API**: Cloudflare Pages Functions

## 项目结构

```
cfpress/
├── src/                    # React 源代码
│   ├── components/        # 可复用组件
│   │   ├── Layout.jsx
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   └── Footer.jsx
│   ├── pages/             # 页面组件
│   │   ├── HomePage.jsx
│   │   ├── ThreadPage.jsx
│   │   ├── TagPage.jsx
│   │   ├── CategoryPage.jsx
│   │   ├── AboutPage.jsx
│   │   └── FriendsPage.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── functions/              # Cloudflare Pages Functions
│   └── api/
│       ├── posts.js       # 文章列表和创建
│       ├── posts/[id].js  # 单个文章操作
│       └── comments.js    # 评论功能
├── public/                # 静态资源
├── designs/               # 设计稿
├── schema.sql             # D1 数据库结构
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## 开发指南

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 3. 创建 D1 数据库（部署时需要）

```bash
# 创建数据库
npx wrangler d1 create cfpress

# 初始化数据库结构
npx wrangler d1 execute cfpress --file=./schema.sql
```

### 4. 构建和部署

```bash
# 构建项目
npm run build

# 部署到 Cloudflare Pages
npm run pages:deploy
```

## Cloudflare Pages 配置

在 Cloudflare Pages Dashboard 中：

1. **Build settings**:
   - Build command: `npm run build`
   - Build output directory: `dist`

2. **D1 Database Binding**:
   - Variable name: `DB`
   - D1 database: 选择创建的 `cfpress`

## API 端点

所有 API 通过 Cloudflare Pages Functions 提供：

- `GET /api/posts` - 获取文章列表
- `POST /api/posts` - 创建新文章
- `GET /api/posts/:id` - 获取单个文章
- `PUT /api/posts/:id` - 更新文章
- `DELETE /api/posts/:id` - 删除文章
- `GET /api/comments?post_id=:id` - 获取评论
- `POST /api/comments` - 创建评论

## 数据库结构

### Posts 表
- `id` - 文章 ID
- `title` - 标题
- `content` - 内容（HTML）
- `tags` - 标签（JSON）
- `views` - 浏览量
- `created_at` - 创建时间
- `updated_at` - 更新时间
- `published` - ���布状态

### Comments 表
- `id` - 评论 ID
- `post_id` - 文章 ID
- `author` - 作者
- `content` - 内容
- `created_at` - 创建时间

## 设计特色

- 深色主题
- 半透明卡片效果
- 响应式布局
- 流畅的过渡动画
- 顶部导航栏搜索功能

### 设计文件

项目的 UI 设计参考位于 `designs/` 目录：
- `about.png` - 关于页面设计
- `search_on_top_navbar.png` - 顶部导航栏搜索功能设计
- 其他页面设计（主页、文章详情、标签、分类等）

参考网站: https://blog.qqquq.com/

## License

MIT
