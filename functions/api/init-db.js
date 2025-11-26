/**
 * 数据库初始化 API
 * GET /api/init-db - 初始化数据库（仅开发环境）
 * GET /api/init-db?purgeBeforeInit=true - 先清空所有表再初始化
 *
 * 使用数组方式执行 SQL，避免分号分割问题
 */

export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    // 解析 URL 参数
    const url = new URL(request.url);
    const purgeBeforeInit = url.searchParams.get('purgeBeforeInit') === 'true';

    console.log('🔧 开始初始化数据库...');
    if (purgeBeforeInit) {
      console.log('⚠️ purgeBeforeInit=true, 将先删除所有表再重新创建');
    }

    // 如果需要先清空数据库
    if (purgeBeforeInit) {
      const dropStatements = [
        'DROP TABLE IF EXISTS thread_drafts',
        'DROP TABLE IF EXISTS folders',
        'DROP TABLE IF EXISTS files',
        'DROP TABLE IF EXISTS access_logs',
        'DROP TABLE IF EXISTS media',
        'DROP TABLE IF EXISTS navigation',
        'DROP TABLE IF EXISTS settings',
        'DROP TABLE IF EXISTS friends',
        'DROP TABLE IF EXISTS comments',
        'DROP TABLE IF EXISTS thread_tags',
        'DROP TABLE IF EXISTS thread_categories',
        'DROP TABLE IF EXISTS tags',
        'DROP TABLE IF EXISTS categories',
        'DROP TABLE IF EXISTS threads',
        'DROP TABLE IF EXISTS users'
      ];

      console.log(`🗑️ 准备删除 ${dropStatements.length} 个表`);
      const dropBatch = dropStatements.map(stmt => env.DB.prepare(stmt));
      await env.DB.batch(dropBatch);
      console.log('✅ 已删除所有表');
    }

    // 将所有 SQL 语句组织成数组，包括触发器
    // 每个元素是一条完整的 SQL 语句
    const sqlStatements = [];

    // ========== 表结构 ==========

    // 1. users 表
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'subscriber',
  bio TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
)`);

    // 2. threads 表
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  thumbnail TEXT,
  author_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  comment_status TEXT NOT NULL DEFAULT 'open',
  view_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  published_at TEXT
)`);

    // 3. categories 表
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id INTEGER,
  thumbnail TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  thread_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
)`);

    // 4. tags 表
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thread_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

    // 5. thread_categories 表
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS thread_categories (
  thread_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  PRIMARY KEY (thread_id, category_id)
)`);

    // 6. thread_tags 表
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS thread_tags (
  thread_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (thread_id, tag_id)
)`);

    // 7. comments 表
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  parent_id INTEGER,
  user_id INTEGER,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  author_website TEXT,
  author_avatar TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  ip_address TEXT,
  user_agent TEXT,
  location TEXT,
  os TEXT,
  browser TEXT,
  device TEXT,
  like_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
)`);

    // 8. friends 表
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS friends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  avatar TEXT,
  description TEXT,
  email TEXT,
  rss_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
)`);

    // 9. settings 表
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  type TEXT NOT NULL DEFAULT 'string',
  description TEXT,
  group_name TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT
)`);

    // 10. navigation 表
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS navigation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  path TEXT NOT NULL,
  icon TEXT,
  parent_id INTEGER,
  target TEXT DEFAULT '_self',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_home INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  position TEXT NOT NULL DEFAULT 'header',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
)`);

    // 11. media 表
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  caption TEXT,
  description TEXT,
  storage_type TEXT NOT NULL DEFAULT 'local',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

    // 12. access_logs 表
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER,
  user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

    // 13. files 表
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT '/',
  r2_key TEXT NOT NULL UNIQUE,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  extension TEXT,
  is_image INTEGER DEFAULT 0,
  is_video INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  thumbnail_r2_key TEXT,
  medium_r2_key TEXT,
  has_thumbnails INTEGER DEFAULT 0,
  thumbnail_key TEXT,
  upload_user TEXT,
  expires_at DATETIME,
  is_expired INTEGER DEFAULT 0,
  purged INTEGER DEFAULT 0,
  purged_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

    // 14. folders 表
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  parent_path TEXT DEFAULT '/',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

    // 15. thread_drafts 表 - 文章草稿副本
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS thread_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL UNIQUE,
  title TEXT,
  content TEXT,
  excerpt TEXT,
  categories TEXT,
  tags TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

    // ========== 索引 ==========

    // threads 索引
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_threads_author_id ON threads(author_id)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_threads_status ON threads(status)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at DESC)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_threads_published_at ON threads(published_at DESC)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_threads_slug ON threads(slug)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_threads_status_published_at ON threads(status, published_at DESC)`);

    // comments 索引
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_comments_thread_id ON comments(thread_id)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC)`);

    // categories 索引
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)`);

    // tags 索引
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_tags_thread_count ON tags(thread_count DESC)`);

    // 关联表索引
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_thread_categories_category_id ON thread_categories(category_id)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_thread_tags_tag_id ON thread_tags(tag_id)`);

    // navigation 索引
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_navigation_parent_id ON navigation(parent_id)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_navigation_position ON navigation(position)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_navigation_sort_order ON navigation(sort_order)`);

    // media 索引
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_media_user_id ON media(user_id)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC)`);

    // access_logs 索引
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_access_logs_thread_id ON access_logs(thread_id)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at DESC)`);

    // files 索引
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_files_path ON files(path)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_files_mime_type ON files(mime_type)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_files_r2_key ON files(r2_key)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(expires_at)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_files_is_expired ON files(is_expired)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_files_purged ON files(purged)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_files_is_image ON files(is_image)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_files_has_thumbnails ON files(has_thumbnails)`);

    // folders 索引
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_folders_path ON folders(path)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_folders_parent_path ON folders(parent_path)`);

    // thread_drafts 索引
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_thread_drafts_thread_id ON thread_drafts(thread_id)`);
    sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_thread_drafts_updated_at ON thread_drafts(updated_at DESC)`);

    // ========== 初始数据 ==========

    // 管理员用户
    sqlStatements.push(`INSERT INTO users (username, email, password_hash, display_name, role) VALUES
  ('admin', 'admin@example.com', '$2a$10$dummyhash', 'Administrator', 'admin')`);

    // 分类
    sqlStatements.push(`INSERT INTO categories (name, slug, description) VALUES
  ('未分类', 'uncategorized', '默认分类'),
  ('技术', 'tech', '技术相关文章'),
  ('生活', 'life', '生活随笔'),
  ('分享', 'share', '资源分享')`);

    // 标签
    sqlStatements.push(`INSERT INTO tags (name, slug) VALUES
  ('折腾', 'tinkering'),
  ('教程', 'tutorial'),
  ('测评', 'review'),
  ('VPS', 'vps'),
  ('前端', 'frontend')`);

    // 示例文章
    sqlStatements.push(`INSERT INTO threads (title, slug, content, excerpt, thumbnail, author_id, status, view_count, published_at) VALUES
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
  )`);

    // 文章分类关联
    sqlStatements.push(`INSERT INTO thread_categories (thread_id, category_id) VALUES
  (1, 2),
  (1, 4),
  (2, 2),
  (3, 4)`);

    // 文章标签关联
    sqlStatements.push(`INSERT INTO thread_tags (thread_id, tag_id) VALUES
  (1, 1),
  (1, 3),
  (2, 3),
  (2, 4),
  (3, 2)`);

    // 示例评论
    sqlStatements.push(`INSERT INTO comments (thread_id, author_name, author_email, content, status, location, os, browser, created_at) VALUES
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
  )`);

    // 站点设置
    sqlStatements.push(`INSERT INTO settings (key, value, type, description, group_name) VALUES
  ('site_title', '没有小家', 'string', '站点标题', 'general'),
  ('site_subtitle', '又一个 WordPress 站点', 'string', '站点副标题', 'general'),
  ('site_url', 'https://blogs.zuichu.de', 'string', '站点地址', 'general'),
  ('admin_email', 'admin@example.com', 'string', '管理员邮箱', 'general'),
  ('site_language', 'zh_CN', 'string', '站点语言', 'general'),
  ('allow_registration', 'false', 'boolean', '允许用户注册', 'general'),
  ('default_user_role', 'subscriber', 'string', '新用户默认角色', 'general'),
  ('threads_per_page', '10', 'number', '每页显示文章数', 'general'),
  ('comment_status', 'open', 'string', '评论状态', 'general'),
  ('comment_moderation', 'true', 'boolean', '评论需要审核', 'general')`);

    // 导航菜单
    sqlStatements.push(`INSERT INTO navigation (label, path, icon, is_home, sort_order, position) VALUES
  ('主菜单', '/', NULL, 1, 1, 'header'),
  ('归档', '/category', '📚', 0, 2, 'header'),
  ('关于', '/about', '✨', 0, 3, 'header'),
  ('友链', '/friends', '💝', 0, 4, 'header')`);

    // 友情链接
    sqlStatements.push(`INSERT INTO friends (name, url, avatar, description, sort_order) VALUES
  ('Example Blog', 'https://example.com', 'https://via.placeholder.com/50', '一个很棒的博客', 1),
  ('Tech Site', 'https://techsite.com', 'https://via.placeholder.com/50', '技术分享网站', 2)`);

    // 更新计数器
    sqlStatements.push(`UPDATE threads SET comment_count = (
  SELECT COUNT(*) FROM comments WHERE comments.thread_id = threads.id AND comments.status = 'approved'
)`);

    sqlStatements.push(`UPDATE categories SET thread_count = (
  SELECT COUNT(*) FROM thread_categories WHERE thread_categories.category_id = categories.id
)`);

    sqlStatements.push(`UPDATE tags SET thread_count = (
  SELECT COUNT(*) FROM thread_tags WHERE thread_tags.tag_id = tags.id
)`);

    sqlStatements.push(`UPDATE comments SET reply_count = (
  SELECT COUNT(*) FROM comments AS c WHERE c.parent_id = comments.id
)`);

    // 根文件夹
    sqlStatements.push(`INSERT OR IGNORE INTO folders (name, path, parent_path) VALUES ('root', '/', NULL)`);

    console.log(`📝 准备执行 ${sqlStatements.length} 条 SQL 语句`);

    // 使用 batch 执行所有语句（自动在事务中执行）
    const batch = sqlStatements.map(stmt => env.DB.prepare(stmt));
    const results = await env.DB.batch(batch);

    console.log(`✅ 基础表和数据创建成功，执行了 ${results.length} 条语句`);

    console.log('ℹ️  触发器逻辑已在应用层实现：');
    console.log('   - 文章更新时间：threads/[id].js 自动设置 updated_at');
    console.log('   - 评论计数更新：comments.js 和 admin/comments/[id].js 处理');
    console.log('   - 回复计数更新：comments.js 和 admin/comments/[id].js 处理');

    console.log(`✅ 数据库初始化完成！`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `数据库初始化完成，执行了 ${results.length} 条 SQL 语句。触发器逻辑已在应用层实现。`,
        statements: results.length,
        note: '触发器逻辑已移至应用代码层，无需数据库触发器'
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: '数据库初始化失败'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
