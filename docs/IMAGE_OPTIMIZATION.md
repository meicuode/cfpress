# 图片优化功能使用指南

## 概述

本博客系统已集成图片自动优化功能，包括：
- ✅ 上传时自动生成缩略图（300x300 和 800x800）
- ✅ 自动WebP格式转换（体积更小）
- ✅ 动态图片处理API（按需调整尺寸和格式）
- ✅ 原图尺寸记录

## 功能说明

### 1. 自动缩略图生成

当你上传图片时，系统会自动生成：

| 类型 | 尺寸 | 路径 | 用途 |
|------|------|------|------|
| 原图 | 原始尺寸 | 原路径 | 完整展示 |
| 缩略图 | 最大300x300 | `thumbnails/thumb/文件名.webp` | 列表预览 |
| 中等尺寸 | 最大800x800 | `thumbnails/medium/文件名.webp` | 详情页展示 |

**特点：**
- 保持原始宽高比
- 自动转换为WebP格式（更小的文件体积）
- 质量优化（缩略图85%，中等90%）
- 如果原图已经很小，不生成缩略图

### 2. 动态图片处理API

通过URL参数实时调整图片：

**基础语法：**
```
/api/images/{图片路径}?width=宽度&height=高度&quality=质量&format=格式
```

**参数说明：**
- `width`: 宽度（像素）
- `height`: 高度（像素）
- `quality`: 质量 (1-100)，默认85
- `format`: 输出格式 (webp, jpeg, png)，默认webp

**使用示例：**

```html
<!-- 原图 -->
<img src="/api/files/myimage.jpg" />

<!-- 生成800px宽度的WebP -->
<img src="/api/images/myimage.jpg?width=800&format=webp" />

<!-- 生成400x300的缩略图 -->
<img src="/api/images/myimage.jpg?width=400&height=300&quality=90" />

<!-- 响应式图片 -->
<img
  src="/api/images/myimage.jpg?width=400"
  srcset="
    /api/images/myimage.jpg?width=400 400w,
    /api/images/myimage.jpg?width=800 800w,
    /api/images/myimage.jpg?width=1200 1200w
  "
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  alt="示例图片"
/>
```

### 3. 使用预生成的缩略图

上传后，可以直接使用预生成的缩略图：

```javascript
// 上传成功后的响应
{
  "url": "/api/files/myimage_1699999999_abc123.jpg",  // 原图
  "thumbnailUrl": "/api/files/thumbnails/thumb/myimage_1699999999_abc123.webp",  // 小缩略图
  "mediumUrl": "/api/files/thumbnails/medium/myimage_1699999999_abc123.webp",    // 中等尺寸
  "width": 1920,
  "height": 1080
}
```

**前端使用：**
```html
<!-- 列表页使用缩略图 -->
<img src="/api/files/thumbnails/thumb/myimage_1699999999_abc123.webp" alt="缩略图" />

<!-- 详情页使用中等尺寸 -->
<img src="/api/files/thumbnails/medium/myimage_1699999999_abc123.webp" alt="详情图" />

<!-- 点击查看原图 -->
<a href="/api/files/myimage_1699999999_abc123.jpg">
  <img src="/api/files/thumbnails/medium/myimage_1699999999_abc123.webp" />
</a>
```

## 最佳实践

### 方案1：使用预生成缩略图（推荐，性能最佳）

适用场景：列表页、固定尺寸展示

```jsx
// React 组件示例
function ArticleCard({ article }) {
  return (
    <div className="article-card">
      <img
        src={article.thumbnailUrl || article.imageUrl}
        alt={article.title}
        loading="lazy"
      />
    </div>
  );
}
```

**优点：**
- 加载最快（预生成，无需实时处理）
- 节省带宽
- 减少服务器压力

### 方案2：使用动态处理API（灵活）

适用场景：需要自定义尺寸、响应式设计

```jsx
function ResponsiveImage({ src, alt, sizes = "100vw" }) {
  return (
    <img
      src={`/api/images/${src}?width=800`}
      srcset={`
        /api/images/${src}?width=400 400w,
        /api/images/${src}?width=800 800w,
        /api/images/${src}?width=1200 1200w
      `}
      sizes={sizes}
      alt={alt}
      loading="lazy"
    />
  );
}
```

**优点：**
- 灵活控制尺寸
- 支持响应式
- 自动WebP转换

### 方案3：混合使用（最佳）

```jsx
function ArticleImage({ image, size = 'medium' }) {
  // 小尺寸使用预生成缩略图
  if (size === 'thumbnail' && image.thumbnailUrl) {
    return <img src={image.thumbnailUrl} alt={image.alt} />;
  }

  // 中等尺寸使用预生成的medium
  if (size === 'medium' && image.mediumUrl) {
    return <img src={image.mediumUrl} alt={image.alt} />;
  }

  // 自定义尺寸使用动态API
  return (
    <img
      src={`/api/images/${image.r2Key}?width=${size === 'large' ? 1200 : 600}`}
      alt={image.alt}
    />
  );
}
```

## 性能优化建议

1. **优先使用预生成缩略图**：列表页、卡片等固定尺寸场景
2. **启用lazy loading**：`<img loading="lazy" />`
3. **使用响应式图片**：不同屏幕尺寸加载不同大小
4. **WebP优先**：现代浏览器自动使用WebP，体积减少30-50%
5. **设置合理的质量**：通常85-90即可，肉眼难以区分

## 文件存储结构

```
R2 Bucket (cfpress-files-preview)
├── myimage_1699999999_abc123.jpg          # 原图
├── cfpress/
│   └── photo_1699999999_xyz789.png        # 文件夹中的图片
└── thumbnails/
    ├── thumb/
    │   ├── myimage_1699999999_abc123.webp  # 小缩略图
    │   └── photo_1699999999_xyz789.webp
    └── medium/
        ├── myimage_1699999999_abc123.webp  # 中等尺寸
        └── photo_1699999999_xyz789.webp
```

## API参考

### 文件上传 API
**POST** `/api/admin/files/upload`

上传图片时自动：
- 记录图片尺寸（width, height）
- 生成缩略图（300x300）
- 生成中等尺寸（800x800）
- 转换为WebP格式

**响应示例：**
```json
{
  "success": true,
  "uploaded": [
    {
      "id": 123,
      "filename": "myimage.jpg",
      "url": "/api/files/myimage_1699999999_abc123.jpg",
      "thumbnailUrl": "/api/files/thumbnails/thumb/myimage_1699999999_abc123.webp",
      "mediumUrl": "/api/files/thumbnails/medium/myimage_1699999999_abc123.webp",
      "width": 1920,
      "height": 1080,
      "size": 524288
    }
  ]
}
```

### 动态图片处理 API
**GET** `/api/images/{key}?width=800&quality=90&format=webp`

**参数：**
- `width`: 最大宽度（可选）
- `height`: 最大高度（可选）
- `quality`: 质量 1-100（可选，默认85）
- `format`: webp|jpeg|png（可选，默认webp）

**缓存：**
- 动态处理的图片缓存30天
- 原图和预生成缩略图缓存1年

## 迁移现有图片

如果你有现有的图片需要生成缩略图，可以：

1. **重新上传**：删除旧图，重新上传（推荐）
2. **批量处理脚本**：创建脚本遍历所有图片生成缩略图
3. **按需生成**：使用动态API，首次访问时生成

## 技术实现

- **图片处理**：使用 Web 标准 ImageBitmap + OffscreenCanvas API
- **WebP转换**：canvas.convertToBlob({ type: 'image/webp' })
- **存储**：Cloudflare R2
- **CDN**：Cloudflare全球边缘网络
- **缓存策略**：
  - 预生成缩略图：1年
  - 动态处理：30天
  - 原图：1年

## 注意事项

1. **SVG文件不生成缩略图**：SVG是矢量图，无需压缩
2. **小图片不生成缩略图**：如果原图小于目标尺寸，不浪费存储
3. **Worker限制**：图片处理在Cloudflare Workers中进行，超大图片可能超时
4. **R2存储**：缩略图会占用额外存储空间（通常WebP格式很小）

## 故障排查

### 缩略图未生成

**问题**：上传后没有thumbnailUrl

**可能原因：**
1. 图片太小，不需要缩略图
2. SVG文件（不支持）
3. 处理失败（查看日志）

**解决方法：**
- 检查控制台日志
- 确认图片格式支持
- 使用动态API代替

### 图片加载失败

**问题**：图片显示404

**可能原因：**
1. R2 key路径错误
2. 文件已删除
3. 权限问题

**解决方法：**
- 检查完整的r2Key
- 使用 `/api/files/` 而不是 `/api/images/`
- 查看R2存储桶

## 更新日志

### v1.0 (2025-11-09)
- ✅ 自动缩略图生成（300x300, 800x800）
- ✅ WebP格式转换
- ✅ 动态图片处理API
- ✅ 数据库迁移（添加width, height等字段）
- ✅ 图片尺寸记录
