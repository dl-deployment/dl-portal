# SpriteSheet Viewer App (`/spritesheetviewer`)

Drag-and-drop sprite animation viewer. Drop individual frame images to preview them as an animated sequence with adjustable speed and loop modes.

## Files

```
src/apps/spritesheetviewer/
├── SpritesheetViewerApp.jsx    # Main component — drop zone, preview, strip, controls
└── spritesheetviewer.css       # Scoped under .spritesheetviewer-app, uses --sv-* variables
src/pages/SpritesheetViewerPage.jsx
```

## Features

- **Drag & drop:** Drop multiple image files to create an animation. Drop again to replace frames.
- **Playback controls:** Play/Pause, Stop, and frame-by-frame selection.
- **FPS slider:** Adjust animation speed from 1 to 60 FPS.
- **Loop modes:**
  - **Loop** — plays forward from last frame back to first.
  - **Ping Pong** — alternates forward then backward.
  - **No Loop** — plays once and stops.
- **Frame strip:** Thumbnail strip of all frames for direct navigation.

## Key Implementation Details

- **Animation loop:** Uses `setInterval` managed via `useRef` to avoid stale closure issues. `indexRef`, `fpsRef`, `dirRef`, and `loopRef` track mutable animation state across renders.
- **Direction guard:** On animation start, if ping-pong mode and `currentIndex` is at the last frame, `dirRef` is set to `-1` (backward) to prevent out-of-bounds access.
- **FPS reactivity:** A dedicated `useEffect` watches the `fps` state — when FPS changes while playing, it stops and restarts the interval so the new speed takes effect immediately.
- **Object URLs:** Each dropped image is converted to a blob URL via `URL.createObjectURL()` for instant rendering. Previous URLs are revoked on replacement.
- **Auto-play:** Animation starts automatically when frames are dropped.
- **No persistence:** Pure in-memory state, no API calls or localStorage.
- **CSS prefix:** `.spritesheetviewer-app`, `.sv-*` classes, `--sv-*` variables.
- **Layout:** Controls panel has two rows — FPS on the first line, Loop modes on the second line (`.sv-controls__group--full` forces a wrap via `width: 100%`).
- Images render with `image-rendering: pixelated` for crisp pixel-art frames.
