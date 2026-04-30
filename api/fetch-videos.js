import { XMLParser } from "fast-xml-parser";

const RSS_BASE = "https://www.youtube.com/feeds/videos.xml";
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetch(url);

      // Retry on 404/500/503 (YouTube RSS intermittent errors)
      if ((r.status === 404 || r.status >= 500) && attempt < retries) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (!r.ok) {
        throw new Error(`RSS returned ${r.status}`);
      }

      return await r.text();
    } catch (err) {
      lastError = err;

      if (attempt < retries && err.message?.includes("fetch")) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError;
}

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
    const xml = await fetchWithRetry(url);
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
    res.status(502).json({
      error: `YouTube RSS is temporarily unavailable. Please try again later. (${err.message})`,
    });
  }
}
