import { useMemo } from "react";
import {
  complementary, analogous, triadic, tetradic,
  splitComplementary, monochromatic, hslToRgb,
} from "../utils";
import ColorSwatch from "./ColorSwatch";

const PALETTE_TYPES = [
  { id: "complementary", label: "Complementary", fn: complementary },
  { id: "analogous", label: "Analogous", fn: analogous },
  { id: "triadic", label: "Triadic", fn: triadic },
  { id: "tetradic", label: "Tetradic", fn: tetradic },
  { id: "split", label: "Split Complementary", fn: splitComplementary },
  { id: "mono", label: "Monochromatic", fn: monochromatic },
];

export default function PaletteGenerator({ hsl, rgb, onSelectColor, onCopy }) {
  const palettes = useMemo(() => {
    return PALETTE_TYPES.map((type) => ({
      ...type,
      colors: type.fn(hsl).map((c) => hslToRgb(c)),
    }));
  }, [hsl.h, hsl.s, hsl.l]);

  return (
    <div className="cl-palette">
      {palettes.map((palette) => (
        <div key={palette.id} className="cl-palette__section">
          <h3 className="cl-palette__title">{palette.label}</h3>
          <div className="cl-palette__row">
            <ColorSwatch rgb={rgb} size="md" onCopy={onCopy} />
            {palette.colors.map((color, i) => (
              <ColorSwatch
                key={i}
                rgb={color}
                size="md"
                onClick={onSelectColor}
                onCopy={onCopy}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
