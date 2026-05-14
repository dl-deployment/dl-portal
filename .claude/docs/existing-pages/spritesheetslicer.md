# SpriteSheet Slicer App (`/spritesheetslicer`)

Tool for slicing spritesheet images into individual pieces, downloadable as a ZIP file. Supports two modes: **Grid** (rows/columns) and **Plist** (Cocos Creator `.plist` atlas metadata).

## Files

```
src/apps/spritesheetslicer/
├── SpriteSheetSlicerApp.jsx   # Main component — drop zone, mode tabs, controls, preview, slicing logic
├── spritesheetslicer.css      # Scoped under .spritesheetslicer-app, uses --ss-* variables
```

## Features

| Feature | Details |
|---------|---------|
| Image input | Drag & drop or file picker, accepts any image type |
| Grid slicing | Rows/columns controls (1–100), real-time grid preview, evenly-spaced grid cuts |
| Plist slicing | Load a Cocos Creator `.plist` file, auto-detect frames, extract each frame with rotation/trim support |
| Frame overlay | Colored rectangles for each plist frame on the preview image |
| Trim restoration | Optional "Restore trim" checkbox — restores sprites to their original `sourceSize` with padding |
| Rotated frames | Automatically un-rotates 90° CCW rotated sprites from the atlas |
| Slice & download | Canvas API extracts frames, JSZip bundles PNGs, downloads as ZIP |

## Modes

### Grid mode (default)
- Drop an image, set columns/rows, preview the grid overlay, then slice.
- Each cell is evenly sized: `floor(imageW / cols)` × `floor(imageH / rows)`.
- Optionally input exact cell W/H to auto-calculate columns/rows.
- Output filenames: `{name}_r{row}_c{col}.png`.

### Plist mode (Cocos Creator)
- Drop a texture image. Then drop or browse a `.plist` file.
- The plist is parsed (Apple Property List XML format) to extract frame metadata.
- Each frame's `{x, y, w, h}` rect is shown as a colored overlay on the preview.
- Supports `rotated`, `offset`, `sourceSize`, and `sourceColorRect` fields.
- **Restore trim** (on by default): renders each sprite onto its original `sourceSize` canvas at the position specified by `sourceColorRect`, restoring trimmed transparent padding.
- **Restore trim off**: outputs just the raw frame rect (un-rotated if needed), without padding.
- Output filenames: use the original sprite name from the plist (including `.png` extension if present).

## UI Layout

- **Header:** Title, file name (when loaded), Reset button.
- **Mode tabs:** "Grid" | "Plist (Cocos)" — switch between slicing modes.
- **Drop zone:** Dashed border area. In plist mode also accepts `.plist` files.
- **Controls bar:**
  - Grid: Cols/Rows number inputs, W/H helpers, piece count info.
  - Plist (no plist): Upload area for `.plist` file with drag & drop.
  - Plist (loaded): File name, frame count badge, "Restore trim" checkbox, Change button.
  - Slice & Download ZIP button.
- **Preview:** Image with grid lines or colored frame rectangles overlay.
- **Toast:** Fixed bottom-right, auto-dismiss 2.5s.

## Key Implementation Details

- **No persistence:** Pure in-memory state, no localStorage or API calls.
- **Dynamic import:** JSZip loaded via `import("jszip")` only when slicing, keeping it out of the initial bundle.
- **Plist parsing:** Uses `DOMParser` to parse XML, then walks the `<dict>`/`<key>` structure to build a JS object. String values in `{{x,y},{w,h}}` format are parsed with regex `/\d+/g`.
- **Grid slicing:** Single offscreen canvas reused for all cells. `drawImage` with source rect clipping, `toBlob("image/png")` for each piece.
- **Plist extraction:** Per-frame offscreen canvas. Cuts the rect from the texture, un-rotates if `rotated=true`, then optionally composites onto a `sourceSize` canvas at the `sourceColorRect` position.
- **Rotated frame handling (Cocos Creator convention):** Cocos Creator stores *unrotated* dimensions in the plist `frame` rect. Since the texture atlas actually stores the frame rotated 90° CW, the actual texture rect has swapped w/h. The code computes `displayFrame` = `{x, y, w: frame.h, h: frame.w}` for rotated frames:
  - **Overlay:** `displayFrame` is used for positioning percentage-based colored rectangles on the preview, so the visible overlay matches the actual texture rect.
  - **Extraction cutting:** `displayFrame` is used as the source rect for `drawImage` (cutting the correct area from the atlas).
  - **Un-rotation:** After cutting, the extracted canvas is rotated `-Math.PI / 2` (90° CCW) via `translate` + `rotate` + `drawImage` to restore the original orientation.
- **Frame overlay:** Absolute-positioned colored `div` elements with percentage-based positioning using `displayFrame`. 15 rotating colors. Hover highlights with thicker border.
- **Object URL cleanup:** Revokes URLs on image change and component unmount.
- CSS prefix: `.spritesheetslicer-app`, `.ss-*` classes, `--ss-*` variables.

## Dependencies

- `jszip` — ZIP file generation (dynamic import, not in initial bundle).
