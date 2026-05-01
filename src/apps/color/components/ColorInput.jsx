import { useState } from "react";
import { rgbToHex, isValidHex, hexToRgb } from "../utils";

export default function ColorInput({
  rgb, hex, hsl, hsv, cmyk,
  onHexChange, onRgbChange, onHslChange, onHsvChange, onCmykChange, onCopy,
}) {
  const [hexDraft, setHexDraft] = useState(hex);
  const [editingHex, setEditingHex] = useState(false);

  const handleNativePicker = (e) => {
    onHexChange(e.target.value);
  };

  const handleHexBlur = () => {
    setEditingHex(false);
    if (isValidHex(hexDraft)) {
      onHexChange(hexDraft);
    } else {
      setHexDraft(hex);
    }
  };

  const handleHexKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
  };

  const displayHex = editingHex ? hexDraft : hex;

  const copyValue = (text) => (e) => {
    e.stopPropagation();
    onCopy?.(text);
  };

  return (
    <div className="cl-input">
      <div className="cl-input__split">
        <div className="cl-input__preview" style={{ backgroundColor: hex }}>
          <input
            type="color"
            className="cl-input__native-picker"
            value={hex}
            onChange={handleNativePicker}
          />
          <span className="cl-input__preview-label" style={{ color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
            Click to pick
          </span>
        </div>

        <div className="cl-input__formats">
        {/* HEX */}
        <div className="cl-input__row">
          <label className="cl-input__label">HEX</label>
          <div className="cl-input__fields">
            <input
              type="text"
              className="cl-input__field cl-input__field--hex"
              value={displayHex}
              onChange={(e) => { setEditingHex(true); setHexDraft(e.target.value); }}
              onBlur={handleHexBlur}
              onKeyDown={handleHexKeyDown}
              spellCheck={false}
            />
          </div>
          <button className="btn btn-ghost btn-sm" onClick={copyValue(hex)}>Copy</button>
        </div>

        {/* RGB */}
        <div className="cl-input__row">
          <label className="cl-input__label">RGB</label>
          <div className="cl-input__fields">
            {["r", "g", "b"].map((ch) => (
              <input
                key={ch}
                type="number"
                className="cl-input__field cl-input__field--num"
                min={0}
                max={255}
                value={rgb[ch]}
                onChange={(e) => onRgbChange({ ...rgb, [ch]: clampInt(e.target.value, 0, 255) })}
              />
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={copyValue(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}>Copy</button>
        </div>

        {/* HSL */}
        <div className="cl-input__row">
          <label className="cl-input__label">HSL</label>
          <div className="cl-input__fields">
            <input type="number" className="cl-input__field cl-input__field--num" min={0} max={360} value={hsl.h} onChange={(e) => onHslChange({ ...hsl, h: clampInt(e.target.value, 0, 360) })} />
            <input type="number" className="cl-input__field cl-input__field--num" min={0} max={100} value={hsl.s} onChange={(e) => onHslChange({ ...hsl, s: clampInt(e.target.value, 0, 100) })} />
            <input type="number" className="cl-input__field cl-input__field--num" min={0} max={100} value={hsl.l} onChange={(e) => onHslChange({ ...hsl, l: clampInt(e.target.value, 0, 100) })} />
          </div>
          <button className="btn btn-ghost btn-sm" onClick={copyValue(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}>Copy</button>
        </div>

        {/* HSV */}
        <div className="cl-input__row">
          <label className="cl-input__label">HSV</label>
          <div className="cl-input__fields">
            <input type="number" className="cl-input__field cl-input__field--num" min={0} max={360} value={hsv.h} onChange={(e) => onHsvChange({ ...hsv, h: clampInt(e.target.value, 0, 360) })} />
            <input type="number" className="cl-input__field cl-input__field--num" min={0} max={100} value={hsv.s} onChange={(e) => onHsvChange({ ...hsv, s: clampInt(e.target.value, 0, 100) })} />
            <input type="number" className="cl-input__field cl-input__field--num" min={0} max={100} value={hsv.v} onChange={(e) => onHsvChange({ ...hsv, v: clampInt(e.target.value, 0, 100) })} />
          </div>
          <button className="btn btn-ghost btn-sm" onClick={copyValue(`hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`)}>Copy</button>
        </div>

        {/* CMYK */}
        <div className="cl-input__row">
          <label className="cl-input__label">CMYK</label>
          <div className="cl-input__fields">
            {["c", "m", "y", "k"].map((ch) => (
              <input
                key={ch}
                type="number"
                className="cl-input__field cl-input__field--num"
                min={0}
                max={100}
                value={cmyk[ch]}
                onChange={(e) => onCmykChange({ ...cmyk, [ch]: clampInt(e.target.value, 0, 100) })}
              />
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={copyValue(`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`)}>Copy</button>
        </div>
      </div>
      </div>
    </div>
  );
}

function clampInt(val, min, max) {
  const n = parseInt(val, 10);
  if (isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}
