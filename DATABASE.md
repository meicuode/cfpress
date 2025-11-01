# 数据库设计文档

## 概述

CF Blog 使用 Cloudflare D1 (SQLite) 作为数据库。本文档详细描述了数据库的完整设计结构。

## 数据库表一览

| 表名 | 说明 | 主要用途 |
|------|------|----------|
| `users` | 用户表 | 管理员和普通用户信息 |
| `threads` | 文章表 | 博客文章核心内容 |
| `categories` | 分类表 | 文章分类（支持层级） |
| `tags` | 标签表 | 文章标签 |
| `thread_categories` | 文章-分类关联表 | 多对多关系 |
| `thread_tags` | 文章-标签关联表 | 多对多关系 |
| `comments` | 评论表 | 文章评论（支持嵌套） |
| `friends` | 友情链接表 | 友链管理 |
| `settings` | 站点设置表 | 全局配置 |
| `navigation` | 导航菜单表 | 自定义菜单 |
| `media` | 媒体文件表 | 图片视频管理 |
| `access_logs` | 访问日志表 | 统计分析 |

## 详细表结构

### 1. users (用户表)

存储系统用户信息，支持多种角色。

**字段说明：**
- `id`: 主键，自增
- `username`: 用户名（登录用），唯一
- `email`: 邮箱地址，唯一
- `password_hash`: 密码哈希值
- `display_name`: 显示名称
- `avatar`: 头像URL
- `role`: 用户角色（admin/editor/author/contributor/subscriber）
- `bio`: 个人简介
- `website`: 个人网站
- `status`: 账户状态（active/inactive/banned）
- `last_login_at`: 最后登录时间
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 2. threads (文章表)

博客文章的核心内容存储。对应前端 ThreadPage 和 `/thread/:id` 路由。

**字段说明：**
- `id`: 主键，自增
- `title`: 文章标题
- `slug`: URL友好的标识符（如：my-first-post）
- `content`: 文章内容（HTML/Markdown）
- `excerpt`: 文章摘要（300字以内）
- `thumbnail`: 缩略图URL（240×218）
- `author_id`: 作者ID（外键关联users表）
- `status`: 文章状态（draft/publish/trash）
- `comment_status`: 评论状态（open/closed）
- `view_count`: 浏览次数
- `comment_count`: 评论数量（冗余字段，通过触发器自动更新）
- `like_count`: 点赞数量
- `is_featured`: 是否精选（0/1）
- `is_pinned`: 是否置顶（0/1）
- `seo_title`: SEO标题
- `seo_description`: SEO描述
- `seo_keywords`: SEO关键词
- `created_at`: 创建时间
- `updated_at`: 更新时间（通过触发器自动更新）
- `published_at`: 发布时间

**索引：**
- `idx_posts_author_id`: 按作者查询
- `idx_posts_status`: 按状态查询
- `idx_posts_created_at`: 按创建时间倒序
- `idx_posts_published_at`: 按发布时间倒序
- `idx_posts_slug`: 按slug查询
- `idx_posts_status_published_at`: 组合索引，优化首页查询

### 3. categories (分类表)

文章分类管理，支持多级层级结构。

**字段说明：**
- `id`: 主键，自增
- `name`: 分类名称
- `slug`: URL友好标识符
- `description`: 分类描述
- `parent_id`: 父分类ID（NULL表示顶级分类）
- `thumbnail`: 分类缩略图
- `sort_order`: 排序序号
- `thread_count`: 文章数量（冗余字段）
- `created_at`: 创建时间
- `updated_at`: 更新时间

**层级示例：**
```
技术 (parent_id: NULL)
├── 前端 (parent_id: 1)
└── 后端 (parent_id: 1)
```

### 4. tags (标签表)

文章标签，扁平结构。

**字段说明：**
- `id`: 主键，自增
- `name`: 标签名称
- `slug`: URL友好标识符
- `description`: 标签描述
- `thread_count`: 使用次数（冗余字段）
- `created_at`: 创建时间

### 5. thread_categories (文章-分类关联表)

多对多关系：一篇文章可以属于多个分类。

**字段说明：**
- `thread_id`: 文章ID
- `category_id`: 分类ID
- 联合主键：(thread_id, category_id)

### 6. thread_tags (文章-标签关联表)

多对多关系：一篇文章可以有多个标签。

**字段说明：**
- `thread_id`: 文章ID
- `tag_id`: 标签ID
- 联合主键：(thread_id, tag_id)

### 7. comments (评论表)

文章评论系统，支持嵌套回复。

**字段说明：**
- `id`: 主键，自增
- `thread_id`: 所属文章ID
- `parent_id`: 父评论ID（NULL表示顶级评论）
- `user_id`: 用户ID（登录用户评论时使用）
- `author_name`: 评论者昵称
- `author_email`: 评论者邮箱
- `author_website`: 评论者网址
- `author_avatar`: 评论者头像URL
- `content`: 评论内容
- `status`: 评论状态（pending/approved/spam/trash）
- `ip_address`: IP地址
- `user_agent`: 浏览器User-Agent
- `location`: 地理位置（如：北京）
- `os`: 操作系统（如：Windows 10）
- `browser`: 浏览器（如：Chrome 120）
- `device`: 设备类型（desktop/mobile/tablet）
- `like_count`: 点赞数量
- `reply_count`: 回复数量（冗余字段）
- `created_at`: 创建时间
- `updated_at`: 更新时间

**嵌套回复示例：**
```
评论1 (parent_id: NULL)
├── 回复1-1 (parent_id: 1)
└── 回复1-2 (parent_id: 1)
    └── 回复1-2-1 (parent_id: 3)
```

### 8. friends (友情链接表)

友情链接管理。

**字段说明：**
- `id`: 主键，自增
- `name`: 网站名称
- `url`: 网站URL
- `avatar`: 网站图标/头像
- `description`: 网站描述
- `email`: 联系邮箱
- `rss_url`: RSS订阅地址
- `sort_order`: 排序序号
- `status`: 状态（active/inactive）
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 9. settings (站点设置表)

键值对形式存储全局配置。

**字段说明：**
- `key`: 设置键名（主键）
- `value`: 设置值（支持JSON格式）
- `type`: 值类型（string/number/boolean/json）
- `description`: 设置描述
- `group_name`: 分组名称（general/seo/social等）
- `sort_order`: 排序序号
- `updated_at`: 更新时间

**预设配置项：**
- `site_title`: 站点标题
- `site_subtitle`: 站点副标题
- `site_url`: 站点地址
- `admin_email`: 管理员邮箱
- `site_language`: 站点语言
- `allow_registration`: 允许用户注册
- `default_user_role`: 新用户默认角色
- `posts_per_page`: 每页显示文章数
- `comment_status`: 评论状态
- `comment_moderation`: 评论审核开关

### 10. navigation (导航菜单表)

自定义导航菜单，支持层级结构和多位置。

**字段说明：**
- `id`: 主键，自增
- `label`: 菜单标签
- `path`: 菜单路径
- `icon`: 菜单图标（emoji或图标类名）
- `parent_id`: 父菜单ID（支持层级）
- `target`: 打开方式（_self/_blank）
- `sort_order`: 排序序号
- `is_home`: 是否首页（0/1）
- `is_active`: 是否启用（0/1）
- `position`: 位置（header/footer/sidebar）
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 11. media (媒体文件表)

上传的图片、视频等媒体文件管理。

**字段说明：**
- `id`: 主键，自增
- `user_id`: 上传者ID
- `filename`: 文件名
- `original_filename`: 原始文件名
- `file_path`: 文件路径/URL
- `file_type`: 文件类型（MIME type）
- `file_size`: 文件大小（字节）
- `width`: 图片宽度
- `height`: 图片高度
- `alt_text`: 替代文字（SEO）
- `caption`: 图片说明
- `description`: 描述
- `storage_type`: 存储类型（local/r2/s3/oss）
- `created_at`: 创建时间

### 12. access_logs (访问日志表)

记录文章访问日志，用于统计分析。

**字段说明：**
- `id`: 主键，自增
- `post_id`: 文章ID
- `user_id`: 用户ID（登录用户）
- `ip_address`: IP地址
- `user_agent`: 浏览器User-Agent
- `referer`: 来源页面
- `created_at`: 访问时间

## 数据关系图

```
users (1) ----< (N) posts
users (1) ----< (N) comments
users (1) ----< (N) media
posts (N) ----< (N) categories (through post_categories)
posts (N) ----< (N) tags (through post_tags)
posts (1) ----< (N) comments
posts (1) ----< (N) access_logs
comments (1) ----< (N) comments (self-referencing for replies)
categories (1) ----< (N) categories (self-referencing for hierarchy)
navigation (1) ----< (N) navigation (self-referencing for hierarchy)
```

## 触发器

### 1. update_posts_timestamp
- **触发时机**: 文章更新时
- **作用**: 自动更新 `updated_at` 字段

### 2. increment_post_comment_count
- **触发时机**: 评论创建且状态为approved时
- **作用**: 文章的 `comment_count` 字段 +1

### 3. decrement_post_comment_count
- **触发时机**: 评论删除且状态为approved时
- **作用**: 文章的 `comment_count` 字段 -1

## 初始化步骤

### 1. 创建D1数据库

```bash
npx wrangler d1 create cfpress
```

### 2. 执行Schema脚本

```bash
npx wrangler d1 execute cfpress --file=schema.sql
```

### 3. 在Cloudflare Pages中绑定数据库

1. 进入 Cloudflare Pages Dashboard
2. 选择项目 → Settings → Functions
3. 添加 D1 数据库绑定
   - Variable name: `DB`
   - D1 database: `cfpress`

## API接口设计建议

### 文章相关
- `GET /api/posts` - 获取文章列表（支持分页、筛选）
- `GET /api/posts/:id` - 获取单篇文章
- `POST /api/posts` - 创建文章（需要认证）
- `PUT /api/posts/:id` - 更新文章（需要认证）
- `DELETE /api/posts/:id` - 删除文章（需要认证）

### 评论相关
- `GET /api/comments?post_id=:id` - 获取文章评论
- `POST /api/comments` - 创建评论
- `PUT /api/comments/:id` - 更新评论状态（需要认证）
- `DELETE /api/comments/:id` - 删除评论（需要认证）

### 其他
- `GET /api/categories` - 获取分类列表
- `GET /api/tags` - 获取标签列表
- `GET /api/settings` - 获取站点设置
- `GET /api/navigation` - 获取导航菜单

## 性能优化建议

1. **索引优化**
   - 已为常用查询字段创建索引
   - 组合索引优化首页查询性能

2. **冗余字段**
   - `post_count` 在 categories 和 tags 表中
   - `comment_count` 在 posts 表中
   - `reply_count` 在 comments 表中
   - 通过触发器自动维护，避免频繁JOIN查询

3. **分页查询**
   - 建议使用基于游标的分页（LIMIT + OFFSET）
   - 大表查询限制返回数量

4. **缓存策略**
   - 热门文章列表缓存
   - 分类/标签列表缓存
   - 站点设置缓存

## 注意事项

1. **D1限制**
   - 单个数据库最大 2GB
   - 单次查询最大 1MB 结果
   - 写入操作有速率限制

2. **安全考虑**
   - 密码使用bcrypt哈希存储
   - API需要实现认证和授权
   - 防止SQL注入（使用参数化查询）
   - XSS防护（评论内容过滤）

3. **数据迁移**
   - 保留 `created_at` 和 `updated_at` 字段
   - 使用事务确保数据一致性

## 扩展性

当前设计支持以下扩展：

- [ ] 文章版本控制
- [ ] 文章草稿自动保存
- [ ] 评论点赞功能
- [ ] 用户关注系统
- [ ] 文章收藏功能
- [ ] 全文搜索（可结合Cloudflare Workers AI）
- [ ] RSS订阅生成
- [ ] Sitemap生成
- [ ] 邮件通知系统
