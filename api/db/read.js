import { supabase, getSupabase } from "../supabase.js";

const APP_IDS = { youtube: 1, facebook: 2, bookmarks: 3, tasks: 4, ptimeline: 5 };

const READERS = {
  youtube: readYoutube,
  facebook: readFacebook,
  bookmarks: readBookmarks,
  tasks: readTasks,
  ptimeline: readPtimeline,
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
  const appId = APP_IDS.youtube;
  const [tabsRes, channelsRes] = await Promise.all([
    supabase.from("tabs").select("*").eq("app_id", appId).order("position"),
    supabase.from("youtube").select("*"),
  ]);

  return {
    tabs: (tabsRes.data || []).map((t) => ({ id: t.id, name: t.name, position: t.position })),
    channels: (channelsRes.data || []).map((c) => ({
      channelId: c.id,
      channelName: c.channel_name,
      thumbnail: c.thumbnail,
      tabId: c.tab_id,
    })),
  };
}

async function readFacebook() {
  const appId = APP_IDS.facebook;
  const [tabsRes, pagesRes] = await Promise.all([
    supabase.from("tabs").select("*").eq("app_id", appId).order("position"),
    supabase.from("facebook").select("*"),
  ]);

  return {
    tabs: (tabsRes.data || []).map((t) => ({ id: t.id, name: t.name, position: t.position })),
    pages: (pagesRes.data || []).map((p) => ({
      feedUrl: p.id,
      pageName: p.page_name,
      thumbnail: p.thumbnail,
      tabId: p.tab_id,
    })),
  };
}

async function readBookmarks() {
  const appId = APP_IDS.bookmarks;
  const [tabsRes, bookmarksRes] = await Promise.all([
    supabase.from("tabs").select("*").eq("app_id", appId).order("position"),
    supabase.from("bookmarks").select("*").order("id"),
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

async function readPtimeline() {
  const { data } = await supabase.from("ptimeline").select("*").order("id");

  return {
    events: (data || []).map((e) => ({
      id: e.id,
      name: e.name,
      solarDate: e.solar_date,
      lunarDate: e.lunar_date,
      type: e.type,
      icon: e.icon,
      note: e.note,
      createdAt: e.created_at,
    })),
  };
}
