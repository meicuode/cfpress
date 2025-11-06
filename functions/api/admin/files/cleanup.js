/**
 * 过期文件清理 API
 * POST /api/admin/files/cleanup - 手动触发清理
 *
 * 也可以通过 Cloudflare Cron Triggers 定时调用
 */

export async function onRequestPost(context) {
  const { env } = context;

  try {
    const now = new Date().toISOString();
    let cleanedCount = 0;
    let errors = [];

    // 查找所有过期但未物理删除的文件
    const expiredFiles = await env.DB.prepare(`
      SELECT id, r2_key, thumbnail_key, filename
      FROM files
      WHERE expires_at IS NOT NULL
        AND expires_at <= ?
        AND purged = 0
      LIMIT 100
    `).bind(now).all();

    console.log(`找到 ${expiredFiles.results.length} 个过期文件需要清理`);

    // 逐个删除
    for (const file of expiredFiles.results) {
      try {
        // 从 R2 删除主文件
        await env.FILES.delete(file.r2_key);

        // 如果有缩略图也删除
        if (file.thumbnail_key) {
          await env.FILES.delete(file.thumbnail_key);
        }

        // 标记为已物理删除
        await env.DB.prepare(`
          UPDATE files
          SET purged = 1, is_expired = 1, purged_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(file.id).run();

        cleanedCount++;
        console.log(`已清理: ${file.filename} (ID: ${file.id})`);

      } catch (error) {
        console.error(`清理文件 ${file.filename} 失败:`, error);
        errors.push({
          fileId: file.id,
          filename: file.filename,
          error: error.message
        });

        // 即使 R2 删除失败，也标记为已过期
        await env.DB.prepare(`
          UPDATE files
          SET is_expired = 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(file.id).run();
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `清理完成`,
      cleaned: cleanedCount,
      total: expiredFiles.results.length,
      errors: errors.length > 0 ? errors : undefined
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('清理过期文件错误:', error);
    return new Response(JSON.stringify({
      error: '清理失败',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET - 获取过期文件统计
export async function onRequestGet(context) {
  const { env } = context;

  try {
    const now = new Date().toISOString();

    // 统计过期但未清理的文件
    const stats = await env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(size) as totalSize
      FROM files
      WHERE expires_at IS NOT NULL
        AND expires_at <= ?
        AND purged = 0
    `).bind(now).first();

    // 统计即将过期的文件（24小时内）
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    const tomorrowISO = tomorrow.toISOString();

    const upcoming = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM files
      WHERE expires_at IS NOT NULL
        AND expires_at > ?
        AND expires_at <= ?
        AND purged = 0
    `).bind(now, tomorrowISO).first();

    return new Response(JSON.stringify({
      success: true,
      expired: {
        count: stats.total || 0,
        totalSize: stats.totalSize || 0
      },
      expiringSoon: {
        count: upcoming.count || 0
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('获取过期文件统计错误:', error);
    return new Response(JSON.stringify({
      error: '获取统计失败',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
