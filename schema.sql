-- D1 Database Schema for CF Blog

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT, -- JSON array of tags
  views INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  published INTEGER DEFAULT 1 -- 1 for published, 0 for draft
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Categories/Tags table (optional, for tag management)
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  count INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- Insert sample data
INSERT INTO posts (title, content, tags, views, created_at) VALUES
  ('一年只需 10 HKD 的香港保号卡 hahaSIM 开箱测评',
   '<p>本周六凌晨正好看了 10 传后，开着窗门看到了北极光...</p><p>这是一篇关于 hahaSIM 的详细测评文章。</p>',
   '["分享", "折腾", "保号卡"]',
   770,
   '2025-03-18T10:00:00Z'),

  ('近乎于手动的华为云 2H1G 香港小鸡只测不评',
   '<p>本周六凌晨正好看了 14 天升，拿着窗户看到星空...</p>',
   '["科技", "测试"]',
   1025,
   '2024-11-26T08:30:00Z'),

  ('论如何下载 Apple Music 的 ALAC 格式音乐',
   '<p>分享一个下载高品质音乐的方法...</p>',
   '["教程", "音乐"]',
   892,
   '2024-10-15T14:20:00Z');

INSERT INTO comments (post_id, author, content, created_at) VALUES
  (1, '用户A', '感谢分享，很有帮助！', '2025-03-19T09:00:00Z'),
  (1, '用户B', '请问在哪里购买？', '2025-03-20T15:30:00Z');

INSERT INTO tags (name, count) VALUES
  ('分享', 23),
  ('存档', 15),
  ('折腾', 32),
  ('日常', 18);
