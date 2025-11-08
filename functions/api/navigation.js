/**
 * Navigation API - 前端导航菜单
 * GET /api/navigation - 获取导航菜单数据
 */

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 获取所有启用的导航菜单项
    const { results: menus } = await env.DB.prepare(`
      SELECT *
      FROM navigation
      WHERE is_active = 1 AND position = 'header'
      ORDER BY sort_order ASC, id ASC
    `).all();

    // 获取站点设置（包含更新时间作为版本号）
    const { results: settings } = await env.DB.prepare(`
      SELECT key, value, updated_at
      FROM settings
      WHERE key IN ('site_title', 'site_subtitle', 'site_icon')
    `).all();

    // 转换设置为对象
    const siteSettings = {};
    let siteIconVersion = Date.now(); // 默认使用当前时间戳
    settings.forEach(setting => {
      siteSettings[setting.key] = setting.value;
      // 使用 site_icon 的更新时间作为版本号
      if (setting.key === 'site_icon' && setting.updated_at) {
        siteIconVersion = new Date(setting.updated_at).getTime();
      }
    });

    // 构建树形结构
    const buildMenuTree = (parentId = null) => {
      return menus
        .filter(menu => (parentId === null ? !menu.parent_id : menu.parent_id === parentId))
        .map(menu => ({
          id: menu.id,
          label: menu.label,
          path: menu.path,
          icon: menu.icon,
          isHome: menu.is_home === 1,
          target: menu.target || '_self',
          children: buildMenuTree(menu.id) // 递归获取子菜单
        }));
    };

    // 只获取顶级菜单（parent_id 为 null）
    const menuItems = buildMenuTree();

    // 构建导航配置
    const navigationConfig = {
      siteName: siteSettings.site_title || '没有小家',
      siteSubtitle: siteSettings.site_subtitle || '',
      siteIcon: siteSettings.site_icon || '🏠', // 支持图片URL或emoji
      siteIconVersion, // 站点图标版本号，用于浏览器缓存
      menuItems,
      searchPlaceholder: '搜索什么...'
    };

    return new Response(
      JSON.stringify(navigationConfig),
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching navigation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  }
}
