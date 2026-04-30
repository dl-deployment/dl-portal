# CLAUDE.md — DL Portal

React SPA (Vite) + Vercel Serverless API. Multiple personal projects integrated into one portal with shared layout and routing.

## Tech Stack

- **Frontend:** React 19, Vite 8, React Router DOM 7, vanilla CSS (no TypeScript)
- **Backend:** Vercel serverless functions (plain JS, ESM)
- **Deployment:** Vercel (static frontend + serverless `/api/*` routes)

## Adding a New Page (4 steps)

1. `src/apps/<name>/` — Create folder with `<Name>App.jsx` + `<name>.css`
2. `src/pages/<Name>Page.jsx` — Thin wrapper importing the app component
3. `src/App.jsx` — Add `<Route>` with `<ErrorBoundary>` wrapper
4. `src/config/projects.js` — Add entry to `projects` array

> Full templates and patterns: `.claude/docs/new-page-guide.md`

## Documentation Maintenance

When creating a new page or making significant changes to an existing page:

1. **New page:** Create `.claude/docs/existing-pages/<name>.md` following the format of existing docs (see `tasks.md` or `texttools.md` as reference). Include: files, data model (if any), key implementation details, CSS prefix.
2. **Update index:** Add/update the entry in the Documentation Index table below in this file.
3. **Significant changes to existing page:** Update the corresponding `.claude/docs/existing-pages/<name>.md` to reflect the changes (new files, changed data model, new features, etc.).

## Development Rules

1. **CSS isolation.** Every sub-app CSS scoped under its parent class (e.g., `.tasks-app button`). Never use global selectors.
2. **ESM throughout.** Use `import`/`export`, not `require`.
3. **Serverless-compatible.** API functions export a default `(req, res) => {}` handler. No persistent state.
4. **Vite proxy.** Dev: `/api` → `http://localhost:3001`. Prod: Vercel routes `/api/*` to serverless functions.
5. **Windows dev.** Dev server uses `pathToFileURL()` for dynamic imports.
6. **Dark theme.** Global dark theme in `src/index.css`. Sub-apps inherit but can override with scoped variables.
7. **No TypeScript.** All code is plain JSX/JS.

## Dev Commands

```bash
npm run install:all         # Install all dependencies
npm run dev                 # Both servers concurrently
npm run dev:api             # API on http://localhost:3001
npm run dev:client          # Frontend on http://localhost:5174
```

## Documentation Index (`.claude/docs/`)

| Document | Contents |
|----------|----------|
| `new-page-guide.md` | Step-by-step templates for adding a new page, CSS/component/state patterns |
| `css-and-shared.md` | Global CSS variables, shared button/skeleton classes, layout structure |
| `api-and-storage.md` | Serverless function templates, localStorage store patterns, API client patterns |
| `existing-pages/timeline.md` | Timeline app details (lunar calendar, events) |
| `existing-pages/telegram.md` | Telegram app details (Bot API, env vars) |
| `existing-pages/youtube.md` | YouTube app details (RSS, Context, localStorage data model) |
| `existing-pages/tasks.md` | Tasks app details (repeating tasks, reminders, data model) |
| `existing-pages/texttools.md` | Text Tools app details (JSON, case, trim, Base64 transforms) |
| `existing-pages/spritesheetslicer.md` | SpriteSheet Slicer app details (grid slicing, JSZip, Canvas API) |
