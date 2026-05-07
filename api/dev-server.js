import express from "express";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root (parent of api/)
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = express();
app.use(express.json());

const handlerCache = new Map();

async function loadHandler(name) {
  const filePath = path.join(__dirname, `${name}.js`);
  const mtime = fs.statSync(filePath).mtimeMs;
  const cached = handlerCache.get(filePath);
  if (cached && cached.mtime === mtime) return cached.handler;
  const mod = await import(pathToFileURL(filePath).href + "?t=" + mtime);
  handlerCache.set(filePath, { mtime, handler: mod.default });
  return mod.default;
}

app.post("/api/resolve-channel", async (req, res) => {
  const handler = await loadHandler("resolve-channel");
  await handler(req, res);
});

app.post("/api/fetch-videos", async (req, res) => {
  const handler = await loadHandler("fetch-videos");
  await handler(req, res);
});

app.post("/api/send-telegram", async (req, res) => {
  const handler = await loadHandler("send-telegram");
  await handler(req, res);
});

app.post("/api/db/read", async (req, res) => {
  const handler = await loadHandler("db/read");
  await handler(req, res);
});

app.post("/api/db/write", async (req, res) => {
  const handler = await loadHandler("db/write");
  await handler(req, res);
});

app.post("/api/db/create-tab", async (req, res) => {
  const handler = await loadHandler("db/create-tab");
  await handler(req, res);
});

app.get("/api/fetch-free-games", async (req, res) => {
  const handler = await loadHandler("fetch-free-games");
  await handler(req, res);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API dev server running on http://localhost:${PORT}`);
});
