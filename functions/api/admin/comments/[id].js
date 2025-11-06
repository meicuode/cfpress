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

    // 获取评论的当前状态和关联的文章ID
    const { results: comments } = await env.DB.prepare(
      'SELECT status, thread_id FROM comments WHERE id = ?'
    ).bind(id).all();

    if (comments.length === 0) {
      return new Response(
        JSON.stringify({ error: '评论不存在' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const oldStatus = comments[0].status;
    const threadId = comments[0].thread_id;

    // 更新评论状态
    await env.DB.prepare(
      'UPDATE comments SET status = ? WHERE id = ?'
    ).bind(status, id).run();

    // 应用层实现触发器逻辑：更新文章评论数
    // 如果状态从 approved 变为其他状态，减少计数
    if (oldStatus === 'approved' && status !== 'approved') {
      await env.DB.prepare(
        'UPDATE threads SET comment_count = comment_count - 1 WHERE id = ? AND comment_count > 0'
      ).bind(threadId).run();
    }
    // 如果状态从其他状态变为 approved，增加计数
    else if (oldStatus !== 'approved' && status === 'approved') {
      await env.DB.prepare(
        'UPDATE threads SET comment_count = comment_count + 1 WHERE id = ?'
      ).bind(threadId).run();
    }

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
    // 获取评论信息（状态和关联的文章ID），用于更新计数
    const { results: comments } = await env.DB.prepare(
      'SELECT status, thread_id, parent_id FROM comments WHERE id = ?'
    ).bind(id).all();

    if (comments.length === 0) {
      return new Response(
        JSON.stringify({ error: '评论不存在' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const comment = comments[0];

    // 删除评论
    await env.DB.prepare(
      'DELETE FROM comments WHERE id = ?'
    ).bind(id).run();

    // 应用层实现触发器逻辑：如果删除的是已批准的评论，减少文章评论数
    if (comment.status === 'approved') {
      await env.DB.prepare(
        'UPDATE threads SET comment_count = comment_count - 1 WHERE id = ? AND comment_count > 0'
      ).bind(comment.thread_id).run();
    }

    // 如果删除的是回复评论，更新父评论的回复数
    if (comment.parent_id) {
      await env.DB.prepare(
        'UPDATE comments SET reply_count = reply_count - 1 WHERE id = ? AND reply_count > 0'
      ).bind(comment.parent_id).run();
    }

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
