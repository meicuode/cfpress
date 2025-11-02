/**
 * Cloudflare Pages Function - Comments API
 * GET /api/comments?thread_id=:id - 获取文章评论列表
 * POST /api/comments - 创建新评论
 */

import { parseUserAgent } from '../utils/parseUserAgent.js';

// 获取评论列表
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const threadId = url.searchParams.get('thread_id');

  if (!threadId) {
    return new Response(
      JSON.stringify({ error: '缺少 thread_id 参数' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // 获取该文章的所有已批准评论，按时间倒序
    const { results: comments } = await env.DB.prepare(`
      SELECT *
      FROM comments
      WHERE thread_id = ? AND status = 'approved'
      ORDER BY created_at DESC
    `).bind(threadId).all();

    return new Response(
      JSON.stringify({ comments }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching comments:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// 创建新评论
export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const body = await request.json();
    const {
      thread_id,
      author_name,
      author_email,
      author_website,
      content,
      parent_id
    } = body;

    // 验证必填字段
    if (!thread_id || !author_name || !author_email || !content) {
      return new Response(
        JSON.stringify({ error: '缺少必填字段' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 验证文章是否存在
    const { results: threads } = await env.DB.prepare(
      'SELECT id, comment_status FROM threads WHERE id = ?'
    ).bind(thread_id).all();

    if (threads.length === 0) {
      return new Response(
        JSON.stringify({ error: '文章不存在' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (threads[0].comment_status !== 'open') {
      return new Response(
        JSON.stringify({ error: '该文章已关闭评论' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 获取请求的一些元信息
    const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Real-IP') || '';
    const userAgent = request.headers.get('User-Agent') || '';

    // 解析 User-Agent
    const { browser, os, device } = parseUserAgent(userAgent);

    // 获取 Cloudflare 地理位置信息
    const cf = request.cf || {};
    const country = cf.country || '';
    const city = cf.city || '';
    const region = cf.region || '';

    // 组合地理位置信息
    let location = '未知';
    if (city && country) {
      location = region ? `${country} ${region} ${city}` : `${country} ${city}`;
    } else if (country) {
      location = country;
    }

    // 插入评论（状态默认为 approved，实际项目中可能需要审核）
    const result = await env.DB.prepare(`
      INSERT INTO comments (
        thread_id, parent_id, author_name, author_email, author_website,
        content, status, ip_address, user_agent, location, os, browser, device, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      thread_id,
      parent_id || null,
      author_name,
      author_email,
      author_website || null,
      content,
      'approved', // 自动批准，实际项目中可能需要设为 'pending'
      ip,
      userAgent,
      location,
      os,
      browser,
      device,
      new Date().toISOString()
    ).run();

    const commentId = result.meta.last_row_id;

    // 更新文章的评论数
    await env.DB.prepare(
      'UPDATE threads SET comment_count = comment_count + 1 WHERE id = ?'
    ).bind(thread_id).run();

    // 如果是回复评论，更新父评论的回复数
    if (parent_id) {
      await env.DB.prepare(
        'UPDATE comments SET reply_count = reply_count + 1 WHERE id = ?'
      ).bind(parent_id).run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '评论已发布',
        commentId
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error creating comment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
