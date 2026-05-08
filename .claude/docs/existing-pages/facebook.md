# Facebook Manager

## Files

- `src/apps/facebook/FacebookApp.jsx` — Main component (optimistic state updates)
- `src/apps/facebook/api.js` — Client API helper (fetchPages, addPage, deletePage, createTab, renameTab, deleteTab)
- `src/apps/facebook/facebook.css` — Scoped styles (`.facebook-app`, global CSS variables)
- `src/apps/facebook/components/FacebookForm.jsx` — Add page form (name + url)
- `src/apps/facebook/components/FacebookGrid.jsx` — Card grid display
- `src/pages/FacebookPage.jsx` — Thin page wrapper
- `api/google-sheets.js` — Shared Google Sheets API client (OAuth2 with refresh token)
- `api/facebook/read.js` — POST endpoint, reads all worksheets via `batchGet()`
- `api/facebook/write.js` — POST endpoint, 5 actions: add, delete, create-tab, rename-tab, delete-tab

## Data Model

Storage: Google Sheets (not Supabase). Each worksheet = 1 group/tab. Columns per sheet:
- A: `name` — Facebook page name
- B: `url` — Facebook page URL

Row 1 is headers (auto-created on tab creation). Data starts at row 2. Each row gets a synthetic `id` (= row number) for deletion targeting.

## Environment Variables (server-side only)

- `GOOGLE_CLIENT_ID` — OAuth2 Client ID
- `GOOGLE_CLIENT_SECRET` — OAuth2 Client Secret
- `GOOGLE_REFRESH_TOKEN` — OAuth2 Refresh Token (see `.claude/docs/google-sheets-setup.md`)
- `GOOGLE_SHEET_ID` — Google Sheet spreadsheet ID

## Key Implementation Details

- **Each group is a worksheet tab** — managed via TabBar with full create/rename/delete.
- **TabBar reused** from `src/apps/bookmarks/components/TabBar.jsx` (shared across bookmarks, youtube, facebook).
- **`batchGet()` for reading** — single API call fetches all worksheets instead of N sequential calls. Critical for performance.
- **Optimistic updates** — tab create/rename/delete and page add/delete update local state immediately without re-fetching. No `reload()` after mutations.
- **`visitedTabs` pattern** — tabs rendered lazily on first visit, kept in DOM with `display: none` for instant switching. See `api-and-storage.md` → "Tabbed App Loading Pattern".
- **Row deletion** uses Google Sheets `batchUpdate` with `deleteDimension`.

## Loading Performance

**Problem:** Google Sheets API is slow (~500ms-2s per call). Without optimization, every action triggers a full re-read of all sheets.

**Solutions applied:**
1. **API: `batchGet()`** — `read.js` uses `spreadsheets.values.batchGet()` to fetch all sheet data in 1 call instead of N sequential `values.get()` calls.
2. **Frontend: Optimistic updates** — all mutations update React state immediately without re-fetching. No `await reload()` blocking UI.
3. **`visitedTabs` + `display: none`** — tabs rendered lazily, kept in DOM for instant switching.

**When adding new external-API-backed apps, always apply these patterns:**
- Batch API calls where possible (avoid N+1 sequential requests)
- Optimistic state updates for all mutations (update UI first, call API in background or parallel)
- Only `await reload()` when the result is needed before the next user action

## CSS

Uses global CSS variables from `index.css` (`--bg-card`, `--border`, `--accent`, `--text-bright`, `--text`, `--radius`, `--danger`, etc.). No private `--fb-*` variables.
