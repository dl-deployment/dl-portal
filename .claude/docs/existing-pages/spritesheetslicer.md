# SpriteSheet Slicer App (`/spritesheetslicer`)

Tool for slicing spritesheet images into a grid of individual pieces, downloadable as a ZIP file. Drop an image, set columns/rows, preview the grid overlay, then slice and download.

## Files

```
src/apps/spritesheetslicer/
├── SpriteSheetSlicerApp.jsx   # Main component — drop zone, controls, preview with grid overlay, slicing logic
├── spritesheetslicer.css      # Scoped under .spritesheetslicer-app, uses --ss-* variables
```

## Features

| Feature | Details |
|---------|---------|
| Image input | Drag & drop or file picker, accepts any image type |
| Grid controls | Columns and rows inputs (1–100), real-time grid preview |
| Grid overlay | CSS grid with semi-transparent red borders over the image |
| Slice & download | Canvas API slices image, JSZip bundles PNGs, downloads as ZIP |
| Info display | Shows piece count, per-piece dimensions, total image dimensions |

## UI Layout

- **Header:** Title + Reset button (visible when image loaded).
- **Drop zone:** Dashed border area with icon and "browse" link. Drag-over highlights with accent color.
- **Controls bar:** Cols/Rows number inputs, piece info, "Slice & Download ZIP" button.
- **Preview:** Image with CSS grid overlay showing slice boundaries.
- **Toast:** Fixed bottom-right, auto-dismiss 2.5s, success (green) or error (red).

## Key Implementation Details

- **No persistence:** Pure in-memory state, no localStorage or API calls.
- **Dynamic import:** JSZip loaded via `import("jszip")` only when slicing, keeping it out of the initial bundle.
- **Canvas slicing:** Single offscreen canvas reused for all cells. `drawImage` with source rect clipping, `toBlob("image/png")` for each piece.
- **File naming:** `{originalName}_r{row}_c{col}.png` inside `{originalName}_{cols}x{rows}.zip`.
- **Grid overlay:** Absolute-positioned CSS grid over the image with `pointer-events: none`. Uses `gridTemplateColumns: repeat(cols, 1fr)` for automatic scaling.
- **Object URL cleanup:** Revokes URLs on image change and component unmount.
- **Non-divisible dimensions:** Uses `Math.floor` for cell dimensions — rightmost column/bottom row may lose a few pixels.
- CSS prefix: `.spritesheetslicer-app`, `.ss-*` classes, `--ss-*` variables.

## Dependencies

- `jszip` — ZIP file generation (dynamic import, not in initial bundle).
