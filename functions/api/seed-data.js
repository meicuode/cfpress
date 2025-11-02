/**
 * 种子数据 API - 用于开发测试
 * GET /api/seed-data - 生成测试文章和评论
 */

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const testArticles = [
      {
        title: '如何使用 Cloudflare Pages 部署前端项目',
        content: 'Cloudflare Pages 是一个优秀的静态网站托管平台，支持自动部署、全球 CDN、自定义域名等功能。本文将介绍如何使用 Cloudflare Pages 部署前端项目。\n\n首先，你需要在 Cloudflare 上创建一个账户，然后连接你的 GitHub 仓库。配置好构建命令和输出目录后，Cloudflare Pages 会自动监听你的仓库变化，每次 push 代码后自动部署。\n\n部署过程非常简单，只需几分钟即可完成。而且 Cloudflare 的全球 CDN 网络能确保你的网站在世界各地都能快速访问。',
        excerpt: 'Cloudflare Pages 是一个优秀的静态网站托管平台，本文介绍如何使用它部署前端项目。',
        categories: [2],
        tags: ['Cloudflare', '前端', '部署'],
        thumbnail: 'https://via.placeholder.com/240x218/4a9eff/ffffff?text=Cloudflare'
      },
      {
        title: 'D1 数据库使用指南：轻量级的 SQLite 解决方案',
        content: 'Cloudflare D1 是基于 SQLite 的分布式数据库，非常适合用于边缘计算场景。它提供了熟悉的 SQL 接口，支持事务、索引等特性。\n\n使用 D1 的优势在于它与 Cloudflare Workers 和 Pages Functions 完美集成，可以在全球边缘节点上运行，大大降低数据库访问延迟。\n\n本文将介绍 D1 的基本使用方法，包括如何创建数据库、执行查询、处理事务等。',
        excerpt: 'Cloudflare D1 是基于 SQLite 的分布式数据库，本文介绍其基本使用方法。',
        categories: [2],
        tags: ['D1', '数据库', 'SQLite'],
        thumbnail: 'https://via.placeholder.com/240x218/6dd47e/ffffff?text=D1+Database'
      },
      {
        title: 'React Hooks 最佳实践',
        content: 'React Hooks 改变了我们编写 React 组件的方式，让函数组件也能拥有状态和生命周期。本文总结了一些使用 Hooks 的最佳实践。\n\n1. 使用 useState 管理组件状态\n2. 使用 useEffect 处理副作用\n3. 自定义 Hook 复用逻辑\n4. 使用 useMemo 和 useCallback 优化性能\n\n掌握这些最佳实践能帮助你写出更简洁、更高效的 React 代码。',
        excerpt: 'React Hooks 改变了组件编写方式，本文总结使用 Hooks 的最佳实践。',
        categories: [2],
        tags: ['React', '前端', 'JavaScript'],
        thumbnail: 'https://via.placeholder.com/240x218/61dafb/ffffff?text=React'
      },
      {
        title: '我的编程学习之路',
        content: '从第一次接触编程到现在已经5年了，这5年里经历了很多，也学到了很多。今天想和大家分享一下我的编程学习经历。\n\n最开始学的是 Python，被它简洁的语法吸引。后来接触了前端开发，学习了 HTML、CSS、JavaScript。再后来深入学习了 React、Vue 等框架。\n\n学习编程最重要的是动手实践，不要只看教程不写代码。多做项目，多解决实际问题，这样才能真正掌握技术。',
        excerpt: '分享我5年来的编程学习经历和心得体会。',
        categories: [3],
        tags: ['学习', '编程', '分享'],
        thumbnail: 'https://via.placeholder.com/240x218/ff6b6b/ffffff?text=Learning'
      },
      {
        title: 'Tailwind CSS 实战技巧',
        content: 'Tailwind CSS 是一个功能类优先的 CSS 框架，它提供了大量预定义的工具类，让你能快速构建现代化的用户界面。\n\n使用 Tailwind 的好处：\n- 不需要命名 CSS 类\n- 响应式设计变得简单\n- 自带设计系统\n- 生产环境自动清除未使用的样式\n\n本文分享一些 Tailwind CSS 的实战技巧，帮助你更高效地使用这个框架。',
        excerpt: 'Tailwind CSS 是功能类优先的 CSS 框架，本文分享实战技巧。',
        categories: [2, 4],
        tags: ['CSS', 'Tailwind', '前端'],
        thumbnail: 'https://via.placeholder.com/240x218/38bdf8/ffffff?text=Tailwind'
      },
      {
        title: '2024年值得关注的前端技术趋势',
        content: '2024年前端领域继续快速发展，一些新技术和趋势值得我们关注。\n\n1. Server Components - React 18 引入的新特性\n2. 边缘计算 - Cloudflare Workers、Vercel Edge Functions\n3. TypeScript 的普及 - 类型安全越来越重要\n4. Web Assembly - 在浏览器中运行高性能代码\n5. 构建工具的进化 - Vite、Turbopack 等新工具\n\n这些技术趋势将影响未来几年的前端开发方式。',
        excerpt: '盘点2024年值得关注的前端技术趋势。',
        categories: [2, 4],
        tags: ['前端', '技术趋势', '分享'],
        thumbnail: 'https://via.placeholder.com/240x218/a78bfa/ffffff?text=2024+Trends'
      }
    ];

    const comments = [
      ['这篇文章写得很好，对我帮助很大！', '感谢分享，学到了很多。', '赞同作者的观点。'],
      ['D1看起来很不错，准备试试。', '请问性能如何？', '能否分享一下实际使用经验？', '感谢详细的介绍。'],
      ['Hooks确实改变了React开发方式。', '自定义Hook这部分讲得很清楚。'],
      ['加油！', '很励志的分享。', '我也在学习编程，共勉！', '5年就这么厉害了，佩服。'],
      ['Tailwind真是太好用了。', '之前一直用Bootstrap，看完准备换Tailwind了。', '实用的技巧。'],
      ['前端发展太快了。', 'Server Components很期待。', '边缘计算确实是趋势。', 'TypeScript是必学的。', '感谢总结。']
    ];

    const commentAuthors = [
      { name: '张三', email: 'zhangsan@example.com' },
      { name: '李四', email: 'lisi@example.com' },
      { name: '王五', email: 'wangwu@example.com' },
      { name: '赵六', email: 'zhaoliu@example.com' },
      { name: '小明', email: 'xiaoming@example.com' }
    ];

    let createdCount = 0;
    let commentCount = 0;

    for (let i = 0; i < testArticles.length; i++) {
      const article = testArticles[i];

      // 创建文章
      const baseSlug = article.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 80);
      const slug = (baseSlug || 'article') + `-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`;
      const result = await env.DB.prepare(`
        INSERT INTO threads (
          title, slug, content, excerpt, thumbnail,
          author_id, status, published_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        article.title,
        slug,
        article.content,
        article.excerpt,
        article.thumbnail || null,
        1,
        'publish',
        new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(), // 按天递减的发布时间
        new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString()
      ).run();

      const threadId = result.meta.last_row_id;
      createdCount++;

      // 添加分类
      for (const categoryId of article.categories) {
        await env.DB.prepare(
          'INSERT INTO thread_categories (thread_id, category_id) VALUES (?, ?)'
        ).bind(threadId, categoryId).run();

        await env.DB.prepare(
          'UPDATE categories SET thread_count = thread_count + 1 WHERE id = ?'
        ).bind(categoryId).run();
      }

      // 添加标签
      for (const tagName of article.tags) {
        let tagId;
        const { results: existingTags } = await env.DB.prepare(
          'SELECT id FROM tags WHERE name = ?'
        ).bind(tagName).all();

        if (existingTags.length > 0) {
          tagId = existingTags[0].id;
          await env.DB.prepare(
            'UPDATE tags SET thread_count = thread_count + 1 WHERE id = ?'
          ).bind(tagId).run();
        } else {
          const tagSlug = tagName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || `tag-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const tagResult = await env.DB.prepare(
            'INSERT INTO tags (name, slug, thread_count) VALUES (?, ?, 1)'
          ).bind(tagName, tagSlug).run();
          tagId = tagResult.meta.last_row_id;
        }

        await env.DB.prepare(
          'INSERT INTO thread_tags (thread_id, tag_id) VALUES (?, ?)'
        ).bind(threadId, tagId).run();
      }

      // 添加评论
      const articleComments = comments[i];
      const numComments = articleComments.length;

      for (let j = 0; j < numComments; j++) {
        const author = commentAuthors[j % commentAuthors.length];
        await env.DB.prepare(`
          INSERT INTO comments (
            thread_id, author_name, author_email, content, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          threadId,
          author.name,
          author.email,
          articleComments[j],
          'approved',
          new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000 + j * 60 * 60 * 1000).toISOString()
        ).run();
        commentCount++;
      }

      // 更新文章评论数
      await env.DB.prepare(
        'UPDATE threads SET comment_count = ? WHERE id = ?'
      ).bind(numComments, threadId).run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `成功创建 ${createdCount} 篇文章和 ${commentCount} 条评论`,
        articles: createdCount,
        comments: commentCount
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error seeding data:', error);
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
