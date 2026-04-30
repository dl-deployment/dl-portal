# API & Storage Patterns

## Serverless API Functions

Endpoint files live in `api/`. Each file exports a single handler.

### File Structure

```
api/
├── <endpoint-name>.js    # POST /api/<endpoint-name>
├── dev-server.js          # Express wrapper for local dev (port 3001)
└── package.json           # Server-side dependencies (fast-xml-parser, express, dotenv)
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

## localStorage Storage Pattern

For client-side persistence, each app uses a `store.js` module.

### Basic Store Template

```js
// src/apps/<name>/store.js
const KEY = "dl-<name>-data";

function getStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { items: [], nextId: 1 };
    return JSON.parse(raw);
  } catch {
    return { items: [], nextId: 1 };
  }
}

function saveStore(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getItems() {
  return getStore().items;
}

export function createItem(fields) {
  const store = getStore();
  const item = { id: store.nextId++, ...fields, createdAt: new Date().toISOString() };
  store.items.push(item);
  saveStore(store);
  return item;
}

export function updateItem(id, fields) {
  const store = getStore();
  const item = store.items.find((i) => i.id === id);
  if (!item) return null;
  Object.assign(item, fields);
  saveStore(store);
  return item;
}

export function deleteItem(id) {
  const store = getStore();
  store.items = store.items.filter((i) => i.id !== id);
  saveStore(store);
}
```

### Export/Import Pattern

```js
export function exportData() {
  const store = getStore();
  const { nextId: _, ...data } = store;
  return JSON.stringify(data, null, 2);
}

export function importData(json) {
  const data = JSON.parse(json);
  if (!data.items || !Array.isArray(data.items)) throw new Error("Invalid data");
  data.nextId = Math.max(...data.items.map((i) => i.id), 0) + 1;
  saveStore(data);
}
```

### DataManager Component

Both YouTube and Tasks apps include a `DataManager` component for export/import. If your new app uses localStorage, consider reusing this pattern. See `src/apps/tasks/components/DataManager.jsx` or `src/apps/youtube/components/DataManager.jsx` for reference.
