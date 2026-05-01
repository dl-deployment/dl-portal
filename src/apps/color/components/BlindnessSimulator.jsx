import { useMemo } from "react";
import { simulateColorBlindness, CB_TYPES, rgbToHex, textColorForBg } from "../utils";

export default function BlindnessSimulator({ rgb }) {
  const hex = rgbToHex(rgb);

  const simulations = useMemo(() => {
    return CB_TYPES.map((type) => {
      const sim = simulateColorBlindness(rgb, type.id);
      return { ...type, rgb: sim, hex: rgbToHex(sim) };
    });
  }, [rgb.r, rgb.g, rgb.b]);

  return (
    <div className="cl-blindness">
      <div className="cl-blindness__grid">
        <div className="cl-blindness__card">
          <div className="cl-blindness__swatch" style={{ backgroundColor: hex }}>
            <span style={{ color: textColorForBg(rgb) }}>{hex}</span>
          </div>
          <div className="cl-blindness__info">
            <strong>Normal Vision</strong>
            <span>Trichromat</span>
          </div>
        </div>
        {simulations.map((sim) => (
          <div key={sim.id} className="cl-blindness__card">
            <div className="cl-blindness__swatch" style={{ backgroundColor: sim.hex }}>
              <span style={{ color: textColorForBg(sim.rgb) }}>{sim.hex}</span>
            </div>
            <div className="cl-blindness__info">
              <strong>{sim.label}</strong>
              <span>{sim.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="cl-blindness__compare">
        <h3 className="cl-palette__title">Side-by-side comparison</h3>
        <div className="cl-blindness__strips">
          <div className="cl-blindness__strip-row">
            <span className="cl-blindness__strip-label">Normal</span>
            <div className="cl-blindness__strip" style={{ backgroundColor: hex }} />
          </div>
          {simulations.map((sim) => (
            <div key={sim.id} className="cl-blindness__strip-row">
              <span className="cl-blindness__strip-label">{sim.label}</span>
              <div className="cl-blindness__strip" style={{ backgroundColor: sim.hex }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
