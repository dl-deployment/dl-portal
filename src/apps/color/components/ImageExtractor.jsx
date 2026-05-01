import { useState, useRef, useCallback } from "react";
import { extractColorsFromImageData, rgbToHex, textColorForBg } from "../utils";
import ColorSwatch from "./ColorSwatch";

export default function ImageExtractor({ onSelectColor, onCopy }) {
  const [colors, setColors] = useState([]);
  const [preview, setPreview] = useState(null);
  const canvasRef = useRef(null);
  const inputRef = useRef(null);

  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        setPreview(ev.target.result);
        const canvas = canvasRef.current;
        const maxW = 300;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setColors(extractColorsFromImageData(data, 8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const dt = new DataTransfer();
      dt.items.add(file);
      inputRef.current.files = dt.files;
      inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, []);

  return (
    <div className="cl-extractor">
      <div
        className="cl-extractor__drop"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="cl-extractor__img" />
        ) : (
          <span>Drop an image here or click to upload</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: "none" }}
        />
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {colors.length > 0 && (
        <div className="cl-extractor__results">
          <h3 className="cl-palette__title">Extracted Colors</h3>
          <div className="cl-palette__row">
            {colors.map((c, i) => (
              <ColorSwatch
                key={i}
                rgb={c}
                size="md"
                onClick={onSelectColor}
                onCopy={onCopy}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
