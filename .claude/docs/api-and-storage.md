# API & Storage Patterns

## Serverless API Functions

Endpoint files live in `api/`. Each file exports a single handler.

### File Structure

```
api/
├── <endpoint-name>.js    # POST /api/<endpoint-name>
├── db/
│   ├── read.js            # POST /api/db/read — read app data from Supabase
│   ├── write.js           # POST /api/db/write — write app data to Supabase
│   └── create-tab.js      # POST /api/db/create-tab — create tab with DB-generated ID
├── supabase.js            # Supabase client singleton (lazy-init Proxy)
├── dev-server.js          # Express wrapper for local dev (port 3002)
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

- **Dev:** Vite proxies `/api` → `http://localhost:3002` (configured in `vite.config.js`).
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

const data = await dbApi.read("youtube");   // { data: { tabs, channels } }
await dbApi.write("youtube", { tabs, channels });
await dbApi.createTab("youtube", "Tab Name", 0);  // { tab: { id, name, position } }
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
  const item = { id: Date.now(), ...fields, createdAt: new Date().toISOString() };
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

Relational tables in Supabase with RLS enabled (service_role key bypasses RLS). `apps` table as registry. Shared `tabs` table with `app_id` FK to `apps`. Each app's data table is named after the app (`youtube`, `bookmarks`, `tasks`). JS uses camelCase, DB uses snake_case — conversion happens in `api/db/read.js` and `api/db/write.js`. Server-side uses static `APP_IDS` map for app name → id lookup.

Supabase tables: `apps`, `tabs`, `youtube`, `bookmarks`, `tasks`.

localStorage (ephemeral content, can be re-fetched):
- `dl-youtube-videos` — fetched video data
- `dl-color-history` — recent color picks (max 16)

## Tabbed App Loading Pattern

All tabbed apps (bookmarks, youtube) use the same set of patterns for fast tab switching and responsive mutations. **Always follow these patterns when building a new tabbed app.**

### 1. `visitedTabs` — Lazy Tab Rendering

Only render a tab's content after the user has visited it. Tabs that have never been opened don't render at all, saving initial load time. Once visited, tabs stay in the DOM (hidden via `display: none`) so switching back is instant — no re-render, no re-fetch.

```jsx
const visitedTabs = useRef(new Set());

function handleSelectTab(id) {
  visitedTabs.current.add(id);
  setActiveTabId(id);
}

// In render — only mount visited tabs, hide inactive ones
{tabs.filter((t) => visitedTabs.current.has(t.id)).map((t) => (
  <div key={t.id} style={{ display: t.id === activeTabId ? undefined : "none" }}>
    <ContentGrid items={itemsMap[t.id] || []} />
  </div>
))}
```

**Why `display: none` instead of conditional render:**
- Switching tabs is instant (DOM already exists, just toggle visibility)
- Scroll position, form state, etc. are preserved per tab
- No re-fetch or re-render needed on tab switch

**Why not render all tabs on mount:**
- Tabs with many items would slow initial render
- `visitedTabs` Set is the middle ground — lazy mount, persistent once mounted

### 2. Optimistic State Updates

Update React state **immediately** on user action. Call the API in the background. Never `await reload()` after a mutation — this causes the UI to freeze while waiting for a round-trip to the server.

```jsx
// GOOD — optimistic: UI updates instantly
async function handleCreateTab(name) {
  const tab = await api.createTab(name);       // API call returns new tab
  setTabs((prev) => [...prev, tab]);           // Update state with result
  setItemsMap((prev) => ({ ...prev, [tab.id]: [] }));
  visitedTabs.current.add(tab.id);
  setActiveTabId(tab.id);
  // No reload() — state is already correct
}

async function handleRenameTab(id, name) {
  setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  await api.renameTab(id, name);               // Fire-and-forget
}

async function handleDeleteTab(id) {
  const remaining = tabs.filter((t) => t.id !== id);
  setTabs(remaining);                          // Remove from state immediately
  setItemsMap((prev) => { const next = { ...prev }; delete next[id]; return next; });
  visitedTabs.current.delete(id);
  if (activeTabId === id) {
    const nextId = remaining[0]?.id ?? null;
    if (nextId) visitedTabs.current.add(nextId);
    setActiveTabId(nextId);
  }
  await api.deleteTab(id);                     // Fire-and-forget
}

// BAD — blocks UI with redundant reload
async function handleCreateTab(name) {
  await api.createTab(name);
  await reload();  // ← Don't do this! Fetches everything again, slow
}
```

### 3. Batch API Calls

When the API needs to fetch data from multiple sources (e.g., multiple sheet tabs, multiple DB tables), batch into a single request instead of N sequential calls.

```js
// GOOD — 1 API call for all sheets
const batchResult = await sheets.spreadsheets.values.batchGet({
  spreadsheetId: SPREADSHEET_ID,
  ranges,  // Array of all sheet ranges
});

// BAD — N sequential API calls (1 per sheet tab)
for (const tab of tabs) {
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${tab.name}'!A2:B`,
  });
}
```

### 4. Initial Load Pattern

Load all tabs + first tab's data on mount. Set `ready` flag only after initial data is available.

```jsx
const [ready, setReady] = useState(false);

useEffect(() => {
  fetchAllData().then(({ tabs, items }) => {
    setTabs(tabs);
    setItemsMap(buildMap(tabs, items));
    if (tabs.length > 0) {
      const firstId = tabs[0].id;
      visitedTabs.current.add(firstId);
      setActiveTabId(firstId);
    }
    setReady(true);
  });
}, []);

// Show loading state until ready
{!ready ? <div className="app-loading">Loading...</div> : <>{/* app content */}</>}
```

### Checklist for New Tabbed Apps

- [ ] `visitedTabs = useRef(new Set())` — track which tabs have been opened
- [ ] `handleSelectTab` adds to `visitedTabs` before setting `activeTabId`
- [ ] Render loop: `tabs.filter(t => visitedTabs.current.has(t.id)).map(...)` with `display: none`
- [ ] All mutations use optimistic state updates — no `await reload()` after write
- [ ] `handleDeleteTab` cleans up `visitedTabs`, `itemsMap`, and resets `activeTabId`
- [ ] `handleCreateTab` adds to `visitedTabs` and sets `activeTabId`
- [ ] API reads use batch calls where possible (e.g., `batchGet` instead of N `get` calls)
- [ ] Initial load sets `ready = true` only after data is available

### Key Differences from Old localStorage Pattern

- All store functions are **async** (return Promises)
- Tab ID generation uses DB `SERIAL` auto-increment — client calls `dbApi.createTab(app, name, position)` to get the DB-generated ID back
- Bookmark ID uses client-side `maxId + 1` (local to bookmarks table)
- No `exportData()` / `importData()` / `DataManager` components
- App components must use `await` for all store calls
- Init effects use `store.getTabs().then(...)` pattern
- Hybrid stores: metadata via dbApi (Supabase), content data via localStorage
