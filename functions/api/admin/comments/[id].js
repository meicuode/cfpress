/**
 * Cloudflare Pages Function - Admin Single Comment API
 * PUT /api/admin/comments/:id - 更新评论状态
 * DELETE /api/admin/comments/:id - 删除评论
 */

// 更新评论状态
export async function onRequestPut(context) {
  const { env, params, request } = context;
  const { id } = params;

  try {
    const body = await request.json();
    const { status } = body;

    if (!['approved', 'pending', 'spam', 'trash'].includes(status)) {
      return new Response(
        JSON.stringify({ error: '无效的状态值' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    await env.DB.prepare(
      'UPDATE comments SET status = ? WHERE id = ?'
    ).bind(status, id).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: '评论状态已更新'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error updating comment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// 删除评论
export async function onRequestDelete(context) {
  const { env, params } = context;
  const { id } = params;

  try {
    await env.DB.prepare(
      'DELETE FROM comments WHERE id = ?'
    ).bind(id).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: '评论已删除'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error deleting comment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
