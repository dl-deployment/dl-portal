# YouTube App (`/youtube`)

Tracks YouTube channels via RSS feeds. Stores everything in localStorage.

## Origin

Ported from `dl-social` (Vite + React). Minimal changes — adjusted import paths, scoped CSS.

## Files

```
src/apps/youtube/
├── YouTubeApp.jsx          # Main component (wraps with YouTubeProvider)
├── YouTubeContext.jsx       # React Context for shared state across components
├── youtube.css              # Scoped under .youtube-app, uses --yt-* variables
├── api.js                   # HTTP client (resolveChannel, fetchVideos)
├── store.js                 # localStorage CRUD (tabs, channels, videos)
├── utils.js                 # Utility functions
└── components/
    ├── TabBar.jsx            # Tab management (create, rename, delete)
    ├── AddChannel.jsx        # Add channel by URL/@handle
    ├── ChannelList.jsx       # List of tracked channels per tab
    ├── VideoGrid.jsx         # Video thumbnails grid with skeleton loading
    └── DataManager.jsx       # Export/import data (JSON)
```

## API Endpoints

- `POST /api/resolve-channel` — resolves YouTube URL/@handle to channel info (name, ID, thumbnail).
- `POST /api/fetch-videos` — fetches videos from YouTube RSS feed for a channel ID.
- Server-side files: `api/resolve-channel.js`, `api/fetch-videos.js`.
- Uses `fast-xml-parser` for RSS parsing.

## Data Model (localStorage)

```
{
  tabs: [{ id, name }],
  channels: [{ tabId, channelId, channelName, channelThumb }],
  videos: [{ channelId, videoId, title, publishedAt, thumbUrl }]
}
```

## Key Implementation Details

- **Manual sync only:** Videos are fetched only when the user clicks "Fetch Videos". No background polling.
- **Context pattern:** Uses React Context (`YouTubeContext.jsx`) to share state across tab bar, channel list, and video grid.
- **Range filter:** Videos filterable by "Week" or "Month".
- **DataManager:** Export/import full dataset as JSON.
- CSS prefix: `.youtube-app`, `--yt-*` variables.
