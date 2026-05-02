import { supabase, getSupabase } from "../supabase.js";

const APP_IDS = { youtube: 1, facebook: 2, bookmarks: 3, tasks: 4 };

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

  const { app, name, position } = req.body || {};
  if (!app || !name) {
    return res.status(400).json({ success: false, error: "app and name are required" });
  }

  const appId = APP_IDS[app];
  if (!appId) {
    return res.status(400).json({ success: false, error: `Unknown app: ${app}` });
  }

  try {
    const { data, error } = await supabase
      .from("tabs")
      .insert({ app_id: appId, name, position: position ?? 0 })
      .select("id, name, position")
      .single();

    if (error) throw error;

    res.json({ success: true, tab: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
