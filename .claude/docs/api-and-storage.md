# API & Storage Patterns

## Serverless API Functions

Endpoint files live in `api/`. Each file exports a single handler.

### File Structure

```
api/
├── <endpoint-name>.js    # POST /api/<endpoint-name>
├── db/
│   ├── read.js            # POST /api/db/read — read app data from Supabase
│   └── write.js           # POST /api/db/write — write app data to Supabase
├── supabase.js            # Supabase client singleton (lazy-init Proxy)
├── dev-server.js          # Express wrapper for local dev (port 3001)
└── package.json           # Server-side dependencies (fast-xml-parser, express, dotenv, @supabase/supabase-js)
```

### Handler Template

```js
// api/<endpoint-name>.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { field1, field2 } = req.body;
    // ... do work ...
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
```

### Register in Dev Server

Add a route in `api/dev-server.js`:

```js
app.post("/api/<endpoint-name>", async (req, res) => {
  const handler = await loadHandler("<endpoint-name>");
  await handler(req, res);
});
```

### Environment Variables

Server-side env vars are accessed via `process.env.<NAME>`. Client-side env vars must be prefixed `VITE_` and accessed via `import.meta.env.VITE_<NAME>`.

**Required env vars for Supabase:**
- `SUPABASE_URL` — Supabase project URL (server-side only)
- `SUPABASE_SERVICE_KEY` — service_role key (server-side only, bypasses RLS)
- `VITE_API_SECRET` — API key for client → serverless auth (matches existing `x-api-key` pattern)

### API Client Template (Frontend)

```js
// src/apps/<name>/api.js
export async function doSomething(data) {
  try {
    const res = await fetch("/api/<endpoint-name>", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
```

### Routing

- **Dev:** Vite proxies `/api` → `http://localhost:3001` (configured in `vite.config.js`).
- **Prod:** Vercel routes `/api/*` to serverless functions (configured in `vercel.json`).

## Database Storage Pattern (Supabase)

All persistent data is stored in Supabase (PostgreSQL). No localStorage. The data flow is:

```
Client (dbApi.js) → Serverless API (api/db/*) → Supabase
```

### Supabase Client (`api/supabase.js`)

Uses a lazy-init Proxy pattern to handle ESM import ordering:

```js
import { createClient } from "@supabase/supabase-js";

let _supabase = null;
export function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (url && key) _supabase = createClient(url, key);
  }
  return _supabase;
}

export const supabase = new Proxy({}, {
  get(_, prop) {
    const client = getSupabase();
    if (!client) throw new Error("Supabase not configured");
    return typeof client[prop] === "function" ? client[prop].bind(client) : client[prop];
  },
});
```

### Client-Side API (`src/lib/dbApi.js`)

Single interface for all DB operations. Auth via `x-api-key` header.

```js
import { dbApi } from "../../lib/dbApi.js";

const data = await dbApi.read("youtube");   // { data: { tabs, channels, videos } }
await dbApi.write("youtube", { tabs, channels, videos });
```

### Store Template (Async, DB-only)

```js
// src/apps/<name>/store.js
import { dbApi } from "../../lib/dbApi.js";

const APP = "<name>";

async function readStore() {
  const { data } = await dbApi.read(APP);
  return data || { items: [] };
}

async function writeStore(data) {
  await dbApi.write(APP, data);
}

export async function getItems() {
  const store = await readStore();
  return store.items;
}

export async function createItem(fields) {
  const store = await readStore();
  const maxId = store.items.reduce((m, i) => Math.max(m, i.id), 0);
  const item = { id: maxId + 1, ...fields, createdAt: new Date().toISOString() };
  store.items.push(item);
  await writeStore(store);
  return item;
}

export async function updateItem(id, fields) {
  const store = await readStore();
  const item = store.items.find((i) => i.id === id);
  if (!item) return null;
  Object.assign(item, fields);
  await writeStore(store);
  return item;
}

export async function deleteItem(id) {
  const store = await readStore();
  store.items = store.items.filter((i) => i.id !== id);
  await writeStore(store);
}
```

### Database Schema

Relational tables in Supabase with RLS enabled (service_role key bypasses RLS). Shared `tabs` table with `app` column discriminator. JS uses camelCase, DB uses snake_case — conversion happens in `api/db/read.js` and `api/db/write.js`.

Tables: `tabs`, `channels`, `videos`, `pages`, `posts`, `bookmarks`, `tasks`, `color_history`.

### Key Differences from Old localStorage Pattern

- All store functions are **async** (return Promises)
- ID generation uses `maxId + 1` instead of `nextId` counter
- No `exportData()` / `importData()` / `DataManager` components
- App components must use `await` for all store calls
- Init effects use `store.getTabs().then(...)` pattern
