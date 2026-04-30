import { useState, useRef, useCallback, useEffect } from "react";
import "./spritesheetslicer.css";

export default function SpriteSheetSlicerApp() {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [cols, setCols] = useState(2);
  const [rows, setRows] = useState(2);
  const [inputCols, setInputCols] = useState("2");
  const [inputRows, setInputRows] = useState("2");
  const [inputW, setInputW] = useState("");
  const [inputH, setInputH] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSlicing, setIsSlicing] = useState(false);
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      clearTimeout(toastTimer.current);
    };
  }, [imageUrl]);

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      showToast("Please drop an image file", "error");
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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

  async function handleSlice() {
    if (!image) return;
    setIsSlicing(true);

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      const cellW = Math.floor(image.naturalWidth / cols);
      const cellH = Math.floor(image.naturalHeight / rows);

      const canvas = document.createElement("canvas");
      canvas.width = cellW;
      canvas.height = cellH;
      const ctx = canvas.getContext("2d");

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.clearRect(0, 0, cellW, cellH);
          ctx.drawImage(
            image,
            c * cellW,
            r * cellH,
            cellW,
            cellH,
            0,
            0,
            cellW,
            cellH
          );

          const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/png")
          );
          zip.file(`${fileName}_r${r}_c${c}.png`, blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(zipBlob);
      a.download = `${fileName}_${cols}x${rows}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);

      showToast(`Sliced into ${cols * rows} pieces`);
    } catch (err) {
      showToast(err.message || "Slicing failed", "error");
    } finally {
      setIsSlicing(false);
    }
  }

  const cellW = image ? Math.floor(image.naturalWidth / cols) : 0;
  const cellH = image ? Math.floor(image.naturalHeight / rows) : 0;

  return (
    <div className="spritesheetslicer-app">
      <div className="ss-header">
        <h2>SpriteSheet Slicer</h2>
        {image && (
          <button className="btn btn-ghost btn-sm" onClick={handleReset}>
            Reset
          </button>
        )}
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
            Drop a spritesheet image here or <span>browse</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <>
          <div className="ss-controls">
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
              <span>
                {image.naturalWidth}&times;{image.naturalHeight}px total
              </span>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSlice}
              disabled={isSlicing}
            >
              {isSlicing ? "Slicing..." : "Slice & Download ZIP"}
            </button>
          </div>

          <div className="ss-preview">
            <div className="ss-preview-container">
              <img src={imageUrl} alt="Spritesheet preview" />
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
