import { supabase, getSupabase } from "../supabase.js";

const READERS = {
  youtube: readYoutube,
  facebook: readFacebook,
  bookmarks: readBookmarks,
  tasks: readTasks,
  color: readColor,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const apiSecret = process.env.API_SECRET;
  const authHeader = req.headers["x-api-key"];
  if (!apiSecret || authHeader !== apiSecret) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  if (!getSupabase()) {
    return res.status(503).json({ success: false, error: "Supabase not configured" });
  }

  const { app } = req.body || {};
  const reader = READERS[app];
  if (!reader) {
    return res.status(400).json({ success: false, error: `Unknown app: ${app}` });
  }

  try {
    const data = await reader();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function readYoutube() {
  const [tabsRes, channelsRes, videosRes] = await Promise.all([
    supabase.from("tabs").select("*").eq("app", "youtube").order("position"),
    supabase.from("channels").select("*"),
    supabase.from("videos").select("*").order("published_at", { ascending: false }),
  ]);

  return {
    tabs: (tabsRes.data || []).map((t) => ({ id: t.id, name: t.name, position: t.position })),
    channels: (channelsRes.data || []).map((c) => ({
      channelId: c.channel_id,
      channelName: c.channel_name,
      thumbnail: c.thumbnail,
      tabId: c.tab_id,
    })),
    videos: (videosRes.data || []).map((v) => ({
      videoId: v.video_id,
      channelId: v.channel_id,
      channelName: v.channel_name,
      title: v.title,
      publishedAt: v.published_at,
      thumbnail: v.thumbnail,
      link: v.link,
    })),
  };
}

async function readFacebook() {
  const [tabsRes, pagesRes, postsRes] = await Promise.all([
    supabase.from("tabs").select("*").eq("app", "facebook").order("position"),
    supabase.from("pages").select("*"),
    supabase.from("posts").select("*").order("published_at", { ascending: false }),
  ]);

  return {
    tabs: (tabsRes.data || []).map((t) => ({ id: t.id, name: t.name, position: t.position })),
    pages: (pagesRes.data || []).map((p) => ({
      feedUrl: p.feed_url,
      pageName: p.page_name,
      tabId: p.tab_id,
    })),
    posts: (postsRes.data || []).map((p) => ({
      postId: p.post_id,
      feedUrl: p.feed_url,
      pageName: p.page_name,
      title: p.title,
      link: p.link,
      content: p.content,
      publishedAt: p.published_at,
    })),
  };
}

async function readBookmarks() {
  const [tabsRes, bookmarksRes] = await Promise.all([
    supabase.from("tabs").select("*").eq("app", "bookmarks").order("position"),
    supabase.from("bookmarks").select("*").order("created_at"),
  ]);

  return {
    tabs: (tabsRes.data || []).map((t) => ({ id: t.id, name: t.name, position: t.position })),
    bookmarks: (bookmarksRes.data || []).map((b) => ({
      id: b.id,
      tabId: b.tab_id,
      title: b.title,
      url: b.url,
      description: b.description,
      icon: b.icon,
      createdAt: b.created_at,
    })),
  };
}

async function readTasks() {
  const { data } = await supabase.from("tasks").select("*").order("created_at");

  return {
    tasks: (data || []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      dueAt: t.due_at,
      reminders: t.reminders,
      repeat: t.repeat,
      completed: t.completed,
      reminderSent: t.reminder_sent,
      createdAt: t.created_at,
    })),
  };
}

async function readColor() {
  const { data } = await supabase
    .from("color_history")
    .select("*")
    .order("position");

  return (data || []).map((c) => ({ hex: c.hex, rgb: c.rgb }));
}
