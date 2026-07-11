-- Run this in Supabase SQL Editor to set up the POE2 quick links table.

INSERT INTO apps (id, name) VALUES (6, 'poe2') ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS poe2 (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  payload TEXT NOT NULL
);
