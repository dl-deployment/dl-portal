export default async function handler(req, res) {
  const url = req.query.url;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing url parameter" });
  }
  if (!url.startsWith("https://poe2db.tw/")) {
    return res.status(400).json({ error: "Only poe2db.tw URLs are allowed" });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    res.status(200).json({ html });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
