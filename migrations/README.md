# 数据库更新记录

## 更新时间
2025-11-09

## 更新内容

### files 表新增字段

为支持图片优化功能，在 `files` 表中新增以下字段：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `width` | INTEGER | 图片宽度（像素）|
| `height` | INTEGER | 图片高度（像素）|
| `thumbnail_r2_key` | TEXT | 小缩略图的 R2 键（300x300，WebP）|
| `medium_r2_key` | TEXT | 中等尺寸的 R2 键（800x800，WebP）|
| `has_thumbnails` | INTEGER | 是否已生成缩略图（1=是, 0=否，默认0）|

### 新增索引

```sql
CREATE INDEX IF NOT EXISTS idx_files_is_image ON files(is_image);
CREATE INDEX IF NOT EXISTS idx_files_has_thumbnails ON files(has_thumbnails);
```

## 更新的文件

1. ✅ `schema.sql` - 主数据库模式文件
2. ✅ `init-db.js` - 数据库初始化API
3. ✅ `migrations/002_add_image_thumbnails.sql` - 迁移脚本（用于现有数据库）

## 迁移说明

### 全新安装
直接使用 `/api/init-db` 初始化数据库，会自动包含所有新字段。

### 现有数据库升级
访问 `/api/migrate-image-thumbnails` 执行迁移：

```bash
curl http://localhost:8788/api/migrate-image-thumbnails
```

或在生产环境：
```bash
curl https://your-domain.com/api/migrate-image-thumbnails
```

**响应示例：**
```json
{
  "success": true,
  "message": "图片缩略图迁移成功",
  "migrationsExecuted": 5
}
```

## 向后兼容性

- 保留了旧的 `thumbnail_key` 字段，标记为 `[已废弃]`
- 所有新字段都允许 NULL 或有默认值
- 现有数据不受影响，新上传的图片会自动填充新字段

## 相关功能

- 图片上传时自动生成缩略图
- 动态图片处理API
- WebP格式自动转换

详见：`docs/IMAGE_OPTIMIZATION.md`
