/**
 * Cloudflare Pages Function - Single Category API
 * DELETE /api/categories/:id - 删除分类
 */

// 删除分类
export async function onRequestDelete(context) {
  const { env, params } = context;
  const { id } = params;

  try {
    // 检查分类是否存在
    const { results: categories } = await env.DB.prepare(
      'SELECT id, name FROM categories WHERE id = ?'
    ).bind(id).all();

    if (categories.length === 0) {
      return new Response(
        JSON.stringify({ error: '分类不存在' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 检查是否有文章使用此分类
    const { results: threadCategories } = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM thread_categories WHERE category_id = ?'
    ).bind(id).all();

    if (threadCategories[0].count > 0) {
      return new Response(
        JSON.stringify({
          error: `无法删除分类"${categories[0].name}"，因为有 ${threadCategories[0].count} 篇文章正在使用该分类`
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 删除分类
    await env.DB.prepare(
      'DELETE FROM categories WHERE id = ?'
    ).bind(id).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: '分类已删除'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error deleting category:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
