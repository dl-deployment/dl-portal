# Free Games App (`/freegames`)

Displays games currently free (100% discount) on Steam and Epic Games Store. Public page, no auth required. Data fetched from external APIs via serverless function.

## Files

```
src/apps/freegames/
├── FreeGamesApp.jsx           # Main component — sections, card grid, loading/error states
└── freegames.css              # Scoped under .freegames-app

api/
└── fetch-free-games.js        # GET endpoint, fetches from Epic API + scrapes Steam HTML
```

## API (`GET /api/fetch-free-games`)

- **Epic Games Store:** REST API (`freeGamesPromotions`), filters for `discountPercentage === 0` with active date range.
- **Steam:** HTML scraping of search page, regex-parses game rows, filters for `-100%` discount.
- Uses `Promise.allSettled` so one store failing doesn't block the other.
- Returns `{ epic: [...], steam: [...], errors: [...] }`.

Each game object: `{ title, image, url, originalPrice, store, endDate? }`.

## Key Implementation Details

- **No auth/DB:** Purely API-driven, no Supabase, no localStorage.
- **Countdown timer:** Epic games show "Ends in Xd Yh" based on promotion `endDate`.
- **Responsive grid:** 3 columns desktop, 2 tablet, 1 mobile.
- **Store badges:** Blue for Epic, dark with accent for Steam.
- **Skeleton loading:** 6 skeleton cards while fetching.
- **Refresh button:** Manual re-fetch, disabled during loading.
- CSS prefix: `.freegames-*` classes.
