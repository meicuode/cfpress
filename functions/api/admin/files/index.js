/**
 * 文件列表 API
 * GET /api/admin/files?path=/&page=1&limit=50&type=all
 *
 * 支持：
 * - 按文件夹路径筛选
 * - 分页
 * - 按文件类型筛选（all/image/video/document）
 * - 排序
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    // 解析查询参数
    const path = url.searchParams.get('path') || '/';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const type = url.searchParams.get('type') || 'all'; // all, image, video, document
    const sortBy = url.searchParams.get('sortBy') || 'created_at'; // created_at, filename, size
    const sortOrder = url.searchParams.get('sortOrder') || 'DESC'; // ASC, DESC
    const search = url.searchParams.get('search') || ''; // 搜索文件名

    const offset = (page - 1) * limit;

    // 构建 WHERE 条件
    let whereConditions = ['purged = 0']; // 只显示未物理删除的文件
    let params = [];

    // 按路径筛选
    whereConditions.push('path = ?');
    params.push(path);

    // 按文件类型筛选
    if (type === 'image') {
      whereConditions.push('is_image = 1');
    } else if (type === 'video') {
      whereConditions.push('is_video = 1');
    } else if (type === 'document') {
      whereConditions.push('is_image = 0 AND is_video = 0');
    }

    // 搜索文件名
    if (search) {
      whereConditions.push('filename LIKE ?');
      params.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // 验证排序字段
    const validSortFields = ['created_at', 'filename', 'size', 'updated_at'];
    const validSortOrders = ['ASC', 'DESC'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // 查询文件列表
    const filesQuery = `
      SELECT
        id, filename, path, r2_key, size, mime_type, extension,
        is_image, is_video, thumbnail_key, upload_user,
        expires_at, is_expired, created_at, updated_at
      FROM files
      WHERE ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;

    const filesResult = await env.DB.prepare(filesQuery)
      .bind(...params, limit, offset)
      .all();

    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM files
      WHERE ${whereClause}
    `;

    const countResult = await env.DB.prepare(countQuery)
      .bind(...params)
      .first();

    const total = countResult.total || 0;
    const totalPages = Math.ceil(total / limit);

    // 查询当前路径的子文件夹
    const foldersResult = await env.DB.prepare(`
      SELECT id, name, path, created_at, updated_at
      FROM folders
      WHERE parent_path = ?
      ORDER BY name ASC
    `).bind(path).all();

    // 格式化文件信息
    const files = filesResult.results.map(file => ({
      id: file.id,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimeType: file.mime_type,
      extension: file.extension,
      isImage: Boolean(file.is_image),
      isVideo: Boolean(file.is_video),
      thumbnailUrl: file.thumbnail_key ? `/api/files/${file.thumbnail_key}` : null,
      uploadUser: file.upload_user,
      expiresAt: file.expires_at,
      isExpired: Boolean(file.is_expired),
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      url: `/api/files/${file.r2_key}`,
      downloadUrl: `/api/files/${file.r2_key}?download=1`
    }));

    // 格式化文件夹信息
    const folders = foldersResult.results.map(folder => ({
      id: folder.id,
      name: folder.name,
      path: folder.path,
      createdAt: folder.created_at,
      updatedAt: folder.updated_at
    }));

    return new Response(JSON.stringify({
      success: true,
      path,
      folders,
      files,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      },
      filters: {
        type,
        search,
        sortBy: safeSortBy,
        sortOrder: safeSortOrder
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('获取文件列表错误:', error);
    return new Response(JSON.stringify({
      error: '获取文件列表失败',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
