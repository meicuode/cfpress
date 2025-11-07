/**
 * 获取存储空间统计信息
 * GET /api/admin/storage-stats
 */
export async function onRequestGet({ env }) {
  try {
    const db = env.DB;

    // 获取总文件数
    const filesCountResult = await db.prepare(`
      SELECT COUNT(*) as count
      FROM files
      WHERE purged = 0
    `).first();

    // 获取文件夹数
    const foldersCountResult = await db.prepare(`
      SELECT COUNT(*) as count
      FROM folders
    `).first();

    // 获取已使用容量（所有未删除文件的总大小）
    const usedSpaceResult = await db.prepare(`
      SELECT SUM(size) as total_size
      FROM files
      WHERE purged = 0
    `).first();

    // 计算已使用容量
    const usedSpace = usedSpaceResult?.total_size || 0;

    // R2 免费套餐是 10GB，这里设置总容量
    // 如果是付费套餐，可以设置更大的值或者从配置读取
    const totalSpace = 10 * 1024 * 1024 * 1024; // 10GB in bytes

    // 按文件类型统计
    const fileTypeStats = await db.prepare(`
      SELECT
        CASE
          WHEN is_image = 1 THEN 'image'
          WHEN is_video = 1 THEN 'video'
          ELSE 'document'
        END as type,
        COUNT(*) as count,
        SUM(size) as total_size
      FROM files
      WHERE purged = 0
      GROUP BY type
    `).all();

    return new Response(JSON.stringify({
      success: true,
      stats: {
        totalFiles: filesCountResult?.count || 0,
        totalFolders: foldersCountResult?.count || 0,
        usedSpace: usedSpace,
        totalSpace: totalSpace,
        usagePercent: totalSpace > 0 ? (usedSpace / totalSpace * 100).toFixed(2) : 0,
        fileTypes: fileTypeStats.results || []
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('获取存储统计失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '获取存储统计失败'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
