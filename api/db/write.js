import { supabase, getSupabase } from "../supabase.js";

export { writeYoutube, writeFacebook, writeBookmarks, writeTasks, writeColor };

const WRITERS = {
  youtube: writeYoutube,
  facebook: writeFacebook,
  bookmarks: writeBookmarks,
  tasks: writeTasks,
  color: writeColor,
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
  const { tabs = [], channels = [], videos = [] } = data;

  const dbTabs = tabs.map((t) => ({
    id: t.id,
    app: "youtube",
    name: t.name,
    position: t.position,
  }));

  const dbChannels = channels.map((c) => ({
    channel_id: c.channelId,
    channel_name: c.channelName,
    thumbnail: c.thumbnail || "",
    tab_id: c.tabId,
  }));

  const dbVideos = videos.map((v) => ({
    video_id: v.videoId,
    channel_id: v.channelId,
    channel_name: v.channelName || "",
    title: v.title || "",
    published_at: v.publishedAt,
    thumbnail: v.thumbnail || "",
    link: v.link || "",
  }));

  await syncTabs("youtube", dbTabs);

  if (dbChannels.length > 0) {
    await supabase.from("channels").upsert(dbChannels, { onConflict: "channel_id" });
  }
  await deleteNotIn("channels", "channel_id", dbChannels.map((c) => c.channel_id));

  if (dbVideos.length > 0) {
    for (let i = 0; i < dbVideos.length; i += 500) {
      await supabase.from("videos").upsert(dbVideos.slice(i, i + 500), { onConflict: "video_id" });
    }
  }
}

async function writeFacebook(data) {
  const { tabs = [], pages = [], posts = [] } = data;

  const dbTabs = tabs.map((t) => ({
    id: t.id,
    app: "facebook",
    name: t.name,
    position: t.position,
  }));

  const dbPages = pages.map((p) => ({
    feed_url: p.feedUrl,
    page_name: p.pageName,
    tab_id: p.tabId,
  }));

  const dbPosts = posts.map((p) => ({
    post_id: p.postId,
    feed_url: p.feedUrl,
    page_name: p.pageName || "",
    title: p.title || "",
    link: p.link || "",
    content: p.content || "",
    published_at: p.publishedAt,
  }));

  await syncTabs("facebook", dbTabs);

  if (dbPages.length > 0) {
    await supabase.from("pages").upsert(dbPages, { onConflict: "feed_url" });
  }
  await deleteNotIn("pages", "feed_url", dbPages.map((p) => p.feed_url));

  if (dbPosts.length > 0) {
    for (let i = 0; i < dbPosts.length; i += 500) {
      await supabase.from("posts").upsert(dbPosts.slice(i, i + 500), { onConflict: "post_id" });
    }
  }
}

async function writeBookmarks(data) {
  const { tabs = [], bookmarks = [] } = data;

  const dbTabs = tabs.map((t) => ({
    id: t.id,
    app: "bookmarks",
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
    created_at: b.createdAt || new Date().toISOString(),
  }));

  await syncTabs("bookmarks", dbTabs);

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

async function writeColor(data) {
  const items = Array.isArray(data) ? data : [];

  await supabase.from("color_history").delete().gte("id", 0);

  if (items.length > 0) {
    const dbItems = items.map((c, i) => ({
      hex: c.hex,
      rgb: c.rgb,
      position: i,
    }));
    await supabase.from("color_history").insert(dbItems);
  }
}

async function syncTabs(app, dbTabs) {
  if (dbTabs.length > 0) {
    await supabase.from("tabs").upsert(dbTabs, { onConflict: "id" });
  }
  const keepIds = dbTabs.map((t) => t.id);
  if (keepIds.length > 0) {
    await supabase
      .from("tabs")
      .delete()
      .eq("app", app)
      .not("id", "in", `(${keepIds.join(",")})`);
  } else {
    await supabase.from("tabs").delete().eq("app", app);
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
