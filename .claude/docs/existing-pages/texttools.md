# Text Tools App (`/texttools`)

Single-panel text utility with toolbar for common text transformations. Input and output share the same textarea — results replace content in-place.

## Files

```
src/apps/texttools/
├── TextToolsApp.jsx          # Main component — toolbar, textarea, toast
└── texttools.css             # Scoped under .texttools-app, uses --tt-* variables
```

## Available Tools

| Group | Actions | Error handling |
|-------|---------|----------------|
| JSON | Pretty (2-space indent), Minify | Shows error toast on invalid JSON |
| Case | UPPERCASE, lowercase, Title Case | — |
| Trim | Trim whitespace per line + collapse blank lines | — |
| Base64 | Encode, Decode (supports Unicode) | Shows error toast on invalid Base64 |

## UI Layout

- **Header:** Title + Copy/Clear buttons (uses global `.btn .btn-ghost .btn-sm`).
- **Toolbar:** Buttons with dropdown menus for multi-option groups (JSON, Case, Base64). Trim is a single-action button.
- **Textarea:** Monospace, full height, single panel for both input and output.
- **Toast:** Fixed position bottom-right, auto-dismiss after 2s, success (green) or error (red).

## Key Implementation Details

- **No persistence:** Pure in-memory state, no localStorage or API calls.
- **TOOLS config array:** Declarative tool definitions with `id`, `label`, `action` (single-action) or `options` (dropdown). Easy to extend with new tools.
- **Click-outside:** `useEffect` listener closes open dropdown menus when clicking outside the toolbar.
- **Base64 Unicode:** Uses `btoa(unescape(encodeURIComponent(text)))` / `decodeURIComponent(escape(atob(text)))` to handle non-ASCII characters.
- **Trim logic:** Trims each line individually, collapses 3+ consecutive newlines to 2, trims start/end.
- CSS prefix: `.texttools-app`, `.tt-*` classes, `--tt-*` variables.
