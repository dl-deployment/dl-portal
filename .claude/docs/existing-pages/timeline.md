# Timeline App (`/timeline`)

Vietnamese event timeline with lunar/solar date conversion and countdown.

## Origin

Converted from `dl-timeline` (vanilla JS). DOM manipulation was refactored to React `useState`/`useEffect`.

## Files

```
src/apps/timeline/
├── Timeline.jsx                    # Main component
├── timeline.css                    # Scoped under .timeline-app, uses --tl-* variables
├── lunar.js                        # Pure functions: solarToLunar(), calcDaysLeft(), formatDateVi(), getToday()
└── components/
    └── EventCard.jsx               # Single event card with countdown display
```

## Data

- Events list stored in `src/data/events.json` (static, imported at build time).
- Each event has: `name`, `solarDate`, `type` (solar/lunar).
- `calcDaysLeft()` computes days until the event (handles lunar→solar conversion).

## Key Implementation Details

- Lunar calendar uses Ho Ngoc Duc algorithm (`lunar.js`).
- Events are sorted by upcoming date on mount via `processEvents()`.
- No API calls — all logic is client-side.
- CSS prefix: `.timeline-app`, `.tl-*` classes, `--tl-*` variables.
