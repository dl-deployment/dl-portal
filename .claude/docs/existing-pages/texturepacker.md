# Texture Packer App (`/texturepacker`)

Tool for packing individual image assets into a sprite sheet (texture atlas) with Cocos2D `.plist` metadata — similar to TexturePacker. The inverse of the SpriteSheet Slicer.

## Files

```
src/apps/texturepacker/
├── TexturePackerApp.jsx   # Main component — drop zone, asset list, pack settings, preview, export
├── texturepacker.css      # Scoped under .texturepacker-app, uses --tp-* variables
```

## Features

| Feature | Details |
|---------|---------|
| Multi-image input | Drag & drop or file picker (multiple files), accepts PNG/JPG/WebP |
| Asset list | Table showing each image name, dimensions, thumbnail; remove individual items or clear all |
| Shelf packing | Height-sorted shelf algorithm packs images into rows; configurable padding and max width |
| Power of 2 | Optional POT texture size for game engine compatibility |
| Pack preview | Rendered sprite sheet with checkerboard transparency background and colored frame outlines |
| Frame labels | Hover any packed frame to see its name |
| PLIST export | Generates Cocos2D `.plist` XML with frame positions, sizes, offsets — compatible with Cocos Creator 2.x |
| ZIP download | Downloads `texturepack_output.zip` containing `spritesheet.png` + `spritesheet.plist` |

## Key Implementation Details

- **No persistence:** Pure in-memory state, no localStorage or API calls.
- **Packing algorithm:** Shelf (row-based) packer. Images sorted by area descending. Each image placed left-to-right; when the current row's x + image width + padding exceeds `maxWidth`, a new row starts. Row height is the max height of images in that row.
- **Dynamic import:** JSZip loaded via `import("jszip")` only on download, keeping it out of the initial bundle.
- **Plist generation:** Direct XML string template (no external plist library). Uses 4-space indentation, DOCTYPE `-//Apple Computer//`. Format 2 with fields matching TexturePacker Cocos2d output: `frame`, `offset`, `rotated`, `sourceColorRect`, `sourceSize` per frame; `format` (integer 2), `size`, `realTextureFileName`, `textureFileName` in metadata. Compatible with Cocos Creator 2.4.x.
- **Canvas atlas render:** Offscreen canvas draws each image at its packed position, then exported as PNG blob into the ZIP.
- **Frame overlay:** Absolute-positioned colored `div` elements overlaid on the canvas preview. 15 rotating colors. Hover shows thicker border and a name label.
- **Object URL cleanup:** Revokes asset URLs on remove, clear, and unmount.
- CSS prefix: `.texturepacker-app`, `.tp-*` classes, `--tp-*` variables.

## Dependencies

- `jszip` — ZIP file generation (dynamic import, not in initial bundle).
