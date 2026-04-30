# DL Portal

A unified web portal that integrates multiple personal projects into a single React application with shared navigation and dark theme.

## Projects

| Route | Name | Description |
|-------|------|-------------|
| `/` | Home | Dashboard with project cards |
| `/timeline` | Timeline | Vietnamese event calendar with lunar date conversion |
| `/telegram` | Telegram | Send messages via Telegram Bot API |
| `/youtube` | YouTube | Track YouTube channels and view latest videos |

## Tech Stack

- **Frontend:** React 19, Vite 8, React Router DOM 7, vanilla CSS
- **Backend:** Vercel serverless functions (Express for local dev)
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm run install:all
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Telegram Bot (server-side only)
BOT_TOKEN=your_telegram_bot_token
CHAT_ID=your_chat_id
API_SECRET=your_shared_secret

# Telegram (client-side)
VITE_API_SECRET=your_shared_secret
VITE_TELEGRAM_LINK=https://t.me/your_bot
```

> **Note:** The Timeline and YouTube apps work without any env vars. Only Telegram requires configuration.

### Development

```bash
# Start both frontend and API server
npm run dev
```

This runs:
- Vite dev server on `http://localhost:5174`
- Express API server on `http://localhost:3001`

Vite proxies all `/api/*` requests to the API server automatically.

### Build & Deploy

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel
```

## Project Structure

```
dl-portal/
├── api/                          # Serverless API functions
│   ├── resolve-channel.js        # YouTube channel resolver
│   ├── fetch-videos.js           # YouTube RSS video fetcher
│   ├── send-telegram.js          # Telegram message sender
│   └── dev-server.js             # Express dev server
├── src/
│   ├── App.jsx                   # Router setup
│   ├── index.css                 # Global dark theme
│   ├── components/Layout.jsx     # Sidebar + content layout
│   ├── pages/                    # Route wrappers
│   ├── apps/                     # Individual project modules
│   │   ├── timeline/             # Vietnamese event timeline
│   │   ├── telegram/             # Telegram messenger
│   │   └── youtube/               # YouTube tracker
│   └── config/projects.js        # Project registry
├── vite.config.js                # Vite + API proxy config
└── vercel.json                   # Deployment config
```

## Adding a New Project

1. Create `src/apps/<name>/` with your component and scoped CSS
2. Add a page wrapper in `src/pages/<Name>Page.jsx`
3. Add the route in `src/App.jsx`
4. Register in `src/config/projects.js`:

```js
{
  id: "myapp",
  name: "My App",
  path: "/myapp",
  icon: "\u{1F680}",
  description: "Description of my app",
}
```

The new project will automatically appear on the home dashboard and in the sidebar.

## Architecture

- **CSS Isolation:** Each sub-app scopes its styles under a parent class (`.timeline-app`, `.telegram-app`, `.social-app`) to prevent conflicts
- **Dark Theme:** Global CSS variables define the dark theme; sub-apps inherit and can override with prefixed variables
- **API Proxy:** In development, Vite proxies `/api/*` to Express on port 3001. In production, Vercel routes to serverless functions
- **No Database:** YouTube data is stored in browser localStorage. Telegram and Timeline are stateless on the client side
