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
