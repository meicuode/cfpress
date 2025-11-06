/**
 * 文件夹管理 API
 * POST /api/admin/files/folders - 创建文件夹
 * GET /api/admin/files/folders - 获取文件夹列表
 */

// POST - 创建文件夹
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { name, parentPath = '/' } = body;

    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: '文件夹名称不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanParentPath = parentPath === '/' ? '' : parentPath.replace(/\/$/, '');
    const fullPath = cleanParentPath ? `${cleanParentPath}/${name}` : `/${name}`;

    const existing = await env.DB.prepare(`
      SELECT id FROM folders WHERE path = ?
    `).bind(fullPath).first();

    if (existing) {
      return new Response(JSON.stringify({ error: '文件夹已存在' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.DB.prepare(`
      INSERT INTO folders (name, path, parent_path)
      VALUES (?, ?, ?)
    `).bind(name, fullPath, parentPath).run();

    return new Response(JSON.stringify({
      success: true,
      folder: {
        id: result.meta.last_row_id,
        name,
        path: fullPath,
        parentPath
      },
      message: '文件夹已创建'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('创建文件夹错误:', error);
    return new Response(JSON.stringify({
      error: '创建文件夹失败',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET - 获取文件夹列表
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const parentPath = url.searchParams.get('parentPath') || '/';

  try {
    const folders = await env.DB.prepare(`
      SELECT id, name, path, parent_path, created_at, updated_at
      FROM folders
      WHERE parent_path = ?
      ORDER BY name ASC
    `).bind(parentPath).all();

    return new Response(JSON.stringify({
      success: true,
      parentPath,
      folders: folders.results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('获取文件夹列表错误:', error);
    return new Response(JSON.stringify({
      error: '获取文件夹列表失败',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
