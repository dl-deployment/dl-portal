import { XMLParser } from "fast-xml-parser";

const RSS_BASE = "https://www.youtube.com/feeds/videos.xml";
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetch(url, options);

      // Retry on 404/500/503 (YouTube RSS intermittent errors)
      if ((r.status === 404 || r.status >= 500) && attempt < retries) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return r;
    } catch (err) {
      lastError = err;

      if (attempt < retries) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError;
}

async function resolveChannelId(input) {
  const trimmed = input.trim();

  if (/^UC[\w-]{22}$/.test(trimmed)) return trimmed;

  let channelUrl;

  if (/^https?:\/\/(www\.)?youtube\.com\//i.test(trimmed)) {
    channelUrl = trimmed;
  } else if (trimmed.startsWith("@")) {
    channelUrl = `https://www.youtube.com/${trimmed}`;
  } else {
    channelUrl = `https://www.youtube.com/@${trimmed}`;
  }

  const channelMatch = channelUrl.match(/youtube\.com\/channel\/(UC[\w-]{22})/);
  if (channelMatch) return channelMatch[1];

  const res = await fetchWithRetry(channelUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Could not reach YouTube page: ${channelUrl} (${res.status})`);
  }

  const html = await res.text();

  const metaMatch =
    html.match(/<meta\s[^>]*(?:property|name)="(?:og:url|channel_id)"[^>]*content="([^"]*)"[^>]*>/i) ||
    html.match(/<link\s[^>]*rel="canonical"[^>]*href="([^"]*)"[^>]*>/i);

  if (metaMatch) {
    const idFromUrl = metaMatch[1].match(/\/channel\/(UC[\w-]{22})/);
    if (idFromUrl) return idFromUrl[1];
  }

  const externalIdMatch = html.match(/"externalId"\s*:\s*"(UC[\w-]{22})"/);
  if (externalIdMatch) return externalIdMatch[1];

  const rssMatch = html.match(/channel_id=(UC[\w-]{22})/);
  if (rssMatch) return rssMatch[1];

  throw new Error(`Could not find channel ID from: ${input}`);
}

async function fetchChannelFromRSS(channelId) {
  const url = `${RSS_BASE}?channel_id=${encodeURIComponent(channelId)}`;
  const res = await fetchWithRetry(url);

  if (!res.ok) {
    throw new Error(`YouTube RSS is temporarily unavailable (${res.status})`);
  }

  const xml = await res.text();
  const data = parser.parse(xml);
  const feed = data.feed;

  if (!feed) {
    throw new Error(`Invalid RSS feed for channel: ${channelId}`);
  }

  return {
    channelId,
    channelName: feed.title || channelId,
    thumbnail: "",
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { channel } = req.body || {};
  if (!channel) {
    return res.status(400).json({ error: "channel is required" });
  }

  try {
    const channelId = await resolveChannelId(channel);
    const info = await fetchChannelFromRSS(channelId);
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
