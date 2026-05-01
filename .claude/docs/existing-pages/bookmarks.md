# Bookmarks App (`/bookmarks`)

Tabbed bookmark manager for quick access to apps and websites. Data stored in Supabase via serverless API.

## Files

```
src/apps/bookmarks/
├── BookmarksApp.jsx             # Main component — tabs, form toggle, grid
├── bookmarks.css                # Scoped under .bookmarks-app, uses --bm-* variables
├── store.js                     # Async DB CRUD via dbApi
└── components/
    ├── TabBar.jsx               # Add/rename/delete tabs (based on YouTube TabBar)
    ├── BookmarkForm.jsx         # Create/edit form (title, url, description, icon)
    └── BookmarkGrid.jsx         # Card grid with icon, title, description, edit/delete

src/pages/BookmarksPage.jsx      # Thin page wrapper
```

## Data Model (Supabase)

Tables: `tabs` (app='bookmarks'), `bookmarks`

```
tabs:      { id, name, position, app }
bookmarks: { id, tab_id, title, url, description, icon, created_at }
```

JS store uses camelCase; DB uses snake_case.

## Key Implementation Details

- **No Context provider** — uses simpler Tasks pattern (useState + async reload in root component)
- **Tab management** — add (+), rename (double-click), delete (x with confirm). Cannot delete last tab. Deleting a tab also removes its bookmarks.
- **Icon rendering** — `isUrl()` check: URLs render as `<img>`, everything else as emoji text. Default fallback: 🔗
- **Card links** — entire card-link area opens URL in new tab (`target="_blank"`). Edit/Delete buttons are siblings of the `<a>`, not nested inside.
- **Async store** — all store functions return Promises. ID generation uses `maxId + 1`.

## CSS Prefix

`.bookmarks-app` with `--bm-*` variables (accent, surface, border, text, danger, radius).
