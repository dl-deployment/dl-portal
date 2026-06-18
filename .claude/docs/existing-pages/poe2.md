# POE 2 Trade Helper

Extract craftable modifiers from poe2db.tw `#ModifiersCalc` tab data and build trade search queries.

## Files

- `src/apps/poe2/Poe2App.jsx` — Main component with URL input, ModsView JSON parser, Prefix/Suffix tabs, source tabs, collapsible family groups, trade link generation
- `src/apps/poe2/poe2.css` — Scoped styles under `.poe2-`
- `src/pages/Poe2Page.jsx` — Thin page wrapper
- `api/fetch-poedb.js` — Serverless proxy to fetch poe2db.tw HTML (GET, query param `url`)

## Layout (top to bottom)

1. **Toolbar** — filter input, selected count, Clear / Copy Mods / Open Trade Site buttons
2. **Prefix | Suffix** — main tab toggle; data is stored as `{ prefix: { sourceKey: { familyName: [mods] } }, suffix: {...} }`
3. **Source tabs** — Base, Essence, Perfect Essence, Boss, Vaal, Breach, Breach Minion, Breach Caster (counts per tab); `flex-wrap: wrap` with no scroll
4. **Trade link** — appears after clicking "Open Trade Site"; shows the generated URL with selected stat filters encoded; has a Copy button
5. **Collapsible family groups** — each family collapsed by default, showing a short description like `# % increased maximum Energy Shield` or `# to maximum Life`; click to expand and see tiered mod list with checkboxes

## Data Flow

1. User pastes a poe2db.tw item URL with `#ModifiersCalc` hash (e.g., `Amulets#ModifiersCalc`)
2. `handleFetch` calls `/api/fetch-poedb?url=...` to proxy the HTML
3. `parseModifiersConfig()` extracts the `new ModsView({...})` JSON payload from the `#ModifiersCalc` tab pane
4. `buildData()` reorganises into `{ prefix: { sourceKey: { familyName: [mods] } }, suffix: {...} }`
5. ModGenerationTypeID determines prefix (`1`) vs suffix (`2`); corrupted mods use type `5` and go to suffix
6. Families sorted alphabetically, mods sorted by level with consecutive tier numbers (T1, T2...)

## Trade Link Generation

- "Open Trade Site" reads all selected modifiers from every source/type/family
- Builds a `pathofexile.com/trade2` URL with `#` fragment containing a JSON query with each stat as a filter (`{ id: statText, value: { min: 1 }, disabled: false }`)
- The URL is copied to clipboard, opened in a new tab, and displayed below the source tabs

## Key Notes

- Parses the `ModsView()` JSON payload, not DOM elements — more reliable against HTML changes
- `DEFAULT_URL` is `https://poe2db.tw/us/Amulets#ModifiersCalc`
- Trade site base: `https://www.pathofexile.com/trade2`
- CSS prefix: `.poe2-`
- Public page (no auth required)
