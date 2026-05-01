import { useMemo } from "react";
import { generateShades, generateTints, rgbToHex, textColorForBg } from "../utils";

export default function ShadesAndTints({ rgb, onSelectColor, onCopy }) {
  const shades = useMemo(() => generateShades(rgb), [rgb.r, rgb.g, rgb.b]);
  const tints = useMemo(() => generateTints(rgb), [rgb.r, rgb.g, rgb.b]);

  return (
    <div className="cl-shades">
      <div className="cl-shades__section">
        <h3 className="cl-shades__title">Shades (darker)</h3>
        <div className="cl-shades__strip">
          {shades.map((color, i) => {
            const hex = rgbToHex(color);
            return (
              <div
                key={i}
                className="cl-shades__cell"
                style={{ backgroundColor: hex }}
                title={hex}
                onClick={() => onSelectColor?.(color)}
              >
                <span className="cl-shades__cell-label" style={{ color: textColorForBg(color) }}>
                  {hex}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="cl-shades__section">
        <h3 className="cl-shades__title">Tints (lighter)</h3>
        <div className="cl-shades__strip">
          {tints.map((color, i) => {
            const hex = rgbToHex(color);
            return (
              <div
                key={i}
                className="cl-shades__cell"
                style={{ backgroundColor: hex }}
                title={hex}
                onClick={() => onSelectColor?.(color)}
              >
                <span className="cl-shades__cell-label" style={{ color: textColorForBg(color) }}>
                  {hex}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
