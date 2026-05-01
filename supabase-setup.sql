-- =============================================
-- DL-Portal: Supabase Database Setup
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Shared tabs table (youtube, facebook, bookmarks)
CREATE TABLE tabs (
  id SERIAL PRIMARY KEY,
  app TEXT NOT NULL CHECK (app IN ('youtube', 'facebook', 'bookmarks')),
  name TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. YouTube: channels
CREATE TABLE channels (
  channel_id TEXT PRIMARY KEY,
  channel_name TEXT NOT NULL,
  thumbnail TEXT DEFAULT '',
  tab_id INT NOT NULL REFERENCES tabs(id) ON DELETE CASCADE
);

-- 3. YouTube: videos
CREATE TABLE videos (
  video_id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL REFERENCES channels(channel_id) ON DELETE CASCADE,
  channel_name TEXT DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  published_at TIMESTAMPTZ NOT NULL,
  thumbnail TEXT DEFAULT '',
  link TEXT DEFAULT ''
);

-- 4. Facebook: pages
CREATE TABLE pages (
  feed_url TEXT PRIMARY KEY,
  page_name TEXT NOT NULL,
  tab_id INT NOT NULL REFERENCES tabs(id) ON DELETE CASCADE
);

-- 5. Facebook: posts
CREATE TABLE posts (
  post_id TEXT PRIMARY KEY,
  feed_url TEXT NOT NULL REFERENCES pages(feed_url) ON DELETE CASCADE,
  page_name TEXT DEFAULT '',
  title TEXT DEFAULT '',
  link TEXT DEFAULT '',
  content TEXT DEFAULT '',
  published_at TIMESTAMPTZ NOT NULL
);

-- 6. Bookmarks
CREATE TABLE bookmarks (
  id SERIAL PRIMARY KEY,
  tab_id INT NOT NULL REFERENCES tabs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tasks
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_at TIMESTAMPTZ,
  reminders JSONB DEFAULT '[15]',
  repeat TEXT DEFAULT 'none' CHECK (repeat IN ('none', 'daily', 'weekly')),
  completed BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Color history
CREATE TABLE color_history (
  id SERIAL PRIMARY KEY,
  hex TEXT NOT NULL UNIQUE,
  rgb JSONB NOT NULL,
  position INT NOT NULL DEFAULT 0
);

-- =============================================
-- Row Level Security — all tables locked down
-- Only service_role key can access (bypasses RLS)
-- =============================================

ALTER TABLE tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_history ENABLE ROW LEVEL SECURITY;

-- Indexes for common queries
CREATE INDEX idx_tabs_app ON tabs(app);
CREATE INDEX idx_channels_tab_id ON channels(tab_id);
CREATE INDEX idx_videos_channel_id ON videos(channel_id);
CREATE INDEX idx_videos_published_at ON videos(published_at);
CREATE INDEX idx_pages_tab_id ON pages(tab_id);
CREATE INDEX idx_posts_feed_url ON posts(feed_url);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_bookmarks_tab_id ON bookmarks(tab_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_color_history_position ON color_history(position);
