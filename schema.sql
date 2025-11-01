-- ============================================================================
-- CF Blog - D1 Database Schema
-- 完整的博客系统数据库设计
-- 注意：不使用外键约束，由应用层保证数据完整性，以获得更好的性能
-- ============================================================================

-- ============================================================================
-- 用户表 (Users)
-- 存储系统用户信息，包括管理员和普通用户
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,              -- 用户名（登录用）
  email TEXT UNIQUE NOT NULL,                 -- 邮箱地址
  password_hash TEXT NOT NULL,                -- 密码哈希
  display_name TEXT NOT NULL,                 -- 显示名称
  avatar TEXT,                                -- 头像URL
  role TEXT NOT NULL DEFAULT 'subscriber',    -- 角色: admin/editor/author/contributor/subscriber
  bio TEXT,                                   -- 个人简介
  website TEXT,                               -- 个人网站
  status TEXT NOT NULL DEFAULT 'active',      -- 状态: active/inactive/banned
  last_login_at TEXT,                         -- 最后登录时间
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

-- ============================================================================
-- 文章表 (Threads)
-- 存储博客文章的核心内容
-- 关系：author_id -> users.id
-- ============================================================================
CREATE TABLE IF NOT EXISTS threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,                        -- 文章标题
  slug TEXT UNIQUE,                           -- URL友好标识符
  content TEXT NOT NULL,                      -- 文章内容（支持HTML/Markdown）
  excerpt TEXT,                               -- 文章摘要（手动或自动生成）
  thumbnail TEXT,                             -- 缩略图URL
  author_id INTEGER NOT NULL,                 -- 作者ID（关联users表）
  status TEXT NOT NULL DEFAULT 'draft',       -- 状态: draft/publish/trash
  comment_status TEXT NOT NULL DEFAULT 'open', -- 评论状态: open/closed
  view_count INTEGER NOT NULL DEFAULT 0,      -- 浏览次数
  comment_count INTEGER NOT NULL DEFAULT 0,   -- 评论数量（冗余字段，便于查询）
  like_count INTEGER NOT NULL DEFAULT 0,      -- 点赞数量
  is_featured INTEGER NOT NULL DEFAULT 0,     -- 是否精选: 0/1
  is_pinned INTEGER NOT NULL DEFAULT 0,       -- 是否置顶: 0/1
  seo_title TEXT,                             -- SEO标题
  seo_description TEXT,                       -- SEO描述
  seo_keywords TEXT,                          -- SEO关键词
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  published_at TEXT                           -- 发布时间
);

-- ============================================================================
-- 分类表 (Categories)
-- 文章分类管理，支持层级结构
-- 关系：parent_id -> categories.id (自引用)
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                         -- 分类名称
  slug TEXT UNIQUE NOT NULL,                  -- URL友好标识符
  description TEXT,                           -- 分类描述
  parent_id INTEGER,                          -- 父分类ID（NULL表示顶级分类）
  thumbnail TEXT,                             -- 分类缩略图
  sort_order INTEGER NOT NULL DEFAULT 0,      -- 排序序号
  thread_count INTEGER NOT NULL DEFAULT 0,    -- 文章数量（冗余字段）
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

-- ============================================================================
-- 标签表 (Tags)
-- 文章标签管理
-- ============================================================================
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,                  -- 标签名称
  slug TEXT UNIQUE NOT NULL,                  -- URL友好标识符
  description TEXT,                           -- 标签描述
  thread_count INTEGER NOT NULL DEFAULT 0,    -- 使用次数（冗余字段）
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 文章-分类关联表 (Thread Categories)
-- 多对多关系：一篇文章可以属于多个分类
-- 关系：thread_id -> threads.id, category_id -> categories.id
-- ============================================================================
CREATE TABLE IF NOT EXISTS thread_categories (
  thread_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  PRIMARY KEY (thread_id, category_id)
);

-- ============================================================================
-- 文章-标签关联表 (Thread Tags)
-- 多对多关系：一篇文章可以有多个标签
-- 关系：thread_id -> threads.id, tag_id -> tags.id
-- ============================================================================
CREATE TABLE IF NOT EXISTS thread_tags (
  thread_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (thread_id, tag_id)
);

-- ============================================================================
-- 评论表 (Comments)
-- 文章评论系统，支持嵌套回复
-- 关系：thread_id -> threads.id, parent_id -> comments.id (自引用), user_id -> users.id
-- ============================================================================
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,                 -- 所属文章ID
  parent_id INTEGER,                          -- 父评论ID（NULL表示顶级评论）
  user_id INTEGER,                            -- 用户ID（登录用户评论时使用）
  author_name TEXT NOT NULL,                  -- 评论者昵称
  author_email TEXT NOT NULL,                 -- 评论者邮箱
  author_website TEXT,                        -- 评论者网址
  author_avatar TEXT,                         -- 评论者头像URL
  content TEXT NOT NULL,                      -- 评论内容
  status TEXT NOT NULL DEFAULT 'pending',     -- 状态: pending/approved/spam/trash
  ip_address TEXT,                            -- IP地址
  user_agent TEXT,                            -- 浏览器User-Agent
  location TEXT,                              -- 地理位置（如：北京）
  os TEXT,                                    -- 操作系统（如：Windows 10）
  browser TEXT,                               -- 浏览器（如：Chrome 120）
  device TEXT,                                -- 设备类型（desktop/mobile/tablet）
  like_count INTEGER NOT NULL DEFAULT 0,      -- 点赞数量
  reply_count INTEGER NOT NULL DEFAULT 0,     -- 回复数量（冗余字段）
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

-- ============================================================================
-- 友情链接表 (Friends)
-- 友情链接管理
-- ============================================================================
CREATE TABLE IF NOT EXISTS friends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                         -- 网站名称
  url TEXT NOT NULL,                          -- 网站URL
  avatar TEXT,                                -- 网站图标/头像
  description TEXT,                           -- 网站描述
  email TEXT,                                 -- 联系邮箱
  rss_url TEXT,                               -- RSS订阅地址
  sort_order INTEGER NOT NULL DEFAULT 0,      -- 排序序号
  status TEXT NOT NULL DEFAULT 'active',      -- 状态: active/inactive
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

-- ============================================================================
-- 站点设置表 (Settings)
-- 存储站点全局配置，键值对形式
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,                       -- 设置键名
  value TEXT,                                 -- 设置值（JSON格式存储复杂对象）
  type TEXT NOT NULL DEFAULT 'string',        -- 值类型: string/number/boolean/json
  description TEXT,                           -- 设置描述
  group_name TEXT,                            -- 分组名称（如：general/seo/social）
  sort_order INTEGER NOT NULL DEFAULT 0,      -- 排序序号
  updated_at TEXT
);

-- ============================================================================
-- 导航菜单表 (Navigation)
-- 自定义导航菜单，支持层级结构
-- 关系：parent_id -> navigation.id (自引用)
-- ============================================================================
CREATE TABLE IF NOT EXISTS navigation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,                        -- 菜单标签
  path TEXT NOT NULL,                         -- 菜单路径
  icon TEXT,                                  -- 菜单图标（emoji或图标类名）
  parent_id INTEGER,                          -- 父菜单ID（NULL表示顶级菜单）
  target TEXT DEFAULT '_self',                -- 打开方式: _self/_blank
  sort_order INTEGER NOT NULL DEFAULT 0,      -- 排序序号
  is_home INTEGER NOT NULL DEFAULT 0,         -- 是否首页: 0/1
  is_active INTEGER NOT NULL DEFAULT 1,       -- 是否启用: 0/1
  position TEXT NOT NULL DEFAULT 'header',    -- 位置: header/footer/sidebar
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

-- ============================================================================
-- 媒体文件表 (Media)
-- 上传的图片、视频等媒体文件管理
-- 关系：user_id -> users.id
-- ============================================================================
CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,                   -- 上传者ID
  filename TEXT NOT NULL,                     -- 文件名
  original_filename TEXT NOT NULL,            -- 原始文件名
  file_path TEXT NOT NULL,                    -- 文件路径/URL
  file_type TEXT NOT NULL,                    -- 文件类型（MIME type）
  file_size INTEGER NOT NULL,                 -- 文件大小（字节）
  width INTEGER,                              -- 图片宽度
  height INTEGER,                             -- 图片高度
  alt_text TEXT,                              -- 替代文字（SEO）
  caption TEXT,                               -- 图片说明
  description TEXT,                           -- 描述
  storage_type TEXT NOT NULL DEFAULT 'local', -- 存储类型: local/r2/s3/oss
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 访问日志表 (Access Logs)
-- 记录文章访问日志，用于统计分析
-- 关系：thread_id -> threads.id, user_id -> users.id
-- ============================================================================
CREATE TABLE IF NOT EXISTS access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER,                          -- 文章ID
  user_id INTEGER,                            -- 用户ID（登录用户）
  ip_address TEXT,                            -- IP地址
  user_agent TEXT,                            -- 浏览器User-Agent
  referer TEXT,                               -- 来源页面
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 索引创建
-- 优化查询性能
-- ============================================================================

-- 文章表索引
CREATE INDEX IF NOT EXISTS idx_threads_author_id ON threads(author_id);
CREATE INDEX IF NOT EXISTS idx_threads_status ON threads(status);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_published_at ON threads(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_slug ON threads(slug);
CREATE INDEX IF NOT EXISTS idx_threads_status_published_at ON threads(status, published_at DESC);

-- 评论表索引
CREATE INDEX IF NOT EXISTS idx_comments_thread_id ON comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- 分类表索引
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- 标签表索引
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_thread_count ON tags(thread_count DESC);

-- 关联表索引
CREATE INDEX IF NOT EXISTS idx_thread_categories_category_id ON thread_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_thread_tags_tag_id ON thread_tags(tag_id);

-- 导航表索引
CREATE INDEX IF NOT EXISTS idx_navigation_parent_id ON navigation(parent_id);
CREATE INDEX IF NOT EXISTS idx_navigation_position ON navigation(position);
CREATE INDEX IF NOT EXISTS idx_navigation_sort_order ON navigation(sort_order);

-- 媒体表索引
CREATE INDEX IF NOT EXISTS idx_media_user_id ON media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);

-- 访问日志表索引
CREATE INDEX IF NOT EXISTS idx_access_logs_thread_id ON access_logs(thread_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at DESC);

-- ============================================================================
-- 初始化数据
-- ============================================================================

-- 插入默认管理员用户
INSERT INTO users (username, email, password_hash, display_name, role) VALUES
  ('admin', 'admin@example.com', '$2a$10$dummyhash', 'Administrator', 'admin');

-- 插入默认分类
INSERT INTO categories (name, slug, description) VALUES
  ('未分类', 'uncategorized', '默认分类'),
  ('技术', 'tech', '技术相关文章'),
  ('生活', 'life', '生活随笔'),
  ('分享', 'share', '资源分享');

-- 插入默认标签
INSERT INTO tags (name, slug) VALUES
  ('折腾', 'tinkering'),
  ('教程', 'tutorial'),
  ('测评', 'review'),
  ('VPS', 'vps'),
  ('前端', 'frontend');

-- 插入示例文章
INSERT INTO threads (title, slug, content, excerpt, thumbnail, author_id, status, view_count, published_at) VALUES
  (
    '一年只需 10 HKD 的香港保号卡 hahaSIM 开箱测评',
    'hahasim-review',
    '<p>本周六凌晨正好看了 10 传后，开着窗门看到了北极光...</p><h2>开箱体验</h2><p>收到卡片后的第一印象...</p><h2>使用感受</h2><p>实际使用中的体验...</p>',
    '本周六凌晨正好看了 10 传后，开着窗门看到了北极光。这是一篇关于 hahaSIM 的详细测评文章，分享一年只需 10 港币的香港保号卡使用体验。',
    'https://via.placeholder.com/240x218/4a9eff/ffffff?text=hahaSIM',
    1,
    'publish',
    770,
    '2025-03-18T10:00:00Z'
  ),
  (
    '近乎于手动的华为云 2H1G 香港小鸡只测不评',
    'huawei-cloud-hk-test',
    '<p>本周六凌晨正好看了 14 天升，拿着窗户看到星空...</p><p>华为云香港服务器测试报告。</p>',
    '华为云香港 2核1G 服务器性能测试，包含网络延迟、磁盘IO、CPU性能等多项指标测试。',
    'https://via.placeholder.com/240x218/6dd47e/ffffff?text=Huawei',
    1,
    'publish',
    1025,
    '2024-11-26T08:30:00Z'
  ),
  (
    '论如何下载 Apple Music 的 ALAC 格式音乐',
    'apple-music-alac-download',
    '<p>分享一个下载高品质音乐的方法...</p>',
    '分享如何下载 Apple Music 无损音乐格式 ALAC，包含详细教程和工具推荐。',
    'https://via.placeholder.com/240x218/ff6b6b/ffffff?text=Music',
    1,
    'publish',
    892,
    '2024-10-15T14:20:00Z'
  );

-- 关联文章和分类
INSERT INTO thread_categories (thread_id, category_id) VALUES
  (1, 2), -- 技术
  (1, 4), -- 分享
  (2, 2), -- 技术
  (3, 4); -- 分享

-- 关联文章和标签
INSERT INTO thread_tags (thread_id, tag_id) VALUES
  (1, 1), -- 折腾
  (1, 3), -- 测评
  (2, 3), -- 测评
  (2, 4), -- VPS
  (3, 2); -- 教程

-- 插入示例评论
INSERT INTO comments (thread_id, author_name, author_email, content, status, location, os, browser, created_at) VALUES
  (
    1,
    '五行缺失',
    'user1@example.com',
    '建站一直用的阿里云，华为云还真没有用过',
    'approved',
    '加利福尼亚',
    'Windows 7',
    'Chrome 86.0.4240.198',
    '2025-05-10T09:00:00Z'
  ),
  (
    1,
    '用户B',
    'user2@example.com',
    '请问在哪里购买？',
    'approved',
    '北京',
    'macOS',
    'Safari 16.0',
    '2025-03-20T15:30:00Z'
  );

-- 插入站点设置
INSERT INTO settings (key, value, type, description, group_name) VALUES
  ('site_title', '没有小家', 'string', '站点标题', 'general'),
  ('site_subtitle', '又一个 WordPress 站点', 'string', '站点副标题', 'general'),
  ('site_url', 'https://blogs.zuichu.de', 'string', '站点地址', 'general'),
  ('admin_email', 'admin@example.com', 'string', '管理员邮箱', 'general'),
  ('site_language', 'zh_CN', 'string', '站点语言', 'general'),
  ('allow_registration', 'false', 'boolean', '允许用户注册', 'general'),
  ('default_user_role', 'subscriber', 'string', '新用户默认角色', 'general'),
  ('threads_per_page', '10', 'number', '每页显示文章数', 'general'),
  ('comment_status', 'open', 'string', '评论状态', 'general'),
  ('comment_moderation', 'true', 'boolean', '评论需要审核', 'general');

-- 插入导航菜单
INSERT INTO navigation (label, path, icon, is_home, sort_order, position) VALUES
  ('主菜单', '/', NULL, 1, 1, 'header'),
  ('归档', '/category', '📚', 0, 2, 'header'),
  ('关于', '/about', '✨', 0, 3, 'header'),
  ('友链', '/friends', '💝', 0, 4, 'header');

-- 插入友情链接示例
INSERT INTO friends (name, url, avatar, description, sort_order) VALUES
  ('Example Blog', 'https://example.com', 'https://via.placeholder.com/50', '一个很棒的博客', 1),
  ('Tech Site', 'https://techsite.com', 'https://via.placeholder.com/50', '技术分享网站', 2);

-- ============================================================================
-- 更新冗余字段（计数器）
-- 这些更新确保所有计数字段准确
-- ============================================================================

-- 更新文章评论数
UPDATE threads SET comment_count = (
  SELECT COUNT(*) FROM comments WHERE comments.thread_id = threads.id AND comments.status = 'approved'
);

-- 更新分类文章数
UPDATE categories SET thread_count = (
  SELECT COUNT(*) FROM thread_categories WHERE thread_categories.category_id = categories.id
);

-- 更新标签文章数
UPDATE tags SET thread_count = (
  SELECT COUNT(*) FROM thread_tags WHERE thread_tags.tag_id = tags.id
);

-- 更新评论回复数
UPDATE comments SET reply_count = (
  SELECT COUNT(*) FROM comments AS c WHERE c.parent_id = comments.id
);

-- ============================================================================
-- 触发器（可选）
-- 自动更新计数器和时间戳
-- 注意：D1 支持触发器，但需要测试性能影响
-- ============================================================================

-- 文章更新时间触发器
CREATE TRIGGER IF NOT EXISTS update_threads_timestamp
AFTER UPDATE ON threads
FOR EACH ROW
BEGIN
  UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 评论创建时更新文章评论数
CREATE TRIGGER IF NOT EXISTS increment_thread_comment_count
AFTER INSERT ON comments
FOR EACH ROW
WHEN NEW.status = 'approved'
BEGIN
  UPDATE threads SET comment_count = comment_count + 1 WHERE id = NEW.thread_id;
END;

-- 评论删除时更新文章评论数
CREATE TRIGGER IF NOT EXISTS decrement_thread_comment_count
AFTER DELETE ON comments
FOR EACH ROW
WHEN OLD.status = 'approved'
BEGIN
  UPDATE threads SET comment_count = comment_count - 1 WHERE id = OLD.thread_id;
END;

-- ============================================================================
-- 结束
-- ============================================================================
