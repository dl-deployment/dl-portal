const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetch(url, options);

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

/**
 * Parse relative time string ("2 days ago", "1 month ago") to ISO date.
 * Returns approximate ISO string or null if unparseable.
 */
function parseRelativeTime(text) {
  if (!text) return null;

  const match = text.match(/^(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i);
  if (!match) return null;

  const n = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers = {
    second: 1000,
    minute: 60000,
    hour: 3600000,
    day: 86400000,
    week: 604800000,
    month: 2592000000, // ~30 days
    year: 31536000000, // ~365 days
  };

  const ms = multipliers[unit];
  if (!ms) return null;

  return new Date(Date.now() - n * ms).toISOString();
}

/**
 * Fetch videos from a YouTube channel by scraping the channel's /videos page.
 * Extracts video data from ytInitialData JSON embedded in the HTML.
 */
async function fetchChannelVideos(channelId, publishedAfter) {
  const channelUrl = `https://www.youtube.com/channel/${channelId}/videos`;

  const res = await fetchWithRetry(channelUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Could not reach YouTube channel page (${res.status})`);
  }

  const html = await res.text();

  // Extract ytInitialData JSON
  const dataMatch = html.match(/var ytInitialData\s*=\s*(\{.+?\});\s*<\/script>/s);
  if (!dataMatch) {
    throw new Error("Could not extract video data from YouTube page");
  }

  let data;
  try {
    data = JSON.parse(dataMatch[1]);
  } catch {
    throw new Error("Failed to parse YouTube page data");
  }

  // Navigate to Videos tab — find by endpoint URL containing /videos
  const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs;
  if (!tabs) {
    throw new Error("Could not find channel tabs");
  }

  const videosTab = tabs.find((t) => {
    const url = t.tabRenderer?.endpoint?.commandMetadata?.webCommandMetadata?.url;
    return url && url.includes("/videos");
  });

  if (!videosTab) {
    throw new Error("Could not find Videos tab");
  }

  const richGrid = videosTab.tabRenderer?.content?.richGridRenderer;
  if (!richGrid || !richGrid.contents) {
    return [];
  }

  // Extract videos from richGridRenderer
  // YouTube may return either videoRenderer or lockupViewModel format
  const cutoff = publishedAfter ? new Date(publishedAfter).getTime() : 0;
  const videos = [];

  for (const item of richGrid.contents) {
    const content = item.richItemRenderer?.content;
    if (!content) continue;

    let videoId, title, publishedAt;

    if (content.videoRenderer) {
      // Legacy format: videoRenderer
      const vr = content.videoRenderer;
      videoId = vr.videoId;
      title = vr.title?.runs?.[0]?.text || "";
      publishedAt = parseRelativeTime(vr.publishedTimeText?.simpleText);
    } else if (content.lockupViewModel) {
      // New format: lockupViewModel
      const lvm = content.lockupViewModel;
      if (lvm.contentType !== "LOCKUP_CONTENT_TYPE_VIDEO") continue;
      videoId = lvm.contentId;
      title = lvm.metadata?.lockupMetadataViewModel?.title?.content || "";

      // Published time is in metadata rows
      const rows =
        lvm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows;
      if (rows) {
        for (const row of rows) {
          for (const part of row.metadataParts || []) {
            const text = part.text?.content;
            if (text && /ago$/i.test(text)) {
              publishedAt = parseRelativeTime(text);
            }
          }
        }
      }
    }

    if (!videoId || !publishedAt) continue;

    // Filter by date
    if (new Date(publishedAt).getTime() < cutoff) continue;

    videos.push({
      videoId,
      title,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      publishedAt,
      channelId,
    });
  }

  return videos;
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
    const videos = await fetchChannelVideos(channelId, publishedAfter);
    res.json({ videos });
  } catch (err) {
    res.status(502).json({
      error: `Failed to fetch videos. Please try again later. (${err.message})`,
    });
  }
}
