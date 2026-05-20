import { useState, useRef, useCallback, useEffect } from "react";
import "./texturepacker.css";

/* ── Shelf packing algorithm ── */

function shelfPack(frames, padding, maxWidth) {
  const sorted = [...frames].sort((a, b) => {
    const areaA = a.w * a.h;
    const areaB = b.w * b.h;
    return areaB - areaA;
  });

  const packed = [];
  let shelfY = padding;
  let currentX = padding;
  let rowHeight = 0;
  let lineW = 0;

  for (const f of sorted) {
    const fw = f.w;
    const fh = f.h;
    if (currentX + fw + padding > maxWidth) {
      lineW = Math.max(lineW, currentX);
      currentX = padding;
      shelfY += rowHeight + padding;
      rowHeight = 0;
    }
    packed.push({ ...f, x: currentX, y: shelfY });
    currentX += fw + padding;
    rowHeight = Math.max(rowHeight, fh);
  }

  lineW = Math.max(lineW, currentX);
  const totalH = shelfY + rowHeight + padding;
  return { packed, width: lineW || 64, height: totalH || 64 };
}

/* ── Render packed frames to canvas ── */

function renderAtlas(frames, w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  for (const f of frames) {
    ctx.drawImage(f.img, f.x, f.y, f.w, f.h);
  }
  return canvas;
}

/* ── Frame highlight colours ── */

const FRAME_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F8B500", "#6C5B7B", "#F38181", "#AAE1DB", "#FFC9DE",
];

/* ── Helper: next power of two ── */
const nextPow2 = (v) => 1 << (32 - Math.clz32(v - 1));

/* ── Main component ── */

export default function TexturePackerApp() {
  /* ── State ── */
  const [assets, setAssets] = useState([]);       // { id, name, img, w, h, url }
  const [isDragging, setIsDragging] = useState(false);
  const [padding, setPadding] = useState(2);
  const [maxWidth, setMaxWidth] = useState(2048);
  const [pot, setPot] = useState(false);
  const [result, setResult] = useState(null);     // { url, frames, w, h }
  const [isPacking, setIsPacking] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);
  const toastTimer = useRef(null);
  let nextId = useRef(1);

  const showToast = useCallback((msg, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* ── Cleanup asset URLs on unmount ── */
  useEffect(() => {
    return () => { assets.forEach((a) => URL.revokeObjectURL(a.url)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Add files ── */
  const addFiles = useCallback((files) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!imageFiles.length) {
      showToast("No image files found", "error");
      return;
    }

    let loaded = 0;
    const newAssets = [];

    for (const file of imageFiles) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const name = file.name.replace(/\.[^/.]+$/, "");
        newAssets.push({
          id: nextId.current++,
          name,
          img,
          w: img.naturalWidth,
          h: img.naturalHeight,
          url,
        });
        loaded++;
        if (loaded === imageFiles.length) {
          setAssets((prev) => [...prev, ...newAssets]);
          setResult(null);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        loaded++;
        if (loaded === imageFiles.length) {
          setAssets((prev) => [...prev, ...newAssets]);
        }
      };
      img.src = url;
    }
  }, [showToast]);

  /* ── Remove asset ── */
  const removeAsset = useCallback((id) => {
    setAssets((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item) URL.revokeObjectURL(item.url);
      const next = prev.filter((a) => a.id !== id);
      if (next.length === 0) setResult(null);
      return next;
    });
  }, []);

  /* ── Clear all ── */
  const clearAll = useCallback(() => {
    setAssets((prev) => {
      prev.forEach((a) => URL.revokeObjectURL(a.url));
      return [];
    });
    setResult(null);
  }, []);

  /* ── Drag handlers ── */
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  /* ── Pack ── */
  const handlePack = useCallback(async () => {
    if (assets.length === 0) return;
    setIsPacking(true);
    try {
      const frames = assets.map((a) => ({ name: `${a.name}.png`, img: a.img, w: a.w, h: a.h }));
      const mw = pot ? nextPow2(maxWidth) : maxWidth;
      const { packed, width, height } = shelfPack(frames, padding, mw);
      const finalW = pot ? nextPow2(width) : width;
      const finalH = pot ? nextPow2(height) : height;
      const canvas = renderAtlas(packed, finalW, finalH);
      const url = canvas.toDataURL("image/png");
      setResult({ url, frames: packed, w: finalW, h: finalH });
      const used = ((packed.reduce((s, f) => s + f.w * f.h, 0) / (finalW * finalH)) * 100).toFixed(1);
      showToast(`Packed ${packed.length} images — ${finalW}×${finalH} (${used}% used)`);
    } catch (err) {
      showToast(err.message || "Packing failed", "error");
    } finally {
      setIsPacking(false);
    }
  }, [assets, padding, maxWidth, pot, showToast]);

  /* ── Download ZIP ── */
  const handleDownload = useCallback(async () => {
    if (!result) return;
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      /* ── Build plist XML string (Cocos Creator 2.x compatible) ── */
      function esc(s) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
      let plistXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      plistXml += '<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n';
      plistXml += '<plist version="1.0">\n';
      plistXml += '    <dict>\n';
      plistXml += '        <key>frames</key>\n';
      plistXml += '        <dict>\n';
      for (const f of result.frames) {
        plistXml += `            <key>${esc(f.name)}</key>\n`;
        plistXml += '            <dict>\n';
        plistXml += `                <key>frame</key>\n`;
        plistXml += `                <string>{{${f.x},${f.y}},{${f.w},${f.h}}}</string>\n`;
        plistXml += `                <key>offset</key>\n`;
        plistXml += `                <string>{0,0}</string>\n`;
        plistXml += `                <key>rotated</key>\n`;
        plistXml += `                <false/>\n`;
        plistXml += `                <key>sourceColorRect</key>\n`;
        plistXml += `                <string>{{0,0},{${f.w},${f.h}}}</string>\n`;
        plistXml += `                <key>sourceSize</key>\n`;
        plistXml += `                <string>{${f.w},${f.h}}</string>\n`;
        plistXml += '            </dict>\n';
      }
      plistXml += '        </dict>\n';
      plistXml += '        <key>metadata</key>\n';
      plistXml += '        <dict>\n';
      plistXml += '            <key>format</key>\n';
      plistXml += '            <integer>2</integer>\n';
      plistXml += '            <key>realTextureFileName</key>\n';
      plistXml += '            <string>spritesheet.png</string>\n';
      plistXml += '            <key>size</key>\n';
      plistXml += `            <string>{${result.w},${result.h}}</string>\n`;
      plistXml += '            <key>textureFileName</key>\n';
      plistXml += '            <string>spritesheet.png</string>\n';
      plistXml += '        </dict>\n';
      plistXml += '    </dict>\n';
      plistXml += '</plist>\n';
      zip.file("spritesheet.plist", plistXml);

      const blob = await new Promise((r) => {
        const c = document.createElement("canvas");
        c.width = result.w;
        c.height = result.h;
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, result.w, result.h);
        for (const f of result.frames) ctx.drawImage(f.img, f.x, f.y, f.w, f.h);
        c.toBlob(r, "image/png");
      });
      zip.file("spritesheet.png", blob);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(zipBlob);
      a.download = "texturepack_output.zip";
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("Downloaded texturepack_output.zip");
    } catch (err) {
      showToast(err.message || "Download failed", "error");
    }
  }, [result, showToast]);

  /* ── Result preview cleanup ── */
  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  /* ── Render ── */
  return (
    <div className="texturepacker-app">
      <h2>Texture Packer</h2>

      {/* ── Drop zone ── */}
      {assets.length === 0 ? (
        <div
          className={`tp-dropzone${isDragging ? " dragging" : ""}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="tp-dropzone-icon">📦</div>
          <div className="tp-dropzone-title">Drop images here</div>
          <div className="tp-dropzone-hint">or click to browse &middot; PNG, JPG, WebP</div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
          />
        </div>
      ) : (
        /* ── Asset table ── */
        <div className="tp-section">
          <div className="tp-section-header">
            <span className="tp-section-title">Assets ({assets.length})</span>
            <div className="tp-section-actions">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                + Add
              </button>
              <button className="btn btn-ghost btn-sm" onClick={clearAll}>
                Clear
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
          />
          <div className="tp-asset-table">
            <div className="tp-asset-row tp-asset-header">
              <span className="tp-asset-preview" />
              <span className="tp-asset-name">Name</span>
              <span className="tp-asset-size">Size</span>
              <span className="tp-asset-action" />
            </div>
            {assets.map((a) => (
              <div key={a.id} className="tp-asset-row">
                <span className="tp-asset-preview">
                  <img src={a.url} alt={a.name} />
                </span>
                <span className="tp-asset-name" title={a.name}>{a.name}</span>
                <span className="tp-asset-size">{a.w}×{a.h}</span>
                <span className="tp-asset-action">
                  <button
                    className="btn btn-ghost btn-sm tp-remove-btn"
                    onClick={() => removeAsset(a.id)}
                    title="Remove"
                  >
                    ✕
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Settings ── */}
      {assets.length > 0 && (
        <div className="tp-section">
          <div className="tp-section-header">
            <span className="tp-section-title">Settings</span>
          </div>
          <div className="tp-settings">
            <div className="tp-setting">
              <label>Padding</label>
              <input
                type="number"
                min={0}
                max={64}
                value={padding}
                onChange={(e) => { setPadding(Math.max(0, +e.target.value)); setResult(null); }}
                className="tp-num-input"
              />
            </div>
            <div className="tp-setting">
              <label>Max width</label>
              <input
                type="number"
                min={64}
                max={4096}
                step={64}
                value={maxWidth}
                onChange={(e) => { setMaxWidth(Math.max(64, +e.target.value)); setResult(null); }}
                className="tp-num-input"
              />
              <div className="tp-pot-chips">
                {[512, 1024, 2048, 4096].map((v) => (
                  <button
                    key={v}
                    className={`tp-pot-chip${maxWidth === v ? " active" : ""}`}
                    onClick={() => { setMaxWidth(v); setResult(null); }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="tp-setting tp-setting-check">
              <label>
                <input
                  type="checkbox"
                  checked={pot}
                  onChange={(e) => { setPot(e.target.checked); setResult(null); }}
                />
                Power of 2
              </label>
            </div>
            <div className="tp-setting-action">
              <button
                className="btn btn-primary btn-sm"
                onClick={handlePack}
                disabled={isPacking || assets.length === 0}
              >
                {isPacking ? "Packing…" : "Pack"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Result ── */}
      {result && (
        <div className="tp-section">
          <div className="tp-section-header">
            <span className="tp-section-title">
              Result — {result.w}×{result.h}px, {result.frames.length} frames
            </span>
            <button className="btn btn-primary btn-sm" onClick={handleDownload}>
              ⬇ Download ZIP
            </button>
          </div>
          <div className="tp-result">
            <div className="tp-result-canvas-wrap">
              <div className="tp-result-canvas">
                <img
                  src={result.url}
                  alt="Packed sprite sheet"
                  draggable={false}
                />
                {/* Frame overlays — percentage-based to match scaled display */}
                {result.frames.map((f, i) => (
                  <div
                    key={i}
                    className="tp-frame-rect"
                    style={{
                      left: `${(f.x / result.w) * 100}%`,
                      top: `${(f.y / result.h) * 100}%`,
                      width: `${(f.w / result.w) * 100}%`,
                      height: `${(f.h / result.h) * 100}%`,
                      borderColor: FRAME_COLORS[i % FRAME_COLORS.length],
                    }}
                    title={`${f.name} (${f.w}×${f.h})`}
                  >
                    <span className="tp-frame-label">{f.name.replace(".png", "")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && <div className={`tp-toast tp-toast--${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
