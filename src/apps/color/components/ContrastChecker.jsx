import { useState, useMemo, useEffect } from "react";
import {
  rgbToHex, hexToRgb, isValidHex,
  contrastRatio, wcagResults, textColorForBg,
} from "../utils";

export default function ContrastChecker({ initialFg, onCopy }) {
  const [fg, setFg] = useState(initialFg);
  const [bg, setBg] = useState({ r: 255, g: 255, b: 255 });
  const [fgHexDraft, setFgHexDraft] = useState(rgbToHex(initialFg));
  const [bgHexDraft, setBgHexDraft] = useState("#FFFFFF");
  const [editingFg, setEditingFg] = useState(false);
  const [editingBg, setEditingBg] = useState(false);

  useEffect(() => {
    setFg(initialFg);
    if (!editingFg) setFgHexDraft(rgbToHex(initialFg));
  }, [initialFg.r, initialFg.g, initialFg.b]);

  const fgHex = rgbToHex(fg);
  const bgHex = rgbToHex(bg);
  const ratio = useMemo(() => contrastRatio(fg, bg), [fg.r, fg.g, fg.b, bg.r, bg.g, bg.b]);
  const results = useMemo(() => wcagResults(ratio), [ratio]);

  const swap = () => {
    setFg(bg);
    setBg(fg);
    setFgHexDraft(bgHex);
    setBgHexDraft(fgHex);
  };

  const handleFgHexBlur = () => {
    setEditingFg(false);
    if (isValidHex(fgHexDraft)) {
      setFg(hexToRgb(fgHexDraft));
    } else {
      setFgHexDraft(fgHex);
    }
  };

  const handleBgHexBlur = () => {
    setEditingBg(false);
    if (isValidHex(bgHexDraft)) {
      setBg(hexToRgb(bgHexDraft));
    } else {
      setBgHexDraft(bgHex);
    }
  };

  const passLabel = (pass) => pass ? "Pass" : "Fail";
  const passClass = (pass) => pass ? "cl-contrast__pass" : "cl-contrast__fail";

  return (
    <div className="cl-contrast">
      <div className="cl-contrast__inputs">
        <div className="cl-contrast__color-group">
          <label className="cl-contrast__label">Foreground</label>
          <div className="cl-contrast__picker-row">
            <div className="cl-contrast__mini-swatch" style={{ backgroundColor: fgHex }}>
              <input
                type="color"
                className="cl-input__native-picker"
                value={fgHex}
                onChange={(e) => { setFg(hexToRgb(e.target.value)); setFgHexDraft(e.target.value.toUpperCase()); }}
              />
            </div>
            <input
              type="text"
              className="cl-input__field cl-input__field--hex"
              value={editingFg ? fgHexDraft : fgHex}
              onChange={(e) => { setEditingFg(true); setFgHexDraft(e.target.value); }}
              onBlur={handleFgHexBlur}
              onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
              spellCheck={false}
            />
          </div>
        </div>

        <button className="btn btn-ghost cl-contrast__swap" onClick={swap} title="Swap colors">
          &#8644;
        </button>

        <div className="cl-contrast__color-group">
          <label className="cl-contrast__label">Background</label>
          <div className="cl-contrast__picker-row">
            <div className="cl-contrast__mini-swatch" style={{ backgroundColor: bgHex }}>
              <input
                type="color"
                className="cl-input__native-picker"
                value={bgHex}
                onChange={(e) => { setBg(hexToRgb(e.target.value)); setBgHexDraft(e.target.value.toUpperCase()); }}
              />
            </div>
            <input
              type="text"
              className="cl-input__field cl-input__field--hex"
              value={editingBg ? bgHexDraft : bgHex}
              onChange={(e) => { setEditingBg(true); setBgHexDraft(e.target.value); }}
              onBlur={handleBgHexBlur}
              onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      <div className="cl-contrast__ratio">
        <span className="cl-contrast__ratio-value">{ratio.toFixed(2)}:1</span>
      </div>

      <div className="cl-contrast__results">
        <div className={`cl-contrast__result ${passClass(results.aa.normal)}`}>
          <span className="cl-contrast__result-label">AA Normal</span>
          <span className="cl-contrast__result-value">{passLabel(results.aa.normal)}</span>
        </div>
        <div className={`cl-contrast__result ${passClass(results.aa.large)}`}>
          <span className="cl-contrast__result-label">AA Large</span>
          <span className="cl-contrast__result-value">{passLabel(results.aa.large)}</span>
        </div>
        <div className={`cl-contrast__result ${passClass(results.aaa.normal)}`}>
          <span className="cl-contrast__result-label">AAA Normal</span>
          <span className="cl-contrast__result-value">{passLabel(results.aaa.normal)}</span>
        </div>
        <div className={`cl-contrast__result ${passClass(results.aaa.large)}`}>
          <span className="cl-contrast__result-label">AAA Large</span>
          <span className="cl-contrast__result-value">{passLabel(results.aaa.large)}</span>
        </div>
      </div>

      <div className="cl-contrast__preview" style={{ backgroundColor: bgHex, color: fgHex }}>
        <p style={{ fontSize: "16px" }}>Normal text preview (16px)</p>
        <p style={{ fontSize: "24px", fontWeight: 700 }}>Large text preview (24px bold)</p>
      </div>
    </div>
  );
}
