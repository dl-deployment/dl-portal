# YouTube App (`/youtube`)

Tracks YouTube channels via RSS feeds. Data stored in Supabase via serverless API.

## Origin

Ported from `dl-social` (Vite + React). Minimal changes — adjusted import paths, scoped CSS.

## Files

```
src/apps/youtube/
├── YouTubeApp.jsx          # Main component (wraps with YouTubeProvider)
├── YouTubeContext.jsx       # React Context for shared state across components
├── youtube.css              # Scoped under .youtube-app, uses --yt-* variables
├── api.js                   # HTTP client (resolveChannel, fetchVideos)
├── store.js                 # Async DB CRUD via dbApi (tabs, channels, videos)
├── utils.js                 # Utility functions
└── components/
    ├── TabBar.jsx            # Tab management (create, rename, delete)
    ├── AddChannel.jsx        # Add channel by URL/@handle
    ├── ChannelList.jsx       # List of tracked channels per tab
    └── VideoGrid.jsx         # Video thumbnails grid with skeleton loading
```

## API Endpoints

- `POST /api/resolve-channel` — resolves YouTube URL/@handle to channel info (name, ID, thumbnail).
- `POST /api/fetch-videos` — fetches videos from YouTube RSS feed for a channel ID.
- Server-side files: `api/resolve-channel.js`, `api/fetch-videos.js`.
- Uses `fast-xml-parser` for RSS parsing.

## Data Model (Supabase)

Tables: `tabs` (app='youtube'), `channels`, `videos`

```
tabs:     { id, name, position, app }
channels: { tab_id, channel_id, channel_name, channel_thumb }
videos:   { channel_id, video_id, title, published_at, thumb_url }
```

JS store uses camelCase; DB uses snake_case (converted in api/db/read.js and write.js).

## Key Implementation Details

- **Manual sync only:** Videos are fetched only when the user clicks "Fetch Videos". No background polling.
- **Context pattern:** Uses React Context (`YouTubeContext.jsx`) to share state across tab bar, channel list, and video grid.
- **Range filter:** Videos filterable by "Week" or "Month".
- **Async store:** All store functions return Promises. ID generation uses `maxId + 1`.
- CSS prefix: `.youtube-app`, `--yt-*` variables.
