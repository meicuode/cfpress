/**
 * Cloudflare Pages Function - Comment Like API
 * POST /api/comments/[id]/like - 给评论点赞
 */

export async function onRequestPost(context) {
  const { env, params } = context;
  const commentId = params.id;

  if (!commentId) {
    return new Response(
      JSON.stringify({ error: '缺少评论 ID' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // 检查评论是否存在
    const { results: comments } = await env.DB.prepare(
      'SELECT id, like_count FROM comments WHERE id = ?'
    ).bind(commentId).all();

    if (comments.length === 0) {
      return new Response(
        JSON.stringify({ error: '评论不存在' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 增加点赞数
    await env.DB.prepare(
      'UPDATE comments SET like_count = like_count + 1 WHERE id = ?'
    ).bind(commentId).run();

    // 获取更新后的点赞数
    const { results: updated } = await env.DB.prepare(
      'SELECT like_count FROM comments WHERE id = ?'
    ).bind(commentId).all();

    return new Response(
      JSON.stringify({
        success: true,
        message: '点赞成功',
        likeCount: updated[0].like_count
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error liking comment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
