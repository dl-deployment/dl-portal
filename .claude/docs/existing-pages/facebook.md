# Facebook App

Track Facebook Pages/Groups via RSS feeds. Users create RSS feeds on rss.app (or any RSS service) then paste the feed URL into the app. Data stored in Supabase via serverless API.

## Files

| File | Purpose |
|------|---------|
| `src/apps/facebook/FacebookApp.jsx` | Provider wrapper + inner component |
| `src/apps/facebook/FacebookContext.jsx` | State management, handlers, context |
| `src/apps/facebook/store.js` | Async DB CRUD via dbApi |
| `src/apps/facebook/api.js` | HTTP client for `/api/fetch-facebook-posts` |
| `src/apps/facebook/utils.js` | `timeAgo()` relative date utility |
| `src/apps/facebook/facebook.css` | Scoped styles with `--fb-*` CSS variables |
| `src/apps/facebook/components/TabBar.jsx` | Tab create/rename/delete/switch UI |
| `src/apps/facebook/components/AddPage.jsx` | Feed URL input form with optional name |
| `src/apps/facebook/components/PageList.jsx` | Saved feeds as chips |
| `src/apps/facebook/components/PostList.jsx` | Post list view with content preview |
| `src/pages/FacebookPage.jsx` | Thin route wrapper |
| `api/fetch-facebook-posts.js` | Serverless: fetch & parse RSS/Atom feeds |

## Data Model (Supabase)

Tables: `tabs` (app='facebook'), `pages`, `posts`

```
tabs:  { id, name, position, app }
pages: { tab_id, feed_url, page_name }
posts: { post_id, content, published_at, link, feed_url }
```

JS store uses camelCase; DB uses snake_case.

## Key Implementation Details

- **Feed URL approach**: User creates RSS feed on rss.app (or similar service), then pastes the feed URL. No scraping or API tokens needed.
- **No resolve step**: Pages stored by feed URL directly. Optional name field; if omitted, name extracted from URL path.
- **Backend**: Fetches and parses both Atom and RSS 2.0 feed formats using `fast-xml-parser`.
- **4 range options**: hour / day / week / month.
- **List view**: Posts displayed as a vertical list with content preview, not a card grid.
- **Cascade deletes**: Deleting a tab removes its pages and posts; deleting a page removes its posts.
- **Deduplication**: Pages by `feedUrl`, posts by `postId`.
- **Async store**: All store functions return Promises. ID generation uses `maxId + 1`.

## CSS Prefix

All selectors scoped under `.facebook-app` with `--fb-*` variables. Accent color: Facebook blue `#1877f2`.

## Environment Variables

None required. Feeds are fetched directly from the URL provided by the user.
