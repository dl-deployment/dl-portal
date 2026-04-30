import { XMLParser } from "fast-xml-parser";

const RSS_BASE = "https://www.youtube.com/feeds/videos.xml";
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { channelId, publishedAfter } = req.body || {};
  if (!channelId) {
    return res.status(400).json({ error: "channelId is required" });
  }

  try {
    const url = `${RSS_BASE}?channel_id=${encodeURIComponent(channelId)}`;
    const r = await fetch(url);

    if (!r.ok) {
      throw new Error(`Failed to fetch RSS for ${channelId} (${r.status})`);
    }

    const xml = await r.text();
    const data = parser.parse(xml);
    const feed = data.feed;

    if (!feed || !feed.entry) {
      return res.json({ videos: [] });
    }

    const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];
    const cutoff = publishedAfter ? new Date(publishedAfter).getTime() : 0;

    const videos = entries
      .map((entry) => ({
        videoId: entry["yt:videoId"],
        title: entry.title,
        thumbnail: `https://i.ytimg.com/vi/${entry["yt:videoId"]}/mqdefault.jpg`,
        publishedAt: entry.published,
        channelId,
      }))
      .filter((v) => new Date(v.publishedAt).getTime() > cutoff);

    res.json({ videos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
