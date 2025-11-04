/**
 * Temporary API to initialize navigation table
 * GET /api/init-navigation
 */

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // Create navigation table
    await env.DB.prepare(`
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
      )
    `).run();

    // Create indexes
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_navigation_parent_id ON navigation(parent_id)').run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_navigation_position ON navigation(position)').run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_navigation_sort_order ON navigation(sort_order)').run();

    // Insert initial data
    await env.DB.prepare(`
      INSERT INTO navigation (label, path, icon, is_home, sort_order, position)
      VALUES
        ('主菜单', '/', NULL, 1, 1, 'header'),
        ('归档', '/category', '📚', 0, 2, 'header'),
        ('关于', '/about', '✨', 0, 3, 'header'),
        ('友链', '/friends', '💝', 0, 4, 'header')
    `).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Navigation table initialized successfully'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error initializing navigation:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
