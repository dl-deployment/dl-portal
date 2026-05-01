import { rgbToHex, textColorForBg } from "../utils";

export default function ColorSwatch({ rgb, onClick, onCopy, size = "md", showLabel = false }) {
  const hex = rgbToHex(rgb);
  const textColor = textColorForBg(rgb);
  const cls = `cl-swatch cl-swatch--${size}`;

  const handleCopy = (e) => {
    e.stopPropagation();
    onCopy?.(hex);
  };

  return (
    <div
      className={cls}
      style={{ backgroundColor: hex }}
      onClick={() => onClick?.(rgb)}
      title={hex}
    >
      <div className="cl-swatch__overlay" style={{ color: textColor }}>
        <span className="cl-swatch__label">{hex}</span>
        <button className="cl-swatch__copy" onClick={handleCopy} style={{ color: textColor }}>
          Copy
        </button>
      </div>
      {showLabel && (
        <span className="cl-swatch__bottom-label" style={{ color: textColor }}>
          {hex}
        </span>
      )}
    </div>
  );
}
