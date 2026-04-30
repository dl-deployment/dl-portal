import { put } from "@vercel/blob";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_FILE = path.join(__dirname, "tasks-local.json");
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const blobUrl = process.env.BLOB_URL || "";

async function readTasks() {
  try {
    if (useBlob) {
      if (!blobUrl) return { tasks: [] };
      const res = await fetch(blobUrl, { cache: "no-store" });
      if (!res.ok) return { tasks: [] };
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
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });
  } else {
    writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2));
  }
}

function generateId() {
  const rand = Math.random().toString(36).slice(2, 5);
  return `t_${Date.now()}_${rand}`;
}

export default async function handler(req, res) {
  const apiSecret = process.env.API_SECRET;
  const authHeader = req.headers["x-api-key"];

  if (!apiSecret || authHeader !== apiSecret) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    return await handleMethod(req, res);
  } catch (err) {
    console.error("Tasks API error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleMethod(req, res) {
  const method = req.method;

  if (method === "GET") {
    const data = await readTasks();
    return res.json(data);
  }

  if (method === "POST") {
    const { title, description, dueAt, reminderMinsBefore } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: "Title is required" });
    }
    if (!dueAt) {
      return res.status(400).json({ success: false, error: "Due date is required" });
    }
    if (![15, 30, 60, 1440].includes(reminderMinsBefore)) {
      return res.status(400).json({ success: false, error: "Invalid reminder time" });
    }

    const data = await readTasks();
    const task = {
      id: generateId(),
      title: title.trim().slice(0, 200),
      description: (description || "").trim().slice(0, 1000),
      dueAt,
      reminderMinsBefore,
      completed: false,
      reminderSent: false,
      createdAt: new Date().toISOString(),
    };
    data.tasks.push(task);
    await writeTasks(data);
    return res.json({ success: true, task });
  }

  if (method === "PUT") {
    const { id, ...fields } = req.body || {};
    if (!id) {
      return res.status(400).json({ success: false, error: "Task id is required" });
    }

    const data = await readTasks();
    const idx = data.tasks.findIndex((t) => t.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    const task = data.tasks[idx];
    const dueChanged = fields.dueAt && fields.dueAt !== task.dueAt;
    const reminderChanged =
      fields.reminderMinsBefore !== undefined &&
      fields.reminderMinsBefore !== task.reminderMinsBefore;

    if (fields.title !== undefined) task.title = fields.title.trim().slice(0, 200);
    if (fields.description !== undefined) task.description = fields.description.trim().slice(0, 1000);
    if (fields.dueAt !== undefined) task.dueAt = fields.dueAt;
    if (fields.reminderMinsBefore !== undefined) task.reminderMinsBefore = fields.reminderMinsBefore;
    if (fields.completed !== undefined) task.completed = fields.completed;

    if (dueChanged || reminderChanged) {
      task.reminderSent = false;
    }

    data.tasks[idx] = task;
    await writeTasks(data);
    return res.json({ success: true, task });
  }

  if (method === "DELETE") {
    const id = req.query?.id || new URL(req.url, "http://localhost").searchParams.get("id");
    if (!id) {
      return res.status(400).json({ success: false, error: "Task id is required" });
    }

    const data = await readTasks();
    const before = data.tasks.length;
    data.tasks = data.tasks.filter((t) => t.id !== id);
    if (data.tasks.length === before) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    await writeTasks(data);
    return res.json({ success: true });
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
