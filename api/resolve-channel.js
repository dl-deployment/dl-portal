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

async function resolveChannel(input) {
  const trimmed = input.trim();

  // Direct channel ID
  if (/^UC[\w-]{22}$/.test(trimmed)) {
    return { channelId: trimmed, channelName: trimmed, thumbnail: "" };
  }

  // Build channel page URL
  let channelUrl;
  if (/^https?:\/\/(www\.)?youtube\.com\//i.test(trimmed)) {
    channelUrl = trimmed;
  } else if (trimmed.startsWith("@")) {
    channelUrl = `https://www.youtube.com/${trimmed}`;
  } else {
    channelUrl = `https://www.youtube.com/@${trimmed}`;
  }

  // Direct /channel/UCxxx URL — extract ID from URL
  const channelMatch = channelUrl.match(/youtube\.com\/channel\/(UC[\w-]{22})/);
  if (channelMatch) {
    // Still need to fetch page for channel name
    const info = await fetchChannelPage(channelUrl);
    return { channelId: channelMatch[1], ...info };
  }

  // Fetch the page to get channel ID + name + thumbnail
  return await fetchChannelPage(channelUrl);
}

async function fetchChannelPage(channelUrl) {
  const res = await fetchWithRetry(channelUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Could not reach YouTube page: ${channelUrl} (${res.status})`);
  }

  const html = await res.text();

  // Extract channel ID
  let channelId = null;

  const externalIdMatch = html.match(/"externalId"\s*:\s*"(UC[\w-]{22})"/);
  if (externalIdMatch) channelId = externalIdMatch[1];

  if (!channelId) {
    const rssMatch = html.match(/channel_id=(UC[\w-]{22})/);
    if (rssMatch) channelId = rssMatch[1];
  }

  if (!channelId) {
    const metaMatch =
      html.match(/<meta\s[^>]*content="[^"]*\/channel\/(UC[\w-]{22})"[^>]*>/i) ||
      html.match(/<link\s[^>]*href="[^"]*\/channel\/(UC[\w-]{22})"[^>]*>/i);
    if (metaMatch) channelId = metaMatch[1];
  }

  if (!channelId) {
    throw new Error(`Could not find channel ID from: ${channelUrl}`);
  }

  // Extract channel name
  let channelName = channelId;

  const ogTitleMatch = html.match(/<meta\s[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i);
  if (ogTitleMatch) {
    channelName = ogTitleMatch[1];
  } else {
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    if (titleMatch) {
      channelName = titleMatch[1].replace(/ - YouTube$/, "").trim();
    }
  }

  // Extract thumbnail
  let thumbnail = "";

  const ogImageMatch = html.match(/<meta\s[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);
  if (ogImageMatch) {
    thumbnail = ogImageMatch[1];
  }

  return { channelId, channelName, thumbnail };
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
    const info = await resolveChannel(channel);
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
