export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const apiSecret = process.env.API_SECRET;
  const authHeader = req.headers["x-api-key"];

  if (!apiSecret || authHeader !== apiSecret) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const { message } = req.body || {};

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: "Message is required" });
  }

  if (message.length > 4096) {
    return res.status(400).json({ success: false, error: "Message too long (max 4096 chars)" });
  }

  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;

  if (!botToken || !chatId) {
    return res.status(500).json({ success: false, error: "Telegram not configured" });
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message.trim(), parse_mode: "HTML" }),
    });

    const data = await tgRes.json();

    if (!data.ok) {
      return res.status(502).json({ success: false, error: data.description ?? "Telegram API error" });
    }

    res.json({ success: true });
  } catch {
    res.status(502).json({ success: false, error: "Failed to reach Telegram API" });
  }
}
