import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetch(url);

      if ((r.status === 404 || r.status >= 500) && attempt < retries) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (!r.ok) {
        throw new Error(`Feed returned ${r.status}`);
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

function stripHtml(html) {
  if (typeof html !== "string") return String(html || "");
  return html.replace(/<[^>]*>/g, "").trim();
}

function parseAtomFeed(feed, feedUrl) {
  if (!feed.entry) return [];
  const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];

  return entries.map((entry) => {
    const id = entry.id || entry["@_id"] || "";
    const content = entry.content?.["#text"] || entry.content || entry.summary?.["#text"] || entry.summary || entry.title || "";

    return {
      postId: id || `${feedUrl}-${entry.updated || entry.published}`,
      content: stripHtml(content),
      publishedAt: entry.updated || entry.published || "",
      link: entry.link?.["@_href"] || (typeof entry.link === "string" ? entry.link : ""),
      feedUrl,
    };
  });
}

function parseRss2Feed(channel, feedUrl) {
  if (!channel.item) return [];
  const items = Array.isArray(channel.item) ? channel.item : [channel.item];

  return items.map((item) => {
    const id = item.guid?.["#text"] || item.guid || item.link || "";
    const content = item.description?.["#text"] || item.description || item.title || "";

    return {
      postId: id || `${feedUrl}-${item.pubDate}`,
      content: stripHtml(content),
      publishedAt: item.pubDate || "",
      link: item.link || "",
      feedUrl,
    };
  });
}

function parseFeed(xml, feedUrl) {
  const data = parser.parse(xml);

  // Atom format
  if (data.feed) {
    return parseAtomFeed(data.feed, feedUrl);
  }

  // RSS 2.0 format
  if (data.rss?.channel) {
    return parseRss2Feed(data.rss.channel, feedUrl);
  }

  return [];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { feedUrl, publishedAfter } = req.body || {};
  if (!feedUrl) {
    return res.status(400).json({ error: "feedUrl is required" });
  }

  try {
    const xml = await fetchWithRetry(feedUrl);
    const allPosts = parseFeed(xml, feedUrl);

    const cutoff = publishedAfter ? new Date(publishedAfter).getTime() : 0;
    const posts = allPosts.filter((p) => new Date(p.publishedAt).getTime() > cutoff);

    res.json({ posts });
  } catch (err) {
    res.status(502).json({
      error: `Failed to fetch feed. Please check the URL and try again. (${err.message})`,
    });
  }
}
