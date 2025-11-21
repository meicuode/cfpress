-- ============================================================================
-- 图片优化：扩展 files 表支持缩略图
-- ============================================================================

-- 为 files 表添加缩略图相关字段
ALTER TABLE files ADD COLUMN width INTEGER;                    -- 图片宽度
ALTER TABLE files ADD COLUMN height INTEGER;                   -- 图片高度
ALTER TABLE files ADD COLUMN thumbnail_r2_key TEXT;            -- 缩略图的R2 key (小尺寸, 如 300x300)
ALTER TABLE files ADD COLUMN medium_r2_key TEXT;               -- 中等尺寸的R2 key (如 800x600)
ALTER TABLE files ADD COLUMN has_thumbnails INTEGER DEFAULT 0; -- 是否已生成缩略图: 0/1

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_files_has_thumbnails ON files(has_thumbnails);
CREATE INDEX IF NOT EXISTS idx_files_is_image ON files(is_image);
