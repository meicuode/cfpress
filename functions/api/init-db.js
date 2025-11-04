/**
 * 数据库初始化 API
 * GET /api/init-db - 初始化数据库（仅开发环境）
 */

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 读取 schema.sql 文件内容并执行
    // 注意：实际环境中应该从文件读取，这里我们直接写SQL语句

    const sqlStatements = `
      CREATE TABLE IF NOT EXISTS users (
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
      );

      CREATE TABLE IF NOT EXISTS threads (
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
      );

      CREATE TABLE IF NOT EXISTS categories (
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
      );

      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        thread_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS thread_categories (
        thread_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        PRIMARY KEY (thread_id, category_id)
      );

      CREATE TABLE IF NOT EXISTS thread_tags (
        thread_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (thread_id, tag_id)
      );

      CREATE TABLE IF NOT EXISTS comments (
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
      );

      INSERT OR IGNORE INTO users (id, username, email, password_hash, display_name, role) VALUES
        (1, 'admin', 'admin@example.com', '$2a$10$dummyhash', 'Administrator', 'admin'),
        (2, 'admin123', 'admin123@example.com', 'admin456', '系统管理员', 'admin');

      INSERT OR IGNORE INTO categories (id, name, slug, description) VALUES
        (1, '未分类', 'uncategorized', '默认分类'),
        (2, '技术', 'tech', '技术相关文章'),
        (3, '生活', 'life', '生活随笔'),
        (4, '分享', 'share', '资源分享');

      INSERT OR IGNORE INTO tags (id, name, slug) VALUES
        (1, '折腾', 'tinkering'),
        (2, '教程', 'tutorial'),
        (3, '测评', 'review'),
        (4, 'VPS', 'vps'),
        (5, '前端', 'frontend');

      CREATE TABLE IF NOT EXISTS friends (
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
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        type TEXT NOT NULL DEFAULT 'string',
        description TEXT,
        group_name TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS navigation (
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
      );

      CREATE TABLE IF NOT EXISTS media (
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
      );

      CREATE TABLE IF NOT EXISTS access_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        thread_id INTEGER,
        user_id INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        referer TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_threads_author_id ON threads(author_id);
      CREATE INDEX IF NOT EXISTS idx_threads_status ON threads(status);
      CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_threads_published_at ON threads(published_at DESC);
      CREATE INDEX IF NOT EXISTS idx_threads_slug ON threads(slug);
      CREATE INDEX IF NOT EXISTS idx_comments_thread_id ON comments(thread_id);
      CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
      CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
      CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
      CREATE INDEX IF NOT EXISTS idx_navigation_position ON navigation(position);
      CREATE INDEX IF NOT EXISTS idx_navigation_sort_order ON navigation(sort_order);

      INSERT OR IGNORE INTO navigation (label, path, icon, is_home, sort_order, position) VALUES
        ('主菜单', '/', NULL, 1, 1, 'header'),
        ('归档', '/category', '📚', 0, 2, 'header'),
        ('关于', '/about', '✨', 0, 3, 'header'),
        ('友链', '/friends', '💝', 0, 4, 'header');

      INSERT OR IGNORE INTO settings (key, value, type, description, group_name) VALUES
        ('site_title', '没有小家', 'string', '站点标题', 'general'),
        ('site_subtitle', '又一个 WordPress 站点', 'string', '站点副标题', 'general'),
        ('site_url', 'https://blogs.zuichu.de', 'string', '站点地址', 'general'),
        ('admin_email', 'admin@example.com', 'string', '管理员邮箱', 'general'),
        ('threads_per_page', '10', 'number', '每页显示文章数', 'general');

      INSERT OR IGNORE INTO friends (name, url, avatar, description, sort_order) VALUES
        ('Example Blog', 'https://example.com', 'https://via.placeholder.com/50', '一个很棒的博客', 1),
        ('Tech Site', 'https://techsite.com', 'https://via.placeholder.com/50', '技术分享网站', 2);

      INSERT INTO threads (title, slug, content, excerpt, thumbnail, author_id, status, view_count, comment_count, published_at, created_at) VALUES
        ('一年只需 10 HKD 的香港保号卡 hahaSIM 开箱测评', 'hahasim-review', '<p>本周六凌晨正好看了 10 传后，开着窗门看到了北极光...</p><h2>开箱体验</h2><p>收到卡片后的第一印象...</p>', '本周六凌晨正好看了 10 传后，开着窗门看到了北极光。这是一篇关于 hahaSIM 的详细测评文章。', 'https://via.placeholder.com/240x218/4a9eff/ffffff?text=hahaSIM', 1, 'publish', 770, 2, '2025-03-18T10:00:00Z', '2025-03-18T10:00:00Z'),
        ('近乎于手动的华为云 2H1G 香港小鸡只测不评', 'huawei-cloud-hk-test', '<p>华为云香港服务器测试报告...</p>', '华为云香港 2核1G 服务器性能测试报告。', 'https://via.placeholder.com/240x218/6dd47e/ffffff?text=Huawei', 1, 'publish', 1025, 0, '2024-11-26T08:30:00Z', '2024-11-26T08:30:00Z'),
        ('论如何下载 Apple Music 的 ALAC 格式音乐', 'apple-music-alac', '<p>分享下载高品质音乐的方法...</p>', '分享如何下载 Apple Music 无损音乐格式 ALAC。', 'https://via.placeholder.com/240x218/ff6b6b/ffffff?text=Music', 1, 'publish', 892, 0, '2024-10-15T14:20:00Z', '2024-10-15T14:20:00Z');

      INSERT INTO thread_categories (thread_id, category_id) VALUES (1, 2), (1, 4), (2, 2), (3, 4);
      INSERT INTO thread_tags (thread_id, tag_id) VALUES (1, 1), (1, 3), (2, 3), (2, 4), (3, 2);

      UPDATE categories SET thread_count = 2 WHERE id = 2;
      UPDATE categories SET thread_count = 2 WHERE id = 4;
      UPDATE tags SET thread_count = 1 WHERE id = 1;
      UPDATE tags SET thread_count = 1 WHERE id = 2;
      UPDATE tags SET thread_count = 2 WHERE id = 3;
      UPDATE tags SET thread_count = 1 WHERE id = 4;

      INSERT INTO comments (thread_id, author_name, author_email, content, status, location, os, browser, created_at) VALUES
        (1, '五行缺失', 'user1@example.com', '建站一直用的阿里云，华为云还真没有用过', 'approved', '加利福尼亚', 'Windows 7', 'Chrome 86', '2025-05-10T09:00:00Z'),
        (1, '用户B', 'user2@example.com', '请问在哪里购买？', 'approved', '北京', 'macOS', 'Safari 16', '2025-03-20T15:30:00Z');
    `;

    // 分割并执行每个SQL语句
    const statements = sqlStatements
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    const errors = [];
    for (const statement of statements) {
      try {
        await env.DB.prepare(statement).run();
        successCount++;
        console.log(`✓ Executed: ${statement.substring(0, 50)}...`);
      } catch (error) {
        console.error(`✗ Failed: ${statement.substring(0, 50)}...`, error.message);
        errors.push({ statement: statement.substring(0, 100), error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `数据库初始化完成，执行了 ${successCount} 条语句`,
        errors: errors.length > 0 ? errors : undefined,
        note: '此接口仅用于开发环境'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Database initialization error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
