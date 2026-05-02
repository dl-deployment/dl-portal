# Color Tools

## Files

```
src/apps/color/
├── ColorApp.jsx              # Root: tab nav, global RGB state, toast, history, random
├── color.css                 # All styles scoped under .color-app
├── utils.js                  # Pure color math (conversions, palettes, contrast, shades, color names, blindness sim, image extraction)
└── components/
    ├── ColorSwatch.jsx       # Reusable clickable swatch with hover overlay + copy
    ├── ColorInput.jsx        # Side-by-side swatch + native picker + 5-format inputs (HEX/RGB/HSL/HSV/CMYK)
    ├── PaletteGenerator.jsx  # 6 harmony palette types with swatches
    ├── ContrastChecker.jsx   # Fg/bg color inputs, contrast ratio, WCAG AA/AAA results, text preview
    ├── ShadesAndTints.jsx    # 10 shades + 10 tints gradient strips
    ├── GradientGenerator.jsx # CSS gradient builder (linear/radial/conic, 2-6 stops, angle slider, copy CSS)
    ├── ImageExtractor.jsx    # Upload/drop image, extract 8 dominant colors via Canvas API
    └── BlindnessSimulator.jsx # Protanopia/deuteranopia/tritanopia simulation with side-by-side strips
src/pages/ColorPage.jsx       # Thin page wrapper
```

## Data Model

- **Color history:** Stored in localStorage (key `dl-color-history`), max 16 entries, each `{hex, rgb}`. Deduped by hex.
- **Single source of truth:** `rgb {r, g, b}` (0-255 integers) in ColorApp
- **Derived values:** `hex`, `hsl`, `hsv`, `cmyk`, `colorName` computed via `useMemo`
- **ContrastChecker** has own internal fg/bg state (fg syncs from parent)
- **GradientGenerator** has own internal state for color stops, type, and angle

## Key Implementation Details

- **RGB as hub:** All conversions go through RGB. No direct cross-format conversion.
- **Tab layout:** 7 tabs — Picker, Palette, Contrast, Shades, Gradient, Extract, Blindness
- **No external libs:** All color math from first principles in `utils.js`
- **Picker layout:** Side-by-side — swatch (200px) on left, format inputs on right. Prevents native color picker popup from covering inputs.
- **Native color picker:** `<input type="color">` with `opacity: 0` overlay on swatch
- **HEX input:** Draft state pattern — edits stored in local state, committed on blur
- **Palette generation:** HSL-based. 6 types: complementary, analogous, triadic, tetradic, split-comp, monochromatic
- **WCAG contrast:** relativeLuminance + contrastRatio per WCAG 2.1 spec. Thresholds: AA normal >= 4.5, AA large >= 3, AAA normal >= 7, AAA large >= 4.5
- **Text color on swatches:** Auto white/black based on luminance threshold (0.179)
- **Color name lookup:** ~140 named CSS colors, nearest match by Euclidean RGB distance
- **Random color:** Generates random r/g/b 0-255
- **Color history:** Stored in localStorage, shown as small swatch row above tabs, click to restore
- **Gradient generator:** Supports linear/radial/conic, 2-6 color stops, angle slider, generates copyable CSS
- **Image color extraction:** Canvas API downscale + color quantization (32-bucket), returns top 8 dominant colors
- **Color blindness simulation:** Matrix-based simulation in linear RGB space for protanopia, deuteranopia, tritanopia

## CSS Prefix

`.color-app` — all selectors scoped. Internal classes use `cl-` prefix.
