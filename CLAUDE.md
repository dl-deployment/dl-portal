# CLAUDE.md — DL Portal

## Project Overview

DL Portal is a unified web portal that integrates three separate personal projects into a single React application with shared layout and routing. Each sub-project lives in `src/apps/` and is rendered as a route. The architecture is designed for easy expansion — adding a new project requires only a new folder in `src/apps/`, a route in `App.jsx`, and an entry in `src/config/projects.js`.

**Architecture:** React SPA (Vite) + Vercel Serverless API

## Tech Stack

- **Frontend:** React 19, Vite 8, React Router DOM 7, vanilla CSS
- **Backend:** Vercel serverless functions (plain JS, no framework)
- **Dev tooling:** concurrently (runs Vite + Express API dev server together)
- **Deployment:** Vercel (static frontend + serverless `/api/*` routes)

## Project Structure

```
dl-portal/
├── api/                              # Vercel serverless functions + local dev server
│   ├── resolve-channel.js            # POST /api/resolve-channel — resolves YouTube URL/@handle to channel info
│   ├── fetch-videos.js               # POST /api/fetch-videos — fetches videos from YouTube RSS
│   ├── send-telegram.js              # POST /api/send-telegram — sends message via Telegram Bot API
│   ├── dev-server.js                 # Express wrapper for local development (port 3001)
│   └── package.json                  # fast-xml-parser + express
├── src/
│   ├── main.jsx                      # React entry point
│   ├── App.jsx                       # BrowserRouter + Routes (/, /timeline, /telegram, /youtube)
│   ├── index.css                     # Global dark theme CSS with sidebar layout
│   ├── components/
│   │   └── Layout.jsx                # Sidebar navigation + Outlet, mobile hamburger menu
│   ├── pages/
│   │   ├── Home.jsx                  # Dashboard with project cards
│   │   ├── TimelinePage.jsx          # Wrapper for Timeline
│   │   ├── TelegramPage.jsx          # Wrapper for TelegramForm
│   │   └── YouTubePage.jsx           # Wrapper for YouTubeApp
│   ├── apps/
│   │   ├── timeline/                 # Vietnamese event timeline (converted from vanilla JS)
│   │   │   ├── Timeline.jsx          # Main component — events, countdown, lunar/solar dates
│   │   │   ├── timeline.css          # Scoped styles under .timeline-app
│   │   │   ├── lunar.js              # Pure functions: solarToLunar(), calcDaysLeft(), etc.
│   │   │   └── events.json           # Vietnamese events data
│   │   ├── telegram/                 # Telegram messenger (converted from Next.js TypeScript)
│   │   │   ├── TelegramForm.jsx      # Message form, sends to /api/send-telegram
│   │   │   └── telegram.css          # Scoped styles under .telegram-app
│   │   └── youtube/                   # YouTube tracker (ported from dl-social)
│   │       ├── YouTubeApp.jsx         # Main component — tabs, channels, video fetching
│   │       ├── youtube.css            # Scoped styles under .youtube-app
│   │       ├── api.js                 # HTTP client (resolveChannel, fetchVideos)
│   │       ├── store.js              # localStorage CRUD (tabs, channels, videos)
│   │       └── components/           # TabBar, AddChannel, ChannelList, VideoGrid, DataManager
│   └── config/
│       └── projects.js               # Project registry — add new projects here
├── index.html
├── package.json
├── vite.config.js                    # React plugin + /api proxy to localhost:3001
├── vercel.json                       # Vercel deployment config
├── .env.example                      # Required environment variables template
└── .claude/launch.json               # Dev server config for preview_start
```

## Integrated Projects

### 1. Timeline (`/timeline`)
- **Origin:** dl-timeline (vanilla JS)
- **Conversion:** DOM manipulation → React useState/useEffect
- Vietnamese event calendar with lunar date conversion (Ho Ngoc Duc algorithm)
- CSS scoped with `.timeline-app` prefix and `--tl-*` variables

### 2. Telegram (`/telegram`)
- **Origin:** dl-telegram (Next.js + TypeScript)
- **Conversion:** `page.tsx` → JSX, `process.env.NEXT_PUBLIC_*` → `import.meta.env.VITE_*`, Tailwind → vanilla CSS
- Sends messages via Telegram Bot API
- Requires env vars: `BOT_TOKEN`, `CHAT_ID`, `API_SECRET`, `VITE_API_SECRET`
- CSS scoped with `.telegram-app` prefix

### 3. YouTube (`/youtube`)
- **Origin:** dl-social (Vite + React)
- **Conversion:** Minimal — adjusted import paths, scoped CSS
- Tracks YouTube channels via RSS feeds, stores data in localStorage
- CSS scoped with `.youtube-app` prefix and `--yt-*` variables

## Development

### Setup
```bash
npm run install:all
```

### Environment Variables
Copy `.env.example` to `.env` and fill in values:
- `BOT_TOKEN` — Telegram bot token (server-side)
- `CHAT_ID` — Telegram chat ID (server-side)
- `API_SECRET` — shared secret for API auth (server-side)
- `VITE_API_SECRET` — same secret exposed to client
- `VITE_TELEGRAM_LINK` — optional link to open Telegram chat

### Run locally
```bash
# Both servers concurrently (recommended)
npm run dev

# Or separately:
npm run dev:api     # API on http://localhost:3001
npm run dev:client  # Frontend on http://localhost:5174 (proxies /api → :3001)
```

### Deploy
```bash
vercel
```

## CSS Isolation Strategy

Each sub-app's CSS is scoped under a parent class to prevent conflicts:
- `.timeline-app` → `--tl-*` CSS variables
- `.telegram-app` → standard class naming
- `.youtube-app` → `--yt-*` CSS variables

Global CSS (`src/index.css`) contains only: reset, dark theme variables, sidebar layout, typography, project cards.

## Adding a New Project

1. Create folder `src/apps/<name>/` with component + CSS
2. Add wrapper page in `src/pages/<Name>Page.jsx`
3. Add route in `src/App.jsx`
4. Add entry in `src/config/projects.js`

## Development Rules

1. **CSS isolation.** Every sub-app CSS must be scoped under its parent class (e.g., `.youtube-app button`). Never use global selectors that could conflict.
2. **ESM throughout.** Both `api/` and `src/` use `"type": "module"`. Use `import`/`export`, not `require`.
3. **Serverless-compatible.** API functions must export a default `(req, res) => {}` handler. No persistent state, no file I/O.
4. **Vite proxy.** In dev, Vite proxies `/api` to `http://localhost:3001`. In production, Vercel routes `/api/*` to serverless functions.
5. **Windows dev.** The dev server uses `pathToFileURL()` for dynamic imports because Windows paths break ESM import.
6. **Dark theme.** Global dark theme in `src/index.css`. Sub-apps inherit but can override with scoped variables.
7. **No TypeScript.** All code is plain JSX/JS for simplicity.
8. **Manual sync only** (YouTube). Videos are fetched only when the user clicks "Fetch Videos". No background polling.
9. **localStorage** (YouTube). All YouTube data is stored in browser localStorage. No database.
