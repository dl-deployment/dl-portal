-- =============================================
-- DL-Portal: Supabase Database Setup
-- Run this in Supabase SQL Editor
-- =============================================
-- Only metadata is stored in DB.
-- Ephemeral content (videos, posts, color history) lives in localStorage.
--
-- NAMING CONVENTION:
-- Each app's data table is named after the app itself.
-- e.g. youtube app → `youtube` table, facebook app → `facebook` table.
-- This keeps DB table names consistent with app names in the `apps` registry.

-- 0. Apps registry
CREATE TABLE apps (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
INSERT INTO apps (name) VALUES ('youtube'), ('facebook'), ('bookmarks'), ('tasks');

-- 1. Shared tabs table (linked to apps)
CREATE TABLE tabs (
  id SERIAL PRIMARY KEY,
  app_id INT NOT NULL REFERENCES apps(id),
  name TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. YouTube: tracked channels
CREATE TABLE youtube (
  id TEXT PRIMARY KEY,
  channel_name TEXT NOT NULL,
  thumbnail TEXT DEFAULT '',
  tab_id INT NOT NULL REFERENCES tabs(id) ON DELETE CASCADE
);

-- 3. Facebook: tracked feeds
CREATE TABLE facebook (
  id TEXT PRIMARY KEY,
  page_name TEXT NOT NULL,
  thumbnail TEXT DEFAULT '',
  tab_id INT NOT NULL REFERENCES tabs(id) ON DELETE CASCADE
);

-- 4. Bookmarks
CREATE TABLE bookmarks (
  id SERIAL PRIMARY KEY,
  tab_id INT NOT NULL REFERENCES tabs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT ''
);

-- 5. Tasks
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

-- =============================================
-- Row Level Security — all tables locked down
-- Only service_role key can access (bypasses RLS)
-- =============================================

ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Indexes for common queries
CREATE INDEX idx_tabs_app_id ON tabs(app_id);
CREATE INDEX idx_youtube_tab_id ON youtube(tab_id);
CREATE INDEX idx_facebook_tab_id ON facebook(tab_id);
CREATE INDEX idx_bookmarks_tab_id ON bookmarks(tab_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
