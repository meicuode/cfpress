/**
 * 文件操作 API
 * DELETE /api/admin/files/:id - 删除文件
 * PUT /api/admin/files/:id - 重命名/移动文件
 */

// DELETE - 删除文件
export async function onRequestDelete(context) {
  const { env, params } = context;
  const fileId = parseInt(params.id);

  try {
    const fileInfo = await env.DB.prepare(`
      SELECT * FROM files WHERE id = ? AND purged = 0
    `).bind(fileId).first();

    if (!fileInfo) {
      return new Response(JSON.stringify({ error: '文件不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.FILES.delete(fileInfo.r2_key);
    if (fileInfo.thumbnail_key) {
      await env.FILES.delete(fileInfo.thumbnail_key);
    }

    await env.DB.prepare(`
      UPDATE files
      SET purged = 1, purged_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(fileId).run();

    return new Response(JSON.stringify({ success: true, message: '文件已删除' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: '删除失败', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PUT - 重命名或移动文件
export async function onRequestPut(context) {
  const { request, env, params } = context;
  const fileId = parseInt(params.id);

  try {
    const body = await request.json();
    const { filename, path, expiresIn } = body;

    const updates = [];
    const params_arr = [];

    if (filename) {
      updates.push('filename = ?');
      params_arr.push(filename);
    }
    if (path) {
      updates.push('path = ?');
      params_arr.push(path);
    }
    if (expiresIn !== undefined) {
      if (expiresIn === null || expiresIn === 0) {
        updates.push('expires_at = NULL, is_expired = 0');
      } else {
        const expiresDate = new Date();
        expiresDate.setSeconds(expiresDate.getSeconds() + parseInt(expiresIn));
        updates.push('expires_at = ?, is_expired = 0');
        params_arr.push(expiresDate.toISOString());
      }
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: '没有需要更新的内容' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params_arr.push(fileId);

    await env.DB.prepare(`
      UPDATE files SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params_arr).run();

    return new Response(JSON.stringify({ success: true, message: '文件已更新' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: '更新失败', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
