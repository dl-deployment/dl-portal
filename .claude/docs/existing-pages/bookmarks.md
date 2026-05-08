# Bookmarks App (`/bookmarks`)

Tabbed bookmark manager for quick access to apps and websites. Data stored in Supabase via serverless API.

## Files

```
src/apps/bookmarks/
├── BookmarksApp.jsx             # Main component — tabs, form toggle, grid
├── bookmarks.css                # Scoped under .bookmarks-app, uses global CSS variables
├── store.js                     # Async DB CRUD via dbApi
└── components/
    ├── TabBar.jsx               # Shared tab bar (used by bookmarks, youtube, facebook)
    ├── BookmarkForm.jsx         # Create/edit form (title, url, description, icon)
    └── BookmarkGrid.jsx         # Card grid with icon, title, description, edit/delete

src/pages/BookmarksPage.jsx      # Thin page wrapper
```

## Data Model (Supabase)

Tables: `tabs` (app_id=3), `bookmarks`

```
tabs:      { id, name, position, app_id }
bookmarks: { id, tab_id, title, url, description, icon }
```

JS store uses camelCase; DB uses snake_case.

## Key Implementation Details

- **No Context provider** — uses simpler Tasks pattern (useState + async reload in root component)
- **Shared TabBar** — `TabBar.jsx` is the shared component used by bookmarks, youtube, and facebook. Lives in bookmarks but imported by other apps. Supports add (+), rename (double-click), delete (x with confirm). Cannot delete last tab. Uses `submittedRef` to prevent blur/submit race condition on rename.
- **`visitedTabs` pattern** — tabs rendered lazily on first visit, kept in DOM with `display: none` for instant switching. See `api-and-storage.md` → "Tabbed App Loading Pattern".
- **Icon rendering** — `isUrl()` check: URLs render as `<img>`, everything else as emoji text. Default fallback: 🔗
- **Card links** — entire card-link area opens URL in new tab (`target="_blank"`). Edit/Delete buttons are siblings of the `<a>`, not nested inside.
- **Async store** — all store functions return Promises. Tab ID from DB SERIAL (via `dbApi.createTab`). Bookmark ID uses `maxId + 1` (local to bookmarks table).

## CSS

Uses global CSS variables from `index.css` (`--bg-card`, `--border`, `--accent`, `--text-bright`, `--text`, `--radius`, `--danger`). No private `--bm-*` variables.
