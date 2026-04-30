# Bookmarks App (`/bookmarks`)

Tabbed bookmark manager for quick access to apps and websites, with import/export.

## Files

```
src/apps/bookmarks/
├── BookmarksApp.jsx             # Main component — tabs, form toggle, grid
├── bookmarks.css                # Scoped under .bookmarks-app, uses --bm-* variables
├── store.js                     # localStorage CRUD with auto-incrementing IDs
└── components/
    ├── TabBar.jsx               # Add/rename/delete tabs (based on YouTube TabBar)
    ├── BookmarkForm.jsx         # Create/edit form (title, url, description, icon)
    ├── BookmarkGrid.jsx         # Card grid with icon, title, description, edit/delete
    └── DataManager.jsx          # Export/import data (JSON)

src/data/bookmarks-default.json  # Seed data (default tabs)
src/pages/BookmarksPage.jsx      # Thin page wrapper
```

## Data Model (localStorage)

Key: `dl-bookmarks-data`

```js
{
  tabs: [{
    id: number,
    name: string,
    position: number
  }],
  bookmarks: [{
    id: number,
    tabId: number,              // FK to tabs.id
    title: string,              // max 100 chars
    url: string,                // max 500 chars, required
    description: string,        // max 200 chars, optional
    icon: string,               // emoji or favicon URL, optional
    createdAt: string           // ISO 8601
  }],
  nextTabId: number,            // excluded from export
  nextBookmarkId: number        // excluded from export
}
```

## Key Implementation Details

- **No Context provider** — uses simpler Tasks pattern (useState + reload in root component)
- **Tab management** — add (+), rename (double-click), delete (x with confirm). Cannot delete last tab. Deleting a tab also removes its bookmarks.
- **Icon rendering** — `isUrl()` check: URLs render as `<img>`, everything else as emoji text. Default fallback: 🔗
- **Card links** — entire card-link area opens URL in new tab (`target="_blank"`). Edit/Delete buttons are siblings of the `<a>`, not nested inside.
- **Import/Export** — same pattern as Tasks DataManager. Export excludes `nextTabId`/`nextBookmarkId`. Import validates `tabs` array, defaults `bookmarks` to `[]`, recalculates IDs. 5MB file size limit.

## CSS Prefix

`.bookmarks-app` with `--bm-*` variables (accent, surface, border, text, danger, radius).
