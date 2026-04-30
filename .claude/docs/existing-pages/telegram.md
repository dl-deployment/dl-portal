# Telegram App (`/telegram`)

Simple messenger that sends messages via Telegram Bot API.

## Origin

Converted from `dl-telegram` (Next.js + TypeScript). Changes: `page.tsx` → JSX, `process.env.NEXT_PUBLIC_*` → `import.meta.env.VITE_*`, Tailwind → vanilla CSS.

## Files

```
src/apps/telegram/
├── TelegramForm.jsx      # Main component — form with textarea + submit
├── telegram.css           # Scoped under .telegram-app
└── api.js                 # HTTP client (sendMessage with timeout + retry)
```

## API Endpoint

- `POST /api/send-telegram` — sends message to Telegram chat via Bot API.
- Server-side file: `api/send-telegram.js`.
- Auth: `x-api-key` header checked against `API_SECRET` env var.

## Environment Variables

| Variable | Side | Description |
|----------|------|-------------|
| `BOT_TOKEN` | Server | Telegram bot token |
| `CHAT_ID` | Server | Target chat/group ID |
| `API_SECRET` | Server | Shared secret for API auth |
| `VITE_API_SECRET` | Client | Same secret, sent as `x-api-key` header |
| `VITE_TELEGRAM_LINK` | Client | Optional link to open Telegram chat |

## Key Implementation Details

- API client includes 10s timeout with `AbortController` and 1 retry on network errors.
- Character limit: 4096 (Telegram max).
- Status feedback: success/error message shown below the form.
- CSS prefix: `.telegram-app`, `.tg-*` classes.
