import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  rgbToHex, rgbToHsl, rgbToHsv, rgbToCmyk,
  hexToRgb, hslToRgb, hsvToRgb, cmykToRgb, isValidHex,
  randomRgb, nearestColorName,
} from "./utils";
import { dbApi } from "../../lib/dbApi.js";
import ColorInput from "./components/ColorInput";
import PaletteGenerator from "./components/PaletteGenerator";
import ContrastChecker from "./components/ContrastChecker";
import ShadesAndTints from "./components/ShadesAndTints";
import GradientGenerator from "./components/GradientGenerator";
import ImageExtractor from "./components/ImageExtractor";
import BlindnessSimulator from "./components/BlindnessSimulator";
import "./color.css";

const TABS = [
  { id: "picker", label: "Picker" },
  { id: "palette", label: "Palette" },
  { id: "contrast", label: "Contrast" },
  { id: "shades", label: "Shades" },
  { id: "gradient", label: "Gradient" },
  { id: "extract", label: "Extract" },
  { id: "blindness", label: "Blindness" },
];

const MAX_HISTORY = 16;

export default function ColorApp() {
  const [rgb, setRgb] = useState({ r: 99, g: 102, b: 241 });
  const [activeTab, setActiveTab] = useState("picker");
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [ready, setReady] = useState(false);
  const toastTimer = useRef(null);

  useEffect(() => {
    dbApi.read("color").then(({ data }) => {
      if (Array.isArray(data) && data.length > 0) setHistory(data);
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  const hex = useMemo(() => rgbToHex(rgb), [rgb.r, rgb.g, rgb.b]);
  const hsl = useMemo(() => rgbToHsl(rgb), [rgb.r, rgb.g, rgb.b]);
  const hsv = useMemo(() => rgbToHsv(rgb), [rgb.r, rgb.g, rgb.b]);
  const cmyk = useMemo(() => rgbToCmyk(rgb), [rgb.r, rgb.g, rgb.b]);
  const colorName = useMemo(() => nearestColorName(rgb), [rgb.r, rgb.g, rgb.b]);

  const addToHistory = useCallback((newRgb) => {
    setHistory((prev) => {
      const newHex = rgbToHex(newRgb);
      const filtered = prev.filter((h) => h.hex !== newHex);
      const next = [{ hex: newHex, rgb: newRgb }, ...filtered].slice(0, MAX_HISTORY);
      dbApi.write("color", next).catch(() => {});
      return next;
    });
  }, []);

  const showToast = useCallback((message) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 1500);
  }, []);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Copied ${text}`);
    });
  }, [showToast]);

  const onHexChange = useCallback((val) => {
    const clean = val.startsWith("#") ? val : "#" + val;
    if (isValidHex(clean)) {
      const newRgb = hexToRgb(clean);
      setRgb(newRgb);
      addToHistory(newRgb);
    }
  }, [addToHistory]);

  const onRgbChange = useCallback((val) => { setRgb(val); addToHistory(val); }, [addToHistory]);
  const onHslChange = useCallback((val) => { const r = hslToRgb(val); setRgb(r); addToHistory(r); }, [addToHistory]);
  const onHsvChange = useCallback((val) => { const r = hsvToRgb(val); setRgb(r); addToHistory(r); }, [addToHistory]);
  const onCmykChange = useCallback((val) => { const r = cmykToRgb(val); setRgb(r); addToHistory(r); }, [addToHistory]);

  const onSelectColor = useCallback((newRgb) => {
    setRgb(newRgb);
    addToHistory(newRgb);
    setActiveTab("picker");
  }, [addToHistory]);

  const handleRandom = useCallback(() => {
    const r = randomRgb();
    setRgb(r);
    addToHistory(r);
  }, [addToHistory]);

  if (!ready) return <div className="color-app"><div className="app-loading">Loading...</div></div>;

  return (
    <div className="color-app">
      <div className="cl-header">
        <h2>Color Tools</h2>
        <span className="cl-header__name">{colorName}</span>
        <button className="btn btn-ghost btn-sm" onClick={handleRandom}>Random</button>
      </div>

      {history.length > 0 && (
        <div className="cl-history">
          {history.map((h) => (
            <div
              key={h.hex}
              className="cl-history__item"
              style={{ backgroundColor: h.hex }}
              title={h.hex}
              onClick={() => { setRgb(h.rgb); }}
            />
          ))}
        </div>
      )}

      <div className="cl-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`cl-tabs__btn ${activeTab === tab.id ? "cl-tabs__btn--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "picker" && (
        <ColorInput
          rgb={rgb} hex={hex} hsl={hsl} hsv={hsv} cmyk={cmyk}
          onHexChange={onHexChange}
          onRgbChange={onRgbChange}
          onHslChange={onHslChange}
          onHsvChange={onHsvChange}
          onCmykChange={onCmykChange}
          onCopy={copyToClipboard}
        />
      )}

      {activeTab === "palette" && (
        <PaletteGenerator
          hsl={hsl}
          rgb={rgb}
          onSelectColor={onSelectColor}
          onCopy={copyToClipboard}
        />
      )}

      {activeTab === "contrast" && (
        <ContrastChecker
          initialFg={rgb}
          onCopy={copyToClipboard}
        />
      )}

      {activeTab === "shades" && (
        <ShadesAndTints
          rgb={rgb}
          onSelectColor={onSelectColor}
          onCopy={copyToClipboard}
        />
      )}

      {activeTab === "gradient" && (
        <GradientGenerator
          rgb={rgb}
          onCopy={copyToClipboard}
        />
      )}

      {activeTab === "extract" && (
        <ImageExtractor
          onSelectColor={onSelectColor}
          onCopy={copyToClipboard}
        />
      )}

      {activeTab === "blindness" && (
        <BlindnessSimulator rgb={rgb} />
      )}

      {toast && <div className="cl-toast">{toast}</div>}
    </div>
  );
}
