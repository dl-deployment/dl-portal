import { put, list } from "@vercel/blob";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_FILE = path.join(__dirname, "tasks-local.json");
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

async function readTasks() {
  try {
    if (useBlob) {
      const { blobs } = await list({ prefix: "tasks.json" });
      if (blobs.length === 0) return { tasks: [] };
      const res = await fetch(blobs[0].downloadUrl);
      return res.json();
    }
    if (!existsSync(LOCAL_FILE)) return { tasks: [] };
    return JSON.parse(readFileSync(LOCAL_FILE, "utf-8"));
  } catch {
    return { tasks: [] };
  }
}

async function writeTasks(data) {
  if (useBlob) {
    await put("tasks.json", JSON.stringify(data), {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json",
    });
  } else {
    writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2));
  }
}

async function sendTelegram(message) {
  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;
  if (!botToken || !chatId) return false;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

function formatDue(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function reminderLabel(mins) {
  if (mins === 1440) return "1 day";
  if (mins === 60) return "1 hour";
  return `${mins} mins`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const apiSecret = process.env.API_SECRET;
  const authHeader = req.headers["x-api-key"];
  const querySecret =
    req.query?.secret ||
    new URL(req.url, "http://localhost").searchParams.get("secret");
  const isVercelCron = req.headers["x-vercel-cron"] !== undefined;

  if (!isVercelCron && authHeader !== apiSecret && querySecret !== apiSecret) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const data = await readTasks();
  const now = Date.now();
  let sent = 0;

  for (const task of data.tasks) {
    if (task.completed || task.reminderSent) continue;

    const dueTime = new Date(task.dueAt).getTime();
    const reminderAt = dueTime - task.reminderMinsBefore * 60000;

    if (now >= reminderAt) {
      const message =
        `<b>Task Reminder</b>\n` +
        `<b>${task.title}</b>\n` +
        (task.description ? `${task.description}\n` : "") +
        `Due: ${formatDue(task.dueAt)} (in ${reminderLabel(task.reminderMinsBefore)})`;

      const ok = await sendTelegram(message);
      if (ok) {
        task.reminderSent = true;
        sent++;
      }
    }
  }

  if (sent > 0) {
    await writeTasks(data);
  }

  res.json({ success: true, sent, checked: data.tasks.length });
}
