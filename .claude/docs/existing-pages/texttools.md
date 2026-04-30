# Text Tools App (`/texttools`)

Single-panel text utility with toolbar for common text transformations. Input and output share the same textarea — results replace content in-place.

## Files

```
src/apps/texttools/
├── TextToolsApp.jsx          # Main component — toolbar, textarea, stats footer, toast
├── texttools.css             # Scoped under .texttools-app, uses --tt-* variables
└── md5.js                    # Pure JS MD5 implementation (lazy-loaded)
```

## Available Tools

| Group | Actions | Error handling |
|-------|---------|----------------|
| JSON | Pretty (2-space indent), Minify | Shows error toast on invalid JSON |
| Case | UPPERCASE, lowercase, Title Case, camelCase, snake_case, kebab-case | — |
| Trim | Trim whitespace per line + collapse blank lines | — |
| Base64 | Encode, Decode (supports Unicode) | Shows error toast on invalid Base64 |
| URL | Encode, Decode | Shows error toast on invalid input |
| HTML | Entity Encode (`<` → `&lt;`), Decode | — |
| JWT | Decode (header + payload, no secret needed) | Shows error toast on invalid JWT |
| Format | XML/HTML Pretty, SQL Format | Shows error toast on invalid input |
| Lines | Sort A→Z, Sort Z→A, Remove Duplicates, Reverse, Add Numbers | — |
| Hash | MD5, SHA-256 (async, uses Web Crypto API for SHA-256) | — |

## UI Layout

- **Header:** Title + Copy/Clear buttons (uses global `.btn .btn-ghost .btn-sm`).
- **Toolbar:** Buttons with dropdown menus for multi-option groups. Trim is the only single-action button.
- **Textarea:** Monospace, full height, single panel for both input and output.
- **Footer:** Character / word / line count, always visible below textarea.
- **Toast:** Fixed position bottom-right, auto-dismiss after 2s, success (green) or error (red).

## Key Implementation Details

- **No persistence:** Pure in-memory state, no localStorage or API calls.
- **TOOLS config array:** Declarative tool definitions with `id`, `label`, `action` (single-action) or `options` (dropdown). Easy to extend with new tools.
- **Async support:** `applyTool` is async to support hash functions that use Web Crypto API.
- **MD5:** Pure JS implementation in `md5.js`, lazy-loaded via dynamic `import()` to avoid bundling when unused.
- **Click-outside:** `useEffect` listener closes open dropdown menus when clicking outside the toolbar.
- **Base64 Unicode:** Uses `btoa(unescape(encodeURIComponent(text)))` / `decodeURIComponent(escape(atob(text)))` to handle non-ASCII characters.
- **Case conversion helpers:** `splitWords()` splits on camelCase boundaries, underscores, and hyphens to support conversion between naming conventions.
- **Trim logic:** Trims each line individually, collapses 3+ consecutive newlines to 2, trims start/end.
- **Stats footer:** Uses `useMemo` to recalculate character/word/line counts on each text change.
- CSS prefix: `.texttools-app`, `.tt-*` classes, `--tt-*` variables.
