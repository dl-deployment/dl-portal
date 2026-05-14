import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import "./spritesheetslicer.css";

/* ── Plist Parser (Cocos Creator format) ── */

function parsePlist(xmlStr) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, "text/xml");
  if (doc.querySelector("parsererror")) return null;

  function walk(node) {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1) return null;
    switch (node.tagName) {
      case "plist": {
        for (let c = node.firstChild; c; c = c.nextSibling)
          if (c.nodeType === 1) return walk(c);
        return null;
      }
      case "dict": {
        const obj = {};
        const kids = [];
        for (let c = node.firstChild; c; c = c.nextSibling)
          if (c.nodeType === 1) kids.push(c);
        for (let i = 0; i + 1 < kids.length; i += 2)
          if (kids[i].tagName === "key") obj[kids[i].textContent.trim()] = walk(kids[i + 1]);
        return obj;
      }
      case "string":
        return node.textContent.trim();
      case "integer":
        return parseInt(node.textContent.trim(), 10);
      case "real":
        return parseFloat(node.textContent.trim());
      case "true":
        return true;
      case "false":
        return false;
      case "array": {
        const arr = [];
        for (let c = node.firstChild; c; c = c.nextSibling)
          if (c.nodeType === 1) arr.push(walk(c));
        return arr;
      }
      default:
        return null;
    }
  }
  return walk(doc.documentElement);
}

function numsFromCocosStr(str) {
  const m = str.match(/\d+/g);
  return m ? m.map(Number) : null;
}

function toRect(n) {
  if (!n || n.length < 4) return null;
  return { x: n[0], y: n[1], w: n[2], h: n[3] };
}
function toSize(n) {
  if (!n || n.length < 2) return null;
  return { w: n[0], h: n[1] };
}
function toPoint(n) {
  if (!n || n.length < 2) return null;
  return { x: n[0], y: n[1] };
}

const FRAME_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F8B500", "#6C5B7B", "#F38181", "#AAE1DB", "#FFC9DE",
];

/* ── Component ── */

export default function SpriteSheetSlicerApp() {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState("grid");

  // Grid state
  const [cols, setCols] = useState(2);
  const [rows, setRows] = useState(2);
  const [inputCols, setInputCols] = useState("2");
  const [inputRows, setInputRows] = useState("2");
  const [inputW, setInputW] = useState("");
  const [inputH, setInputH] = useState("");

  // Plist state
  const [plistData, setPlistData] = useState(null);
  const [plistFileName, setPlistFileName] = useState("");
  const [restoreTrim, setRestoreTrim] = useState(true);

  const [isDragging, setIsDragging] = useState(false);
  const [isPlistDragging, setIsPlistDragging] = useState(false);
  const [isSlicing, setIsSlicing] = useState(false);
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);
  const plistInputRef = useRef(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  /* ── cleanup ── */
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      clearTimeout(toastTimer.current);
    };
  }, [imageUrl]);

  /* ── Memoised frames ── */
  const frames = useMemo(() => {
    if (!plistData || !plistData.frames) return [];
    return Object.entries(plistData.frames).flatMap(([name, data]) => {
      if (typeof data !== "object" || !data.frame) return [];
      const frame = toRect(numsFromCocosStr(data.frame));
      const sourceSize = toSize(numsFromCocosStr(data.sourceSize || ""));
      const sourceColorRect = toRect(numsFromCocosStr(data.sourceColorRect || ""));
      const offset = toPoint(numsFromCocosStr(data.offset || ""));
      const rotated = !!data.rotated;
      if (!frame || !sourceSize) return [];
      const displayFrame = rotated
        ? { x: frame.x, y: frame.y, w: frame.h, h: frame.w }
        : frame;
      return [{
        name: name.replace(/\.[^/.]+$/, ""),
        rawName: name,
        frame,
        displayFrame,
        rotated,
        sourceSize,
        sourceColorRect: sourceColorRect || { x: 0, y: 0, w: frame.w, h: frame.h },
        offset: offset || { x: 0, y: 0 },
      }];
    });
  }, [plistData]);

  /* ── File handlers ── */
  function handleFile(file) {
    if (!file) return;
    if (file.name.endsWith(".plist")) {
      handlePlistFile(file);
      return;
    }
    if (!file.type.startsWith("image/")) {
      showToast("Please drop an image or .plist file", "error");
      return;
    }
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setImageUrl(url);
      setFileName(file.name.replace(/\.[^/.]+$/, ""));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      showToast("Failed to load image", "error");
    };
    img.src = url;
  }

  function handlePlistFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const xml = e.target.result;
      const data = parsePlist(xml);
      if (!data || !data.frames) {
        showToast("Invalid plist — no frames found", "error");
        return;
      }
      setPlistData(data);
      setPlistFileName(file.name);
      const count = Object.keys(data.frames).length;
      setMode("plist");
      showToast(`Loaded ${count} frame${count > 1 ? "s" : ""} from plist`);
    };
    reader.onerror = () => showToast("Failed to read plist file", "error");
    reader.readAsText(file);
  }

  /* ── Drag / drop ── */
  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  /* ── Plist drag / drop ── */
  function handlePlistDragOver(e) {
    e.preventDefault();
    setIsPlistDragging(true);
  }

  function handlePlistDragLeave(e) {
    e.preventDefault();
    setIsPlistDragging(false);
  }

  function handlePlistDrop(e) {
    e.preventDefault();
    setIsPlistDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".plist")) {
      handlePlistFile(file);
    } else {
      showToast("Please drop a .plist file", "error");
    }
  }

  function handleReset() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImage(null);
    setImageUrl(null);
    setFileName("");
    setCols(2);
    setRows(2);
    setInputCols("2");
    setInputRows("2");
    setInputW("");
    setInputH("");
    setPlistData(null);
    setPlistFileName("");
    setMode("grid");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (plistInputRef.current) plistInputRef.current.value = "";
  }

  function resetPlist() {
    setPlistData(null);
    setPlistFileName("");
    if (plistInputRef.current) plistInputRef.current.value = "";
  }

  /* ── Grid input handlers ── */
  function handleColsBlur() {
    let val = parseInt(inputCols) || 1;
    val = Math.max(1, Math.min(100, val));
    setCols(val);
    setInputCols(String(val));
  }

  function handleRowsBlur() {
    let val = parseInt(inputRows) || 1;
    val = Math.max(1, Math.min(100, val));
    setRows(val);
    setInputRows(String(val));
  }

  function handleWidthBlur() {
    if (!image) return;
    let val = parseInt(inputW) || 1;
    val = Math.max(1, val);
    const newCols = Math.max(1, Math.min(100, Math.floor(image.naturalWidth / val)));
    setCols(newCols);
    setInputCols(String(newCols));
    setInputW("");
  }

  function handleHeightBlur() {
    if (!image) return;
    let val = parseInt(inputH) || 1;
    val = Math.max(1, val);
    const newRows = Math.max(1, Math.min(100, Math.floor(image.naturalHeight / val)));
    setRows(newRows);
    setInputRows(String(newRows));
    setInputH("");
  }

  /* ── Frame extraction (plist) ── */
  function extractFrame(texture, f) {
    const { displayFrame, rotated, sourceSize, sourceColorRect } = f;

    // 1 — cut using displayFrame (swap w/h for rotated → actual texture rect)
    const cut = document.createElement("canvas");
    cut.width = displayFrame.w;
    cut.height = displayFrame.h;
    const cutCtx = cut.getContext("2d");
    cutCtx.drawImage(texture, displayFrame.x, displayFrame.y, displayFrame.w, displayFrame.h, 0, 0, displayFrame.w, displayFrame.h);

    // 2 — un-rotate if needed
    let content = cut;
    if (rotated) {
      content = document.createElement("canvas");
      content.width = displayFrame.h;
      content.height = displayFrame.w;
      const ctx = content.getContext("2d");
      ctx.translate(content.width / 2, content.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(cut, -cut.width / 2, -cut.height / 2);
    }

    // 3 — optionally restore trimmed size
    if (restoreTrim && sourceSize) {
      const out = document.createElement("canvas");
      out.width = sourceSize.w;
      out.height = sourceSize.h;
      const outCtx = out.getContext("2d");
      outCtx.drawImage(content, sourceColorRect.x, sourceColorRect.y);
      return out;
    }
    return content;
  }

  /* ── Slice ── */
  async function handleSlice() {
    if (!image) return;
    setIsSlicing(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      if (mode === "plist" && frames.length > 0) {
        for (const f of frames) {
          const canvas = extractFrame(image, f);
          const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
          zip.file(f.rawName, blob);
        }
        showToast(`Extracted ${frames.length} frame${frames.length > 1 ? "s" : ""}`);
      } else {
        const cellW = Math.floor(image.naturalWidth / cols);
        const cellH = Math.floor(image.naturalHeight / rows);
        const canvas = document.createElement("canvas");
        canvas.width = cellW;
        canvas.height = cellH;
        const ctx = canvas.getContext("2d");
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            ctx.clearRect(0, 0, cellW, cellH);
            ctx.drawImage(image, c * cellW, r * cellH, cellW, cellH, 0, 0, cellW, cellH);
            const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
            zip.file(`${fileName}_r${r}_c${c}.png`, blob);
          }
        }
        showToast(`Sliced into ${cols * rows} piece${cols * rows > 1 ? "s" : ""}`);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(zipBlob);
      a.download = `${fileName}_${mode === "plist" ? "plist" : `${cols}x${rows}`}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      showToast(err.message || "Slicing failed", "error");
    } finally {
      setIsSlicing(false);
    }
  }

  const cellW = image ? Math.floor(image.naturalWidth / cols) : 0;
  const cellH = image ? Math.floor(image.naturalHeight / rows) : 0;
  const canSlice = image && (mode !== "plist" || plistData);

  /* ── Render ── */
  return (
    <div className="spritesheetslicer-app">
      <div className="ss-header">
        <h2>SpriteSheet Slicer</h2>
        {image && (
          <>
            <span className="ss-filename">{fileName}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleReset}>
              Reset
            </button>
          </>
        )}
      </div>

      {/* Mode tabs */}
      <div className="ss-mode-tabs">
        <button
          className={`ss-mode-tab${mode === "grid" ? " active" : ""}`}
          onClick={() => setMode("grid")}
        >
          Grid
        </button>
        <button
          className={`ss-mode-tab${mode === "plist" ? " active" : ""}`}
          onClick={() => setMode("plist")}
        >
          Plist (Cocos)
        </button>
      </div>

      {!image ? (
        <div
          className={`ss-dropzone${isDragging ? " dragging" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="ss-dropzone-icon">🖼</div>
          <div className="ss-dropzone-text">
            Drop a spritesheet image{mode === "plist" ? " or .plist file" : ""} here or{" "}
            <span>browse</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={mode === "plist" ? ".plist,image/*" : "image/*"}
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <>
          {/* ── Controls ── */}
          <div className="ss-controls">
            {mode === "grid" ? (
              <>
                <div className="ss-control-group">
                  <label>Cols</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={inputCols}
                    onChange={(e) => setInputCols(e.target.value)}
                    onBlur={handleColsBlur}
                    onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                  />
                </div>
                <div className="ss-control-group">
                  <label>Rows</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={inputRows}
                    onChange={(e) => setInputRows(e.target.value)}
                    onBlur={handleRowsBlur}
                    onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                  />
                </div>
                <span className="ss-separator">/</span>
                <div className="ss-control-group">
                  <label>W</label>
                  <input
                    type="number"
                    min={1}
                    placeholder={String(cellW)}
                    onChange={(e) => setInputW(e.target.value)}
                    onBlur={handleWidthBlur}
                    onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                  />
                </div>
                <div className="ss-control-group">
                  <label>H</label>
                  <input
                    type="number"
                    min={1}
                    placeholder={String(cellH)}
                    onChange={(e) => setInputH(e.target.value)}
                    onBlur={handleHeightBlur}
                    onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                  />
                </div>
                <div className="ss-info">
                  <span>
                    {cols * rows} pieces &middot; {cellW}&times;{cellH}px each
                  </span>
                </div>
              </>
            ) : !plistData ? (
              <div
                className={`ss-plist-dropzone${isPlistDragging ? " dragging" : ""}`}
                onDrop={handlePlistDrop}
                onDragOver={handlePlistDragOver}
                onDragLeave={handlePlistDragLeave}
                onClick={() => plistInputRef.current?.click()}
              >
                <div className="ss-plist-dropzone-text">
                  Drop Cocos <strong>.plist</strong> file here or{" "}
                  <span>browse</span>
                </div>
                <input
                  ref={plistInputRef}
                  type="file"
                  accept=".plist"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files[0]) handlePlistFile(e.target.files[0]);
                    e.target.value = "";
                  }}
                />
              </div>
            ) : (
              <div className="ss-plist-info">
                <span>📄 {plistFileName}</span>
                <span className="ss-plist-badge">{frames.length} frame{frames.length > 1 ? "s" : ""}</span>
                <label className="ss-checkbox">
                  <input
                    type="checkbox"
                    checked={restoreTrim}
                    onChange={(e) => setRestoreTrim(e.target.checked)}
                  />
                  Restore trim
                </label>
                <button className="btn btn-ghost btn-xs" onClick={resetPlist}>
                  Change
                </button>
              </div>
            )}

            <div className="ss-info">
              <span>
                {image.naturalWidth}&times;{image.naturalHeight}px
              </span>
            </div>

            <button
              className="btn btn-primary btn-sm"
              onClick={handleSlice}
              disabled={isSlicing || !canSlice}
            >
              {isSlicing
                ? "Slicing…"
                : "Slice & Download ZIP"}
            </button>
          </div>

          {/* ── Preview ── */}
          <div className="ss-preview">
            <div className="ss-preview-container">
              <img src={imageUrl} alt="Spritesheet preview" />
              {mode === "grid" ? (
                <div
                  className="ss-grid-overlay"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                  }}
                >
                  {Array.from({ length: cols * rows }, (_, i) => (
                    <div key={i} className="ss-grid-cell" />
                  ))}
                </div>
              ) : (
                plistData && frames.length > 0 && (
                  <div className="ss-frame-overlay">
                    {frames.map((f, i) => (
                      <div
                        key={i}
                        className="ss-frame-rect"
                        style={{
                          left: `${(f.displayFrame.x / image.naturalWidth) * 100}%`,
                          top: `${(f.displayFrame.y / image.naturalHeight) * 100}%`,
                          width: `${(f.displayFrame.w / image.naturalWidth) * 100}%`,
                          height: `${(f.displayFrame.h / image.naturalHeight) * 100}%`,
                          borderColor: FRAME_COLORS[i % FRAME_COLORS.length],
                        }}
                        title={f.rawName}
                      />
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className={`ss-toast ${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}
