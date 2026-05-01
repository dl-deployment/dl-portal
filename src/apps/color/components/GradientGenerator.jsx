import { useState, useRef, useMemo } from "react";
import { rgbToHex, textColorForBg } from "../utils";

export default function GradientGenerator({ rgb, onCopy }) {
  const [colors, setColors] = useState([
    rgbToHex(rgb),
    "#FFFFFF",
  ]);
  const [type, setType] = useState("linear");
  const [angle, setAngle] = useState(90);

  const addColor = () => {
    if (colors.length < 6) setColors([...colors, "#000000"]);
  };

  const removeColor = (i) => {
    if (colors.length > 2) setColors(colors.filter((_, idx) => idx !== i));
  };

  const updateColor = (i, val) => {
    const next = [...colors];
    next[i] = val;
    setColors(next);
  };

  const cssValue = useMemo(() => {
    const stops = colors.join(", ");
    if (type === "linear") return `linear-gradient(${angle}deg, ${stops})`;
    if (type === "radial") return `radial-gradient(circle, ${stops})`;
    return `conic-gradient(from ${angle}deg, ${stops})`;
  }, [colors, type, angle]);

  const cssCode = `background: ${cssValue};`;

  return (
    <div className="cl-gradient">
      <div className="cl-gradient__preview" style={{ background: cssValue }} />

      <div className="cl-gradient__controls">
        <div className="cl-gradient__type-row">
          {["linear", "radial", "conic"].map((t) => (
            <button
              key={t}
              className={`btn btn-sm ${type === t ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setType(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {type !== "radial" && (
          <div className="cl-gradient__angle-row">
            <label className="cl-input__label">Angle</label>
            <input
              type="range"
              min={0}
              max={360}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="cl-gradient__slider"
            />
            <span className="cl-gradient__angle-val">{angle}°</span>
          </div>
        )}

        <div className="cl-gradient__stops">
          {colors.map((c, i) => (
            <div key={i} className="cl-gradient__stop">
              <div className="cl-contrast__mini-swatch" style={{ backgroundColor: c }}>
                <input
                  type="color"
                  className="cl-input__native-picker"
                  value={c}
                  onChange={(e) => updateColor(i, e.target.value.toUpperCase())}
                />
              </div>
              <span className="cl-gradient__stop-hex">{c}</span>
              {colors.length > 2 && (
                <button className="btn btn-ghost btn-sm" onClick={() => removeColor(i)}>x</button>
              )}
            </div>
          ))}
          {colors.length < 6 && (
            <button className="btn btn-ghost btn-sm" onClick={addColor}>+ Add</button>
          )}
        </div>
      </div>

      <div className="cl-gradient__code">
        <code>{cssCode}</code>
        <button className="btn btn-ghost btn-sm" onClick={() => onCopy?.(cssCode)}>Copy</button>
      </div>
    </div>
  );
}
