/**
 * 数据库迁移 API - 添加图片缩略图支持
 * GET /api/migrate-image-thumbnails
 *
 * 为 files 表添加缩略图相关字段
 */

export async function onRequestGet(context) {
  const { env } = context;

  try {
    console.log('🔄 开始执行图片缩略图迁移...');

    const migrations = [];

    // 检查字段是否已存在
    const tableInfo = await env.DB.prepare(`
      PRAGMA table_info(files)
    `).all();

    const existingColumns = tableInfo.results.map(col => col.name);
    console.log('现有字段:', existingColumns);

    // 添加新字段（只添加不存在的字段）
    if (!existingColumns.includes('width')) {
      migrations.push(`ALTER TABLE files ADD COLUMN width INTEGER`);
    }

    if (!existingColumns.includes('height')) {
      migrations.push(`ALTER TABLE files ADD COLUMN height INTEGER`);
    }

    if (!existingColumns.includes('thumbnail_r2_key')) {
      migrations.push(`ALTER TABLE files ADD COLUMN thumbnail_r2_key TEXT`);
    }

    if (!existingColumns.includes('medium_r2_key')) {
      migrations.push(`ALTER TABLE files ADD COLUMN medium_r2_key TEXT`);
    }

    if (!existingColumns.includes('has_thumbnails')) {
      migrations.push(`ALTER TABLE files ADD COLUMN has_thumbnails INTEGER DEFAULT 0`);
    }

    if (migrations.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: '所有字段已存在，无需迁移'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 执行迁移
    for (const sql of migrations) {
      console.log(`执行: ${sql}`);
      await env.DB.prepare(sql).run();
    }

    // 创建索引
    try {
      await env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_files_has_thumbnails ON files(has_thumbnails)
      `).run();

      await env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_files_is_image ON files(is_image)
      `).run();

      console.log('✅ 索引创建成功');
    } catch (indexError) {
      console.log('索引可能已存在:', indexError.message);
    }

    console.log('✅ 迁移完成');

    return new Response(JSON.stringify({
      success: true,
      message: '图片缩略图迁移成功',
      migrationsExecuted: migrations.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('迁移失败:', error);
    return new Response(JSON.stringify({
      error: '迁移失败',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
