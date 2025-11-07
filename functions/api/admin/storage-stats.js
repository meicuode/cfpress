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

    // 获取 R2 操作统计（需要 CLOUDFLARE_API_TOKEN 和 ACCOUNT_ID）
    let r2Operations = null;
    if (env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_ACCOUNT_ID && env.R2_BUCKET_NAME) {
      try {
        // 使用 GraphQL Analytics API 查询 R2 操作次数
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // 最近7天

        const graphqlQuery = {
          query: `
            query {
              viewer {
                accounts(filter: { accountTag: "${env.CLOUDFLARE_ACCOUNT_ID}" }) {
                  r2OperationsAdaptiveGroups(
                    filter: {
                      date_geq: "${startDate.toISOString().split('T')[0]}"
                      date_leq: "${endDate.toISOString().split('T')[0]}"
                      bucketName: "${env.R2_BUCKET_NAME}"
                    }
                    limit: 1000
                  ) {
                    sum {
                      requests
                    }
                    dimensions {
                      actionType
                    }
                  }
                }
              }
            }
          `
        };

        const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(graphqlQuery)
        });

        if (response.ok) {
          const data = await response.json();
          const operations = data?.data?.viewer?.accounts?.[0]?.r2OperationsAdaptiveGroups || [];

          // 汇总操作次数
          let totalOperations = 0;
          const operationsByType = {};

          operations.forEach(op => {
            const count = op.sum.requests || 0;
            const type = op.dimensions.actionType;
            totalOperations += count;
            operationsByType[type] = (operationsByType[type] || 0) + count;
          });

          r2Operations = {
            totalLast7Days: totalOperations,
            byType: operationsByType
          };
        }
      } catch (error) {
        console.error('获取 R2 操作统计失败:', error);
        // 失败时不影响其他统计数据的返回
      }
    }

    return new Response(JSON.stringify({
      success: true,
      stats: {
        totalFiles: filesCountResult?.count || 0,
        totalFolders: foldersCountResult?.count || 0,
        usedSpace: usedSpace,
        totalSpace: totalSpace,
        usagePercent: totalSpace > 0 ? (usedSpace / totalSpace * 100).toFixed(2) : 0,
        fileTypes: fileTypeStats.results || [],
        r2Operations: r2Operations
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
      error: '获取存储统计失败',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
