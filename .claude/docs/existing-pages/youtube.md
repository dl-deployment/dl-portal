# YouTube App (`/youtube`)

Tracks YouTube channels via web scraping. Metadata stored in Supabase (`tabs` + `youtube` tables); videos stored in localStorage.

## Origin

Ported from `dl-social` (Vite + React). Minimal changes — adjusted import paths, scoped CSS.

## Files

```
src/apps/youtube/
├── YouTubeApp.jsx          # Main component (wraps with YouTubeProvider)
├── YouTubeContext.jsx       # React Context for shared state across components
├── youtube.css              # Scoped under .youtube-app, uses --yt-* variables
├── api.js                   # HTTP client (resolveChannel, fetchVideos)
├── store.js                 # Hybrid store: tabs+youtube via dbApi, videos via localStorage
├── utils.js                 # Utility functions
└── components/
    ├── TabBar.jsx            # Tab management (create, rename, delete)
    ├── ChannelForm.jsx       # Add/edit channel form panel (URL/@handle input for add, name edit)
    ├── ChannelGrid.jsx       # Card grid display of tracked channels (thumbnail, name, edit/delete)
    └── VideoGrid.jsx         # Video thumbnails grid with skeleton loading
```

## API Endpoints

- `POST /api/resolve-channel` — resolves YouTube URL/@handle to channel info (name, ID, thumbnail). Scrapes YouTube channel page HTML (og:title, og:image, externalId).
- `POST /api/fetch-videos` — fetches videos by scraping `ytInitialData` from the channel's `/videos` page. Supports both `videoRenderer` (legacy) and `lockupViewModel` (current) formats. Parses relative time strings ("2 days ago") to approximate ISO dates.
- Server-side files: `api/resolve-channel.js`, `api/fetch-videos.js`.
- No external dependencies for YouTube scraping (no RSS, no XML parser needed).

## Data Model

**Supabase** (tabs, youtube):
```
tabs:    { id, name, position, app_id=1 }
youtube: { id, channel_name, thumbnail, tab_id }
```

**localStorage** key `dl-youtube-videos` (videos):
```
[{ videoId, channelId, channelName, title, publishedAt, thumbnail, link }]
```

## Key Implementation Details

- **Manual sync only:** Videos are fetched only when the user clicks "Fetch Videos". No background polling.
- **Context pattern:** Uses React Context (`YouTubeContext.jsx`) to share state across tab bar, channel grid, and video grid.
- **Card grid + form panel UI:** Channels displayed as cards with thumbnail. Add/edit via form panel (same pattern as Bookmarks).
- **Range filter:** Videos filterable by "Week" or "Month".
- **Hybrid store:** Tabs and youtube records are async (Supabase via dbApi). Videos are synchronous (localStorage). Cascade deletes update both. Tab IDs are DB-generated via `dbApi.createTab()`.
- CSS prefix: `.youtube-app`, `--yt-*` variables.
