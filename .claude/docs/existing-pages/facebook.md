# Facebook App

Track Facebook Pages/Groups via RSS feeds. Users create RSS feeds on rss.app (or any RSS service) then paste the feed URL into the app. Metadata stored in Supabase (`tabs` + `facebook` tables); posts stored in localStorage.

## Files

| File | Purpose |
|------|---------|
| `src/apps/facebook/FacebookApp.jsx` | Provider wrapper + inner component |
| `src/apps/facebook/FacebookContext.jsx` | State management, handlers, context |
| `src/apps/facebook/store.js` | Hybrid store: tabs+facebook via dbApi, posts via localStorage |
| `src/apps/facebook/api.js` | HTTP client for `/api/fetch-facebook-posts` |
| `src/apps/facebook/utils.js` | `timeAgo()` relative date utility |
| `src/apps/facebook/facebook.css` | Scoped styles with `--fb-*` CSS variables |
| `src/apps/facebook/components/TabBar.jsx` | Tab create/rename/delete/switch UI |
| `src/apps/facebook/components/PageForm.jsx` | Add/edit feed form panel (URL + name fields) |
| `src/apps/facebook/components/PageGrid.jsx` | Card grid display of tracked feeds (icon, name, URL, edit/delete) |
| `src/apps/facebook/components/PostList.jsx` | Post list view with content preview |
| `src/pages/FacebookPage.jsx` | Thin route wrapper |
| `api/fetch-facebook-posts.js` | Serverless: fetch & parse RSS/Atom feeds |

## Data Model

**Supabase** (tabs, facebook):
```
tabs:     { id, name, position, app_id=2 }
facebook: { id (feed URL), page_name, thumbnail, tab_id }
```

**localStorage** key `dl-facebook-posts` (posts):
```
[{ postId, feedUrl, pageName, title, link, content, publishedAt }]
```

## Key Implementation Details

- **Feed URL approach**: User creates RSS feed on rss.app (or similar service), then pastes the feed URL. No scraping or API tokens needed.
- **No resolve step**: Pages stored by feed URL as `id`. Optional name field; if omitted, name extracted from URL path.
- **Backend**: Fetches and parses both Atom and RSS 2.0 feed formats using `fast-xml-parser`.
- **3 range options**: day / week / month. Default: day.
- **List view**: Posts displayed as a vertical list with content preview, not a card grid.
- **Card grid + form panel UI:** Feeds displayed as cards. Add/edit via form panel (same pattern as Bookmarks).
- **Cascade deletes**: Deleting a tab removes its feeds and posts; deleting a feed removes its posts.
- **Deduplication**: Feeds by `feedUrl` (DB `id`), posts by `postId`.
- **Hybrid store**: Tabs and facebook records are async (Supabase via dbApi). Posts are synchronous (localStorage). Cascade deletes update both. Tab IDs are DB-generated via `dbApi.createTab()`.

## CSS Prefix

All selectors scoped under `.facebook-app` with `--fb-*` variables. Accent color: Facebook blue `#1877f2`.

## Environment Variables

None required. Feeds are fetched directly from the URL provided by the user.
