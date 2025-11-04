/**
 * Admin Settings API
 * GET /api/admin/settings - 获取站点设置
 * POST /api/admin/settings - 保存站点设置
 */

// 获取站点设置
export async function onRequestGet(context) {
  const { env } = context;

  try {
    const { results: settings } = await env.DB.prepare(`
      SELECT key, value, type
      FROM settings
    `).all();

    // 转换为对象格式
    const settingsObj = {};
    settings.forEach(setting => {
      let value = setting.value;

      // 根据类型转换值
      if (setting.type === 'boolean') {
        value = value === 'true' || value === '1';
      } else if (setting.type === 'number') {
        value = parseInt(value) || 0;
      }

      settingsObj[setting.key] = value;
    });

    return new Response(
      JSON.stringify(settingsObj),
      {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    );
  } catch (error) {
    console.error('Error fetching settings:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    );
  }
}

// 保存站点设置
export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const body = await request.json();

    // 定义允许更新的设置及其类型
    const allowedSettings = {
      site_title: 'string',
      site_subtitle: 'string',
      site_url: 'string',
      admin_email: 'string',
      site_language: 'string',
      allow_registration: 'boolean',
      default_user_role: 'string',
      threads_per_page: 'number'
    };

    // 更新每个设置
    for (const [key, value] of Object.entries(body)) {
      if (allowedSettings[key]) {
        const type = allowedSettings[key];
        let stringValue = value;

        // 转换为字符串存储
        if (type === 'boolean') {
          stringValue = value ? 'true' : 'false';
        } else if (type === 'number') {
          stringValue = value.toString();
        }

        // 使用 INSERT OR REPLACE 来更新或插入
        await env.DB.prepare(`
          INSERT OR REPLACE INTO settings (key, value, type, updated_at)
          VALUES (?, ?, ?, ?)
        `).bind(
          key,
          stringValue,
          type,
          new Date().toISOString()
        ).run();
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '设置已保存'
      }),
      {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    );
  } catch (error) {
    console.error('Error saving settings:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    );
  }
}
