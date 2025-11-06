/**
 * 文件夹操作 API
 * DELETE /api/admin/files/folders/:id - 删除文件夹
 * PUT /api/admin/files/folders/:id - 重命名文件夹
 */

// DELETE - 删除文件夹
export async function onRequestDelete(context) {
  const { env, params } = context;
  const folderId = parseInt(params.id);

  try {
    const folder = await env.DB.prepare(`
      SELECT * FROM folders WHERE id = ?
    `).bind(folderId).first();

    if (!folder) {
      return new Response(JSON.stringify({ error: '文件夹不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const hasSubFolders = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM folders WHERE parent_path = ?
    `).bind(folder.path).first();

    const hasFiles = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM files WHERE path = ? AND purged = 0
    `).bind(folder.path).first();

    if (hasSubFolders.count > 0 || hasFiles.count > 0) {
      return new Response(JSON.stringify({
        error: '文件夹不为空，无法删除',
        details: `包含 ${hasSubFolders.count} 个子文件夹和 ${hasFiles.count} 个文件`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.DB.prepare(`
      DELETE FROM folders WHERE id = ?
    `).bind(folderId).run();

    return new Response(JSON.stringify({
      success: true,
      message: '文件夹已删除'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('删除文件夹错误:', error);
    return new Response(JSON.stringify({
      error: '删除文件夹失败',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PUT - 重命名文件夹
export async function onRequestPut(context) {
  const { request, env, params } = context;
  const folderId = parseInt(params.id);

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: '文件夹名称不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const folder = await env.DB.prepare(`
      SELECT * FROM folders WHERE id = ?
    `).bind(folderId).first();

    if (!folder) {
      return new Response(JSON.stringify({ error: '文件夹不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const parentPath = folder.parent_path || '/';
    const cleanParentPath = parentPath === '/' ? '' : parentPath.replace(/\/$/, '');
    const newPath = cleanParentPath ? `${cleanParentPath}/${name}` : `/${name}`;

    const existing = await env.DB.prepare(`
      SELECT id FROM folders WHERE path = ? AND id != ?
    `).bind(newPath, folderId).first();

    if (existing) {
      return new Response(JSON.stringify({ error: '该名称的文件夹已存在' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.DB.prepare(`
      UPDATE folders
      SET name = ?, path = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(name, newPath, folderId).run();

    return new Response(JSON.stringify({
      success: true,
      folder: {
        id: folderId,
        name,
        path: newPath,
        parentPath
      },
      message: '文件夹已重命名'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('重命名文件夹错误:', error);
    return new Response(JSON.stringify({
      error: '重命名文件夹失败',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
