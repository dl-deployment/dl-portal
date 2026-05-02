import { supabase, getSupabase } from "../supabase.js";

const APP_IDS = { youtube: 1, facebook: 2, bookmarks: 3, tasks: 4 };

const WRITERS = {
  youtube: writeYoutube,
  facebook: writeFacebook,
  bookmarks: writeBookmarks,
  tasks: writeTasks,
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

  const { app, data } = req.body || {};
  const writer = WRITERS[app];
  if (!writer) {
    return res.status(400).json({ success: false, error: `Unknown app: ${app}` });
  }

  if (!data) {
    return res.status(400).json({ success: false, error: "Missing data" });
  }

  try {
    await writer(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function writeYoutube(data) {
  const appId = APP_IDS.youtube;
  const { tabs = [], channels = [] } = data;

  const dbTabs = tabs.map((t) => ({
    id: t.id,
    app_id: appId,
    name: t.name,
    position: t.position,
  }));

  const dbChannels = channels.map((c) => ({
    id: c.channelId,
    channel_name: c.channelName,
    thumbnail: c.thumbnail || "",
    tab_id: c.tabId,
  }));

  await syncTabs(appId, dbTabs);

  if (dbChannels.length > 0) {
    await supabase.from("youtube").upsert(dbChannels, { onConflict: "id" });
  }
  await deleteNotIn("youtube", "id", dbChannels.map((c) => c.id));
}

async function writeFacebook(data) {
  const appId = APP_IDS.facebook;
  const { tabs = [], pages = [] } = data;

  const dbTabs = tabs.map((t) => ({
    id: t.id,
    app_id: appId,
    name: t.name,
    position: t.position,
  }));

  const dbPages = pages.map((p) => ({
    id: p.feedUrl,
    page_name: p.pageName,
    thumbnail: p.thumbnail || "",
    tab_id: p.tabId,
  }));

  await syncTabs(appId, dbTabs);

  if (dbPages.length > 0) {
    await supabase.from("facebook").upsert(dbPages, { onConflict: "id" });
  }
  await deleteNotIn("facebook", "id", dbPages.map((p) => p.id));
}

async function writeBookmarks(data) {
  const appId = APP_IDS.bookmarks;
  const { tabs = [], bookmarks = [] } = data;

  const dbTabs = tabs.map((t) => ({
    id: t.id,
    app_id: appId,
    name: t.name,
    position: t.position,
  }));

  const dbBookmarks = bookmarks.map((b) => ({
    id: b.id,
    tab_id: b.tabId,
    title: b.title,
    url: b.url,
    description: b.description || "",
    icon: b.icon || "",
  }));

  await syncTabs(appId, dbTabs);

  if (dbBookmarks.length > 0) {
    await supabase.from("bookmarks").upsert(dbBookmarks, { onConflict: "id" });
  }
  await deleteNotInNumeric("bookmarks", "id", dbBookmarks.map((b) => b.id));
}

async function writeTasks(data) {
  const { tasks = [] } = data;

  const dbTasks = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description || "",
    due_at: t.dueAt,
    reminders: t.reminders,
    repeat: t.repeat || "none",
    completed: t.completed || false,
    reminder_sent: t.reminderSent || false,
    created_at: t.createdAt || new Date().toISOString(),
  }));

  if (dbTasks.length > 0) {
    await supabase.from("tasks").upsert(dbTasks, { onConflict: "id" });
  }
  await deleteNotInNumeric("tasks", "id", dbTasks.map((t) => t.id));
}

async function syncTabs(appId, dbTabs) {
  if (dbTabs.length > 0) {
    await supabase.from("tabs").upsert(dbTabs, { onConflict: "id" });
  }
  const keepIds = dbTabs.map((t) => t.id);
  if (keepIds.length > 0) {
    await supabase
      .from("tabs")
      .delete()
      .eq("app_id", appId)
      .not("id", "in", `(${keepIds.join(",")})`);
  } else {
    await supabase.from("tabs").delete().eq("app_id", appId);
  }
}

async function deleteNotIn(table, column, keepValues) {
  if (keepValues.length > 0) {
    await supabase
      .from(table)
      .delete()
      .not(column, "in", `(${keepValues.map((v) => `"${v}"`).join(",")})`);
  } else {
    await supabase.from(table).delete().neq(column, "");
  }
}

async function deleteNotInNumeric(table, column, keepIds) {
  if (keepIds.length > 0) {
    await supabase
      .from(table)
      .delete()
      .not(column, "in", `(${keepIds.join(",")})`);
  } else {
    await supabase.from(table).delete().gte(column, 0);
  }
}
