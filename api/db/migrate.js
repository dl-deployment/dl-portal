import { getSupabase } from "../supabase.js";
import { writeYoutube, writeFacebook, writeBookmarks, writeTasks, writeColor } from "./write.js";

const MIGRATORS = { youtube: writeYoutube, facebook: writeFacebook, bookmarks: writeBookmarks, tasks: writeTasks, color: writeColor };

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
  const migrator = MIGRATORS[app];
  if (!migrator) {
    return res.status(400).json({ success: false, error: `Unknown app: ${app}` });
  }

  if (!data) {
    return res.status(400).json({ success: false, error: "Missing data" });
  }

  try {
    await migrator(data);
    res.json({ success: true, migrated: app });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
