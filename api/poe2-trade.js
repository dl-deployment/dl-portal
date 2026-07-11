export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url, payload, cookie: clientCookie } = req.body || {};
  if (!url || !payload) {
    return res.status(400).json({ error: "Missing url or payload" });
  }

  const cookie = clientCookie || process.env.POE_COOKIE || "";

  const headers = {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    "content-type": "application/json",
    origin: "https://www.pathofexile.com",
    pragma: "no-cache",
    referer: url.replace("/api/trade2/", "/trade2/"),
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
    "x-requested-with": "XMLHttpRequest",
  };

  if (cookie) {
    headers.cookie = cookie.startsWith("POESESSID=") ? cookie : `POESESSID=${cookie}`;
  }

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers,
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: "Upstream error",
        status: upstream.status,
        data,
      });
    }

    res.status(200).json(data);
  } catch (err) {
    res
      .status(502)
      .json({ error: "Failed to reach trade API", message: err.message });
  }
}
