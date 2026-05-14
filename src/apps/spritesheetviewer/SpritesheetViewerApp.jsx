import { useState, useRef, useCallback, useEffect } from "react";
import "./spritesheetviewer.css";

const LOOP_MODES = [
  { id: "loop", label: "Loop" },
  { id: "ping-pong", label: "Ping Pong" },
  { id: "no-loop", label: "No Loop" },
];

export default function SpritesheetViewerApp() {
  const [frames, setFrames] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fps, setFps] = useState(12);
  const [loopMode, setLoopMode] = useState("loop");
  const [isPlaying, setIsPlaying] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const animRef = useRef(null);
  const indexRef = useRef(0);
  const dirRef = useRef(1);
  const fpsRef = useRef(12);
  const loopRef = useRef("loop");

  useEffect(() => {
    fpsRef.current = fps;
  }, [fps]);

  useEffect(() => {
    loopRef.current = loopMode;
  }, [loopMode]);

  const stopAnimation = useCallback(() => {
    if (animRef.current) {
      clearInterval(animRef.current);
      animRef.current = null;
    }
  }, []);

  const startAnimation = useCallback(() => {
    stopAnimation();
    const interval = 1000 / fpsRef.current;
    animRef.current = setInterval(() => {
      const mode = loopRef.current;
      const len = frames.length;
      if (len === 0) return;

      if (mode === "no-loop") {
        if (indexRef.current >= len - 1) {
          stopAnimation();
          setIsPlaying(false);
          return;
        }
        indexRef.current += 1;
      } else if (mode === "ping-pong") {
        indexRef.current += dirRef.current;
        if (indexRef.current >= len - 1 || indexRef.current <= 0) {
          dirRef.current *= -1;
        }
      } else {
        indexRef.current = (indexRef.current + 1) % len;
      }
      setCurrentIndex(indexRef.current);
    }, interval);
  }, [frames, stopAnimation]);

  useEffect(() => {
    if (isPlaying && frames.length > 1) {
      indexRef.current = currentIndex;
      if (loopRef.current === "ping-pong") {
        dirRef.current = currentIndex >= frames.length - 1 ? -1 : 1;
      } else {
        dirRef.current = 1;
      }
      startAnimation();
    }
    return stopAnimation;
  }, [isPlaying, frames.length, startAnimation, stopAnimation]);

  useEffect(() => {
    if (isPlaying && frames.length > 1) {
      stopAnimation();
      startAnimation();
    }
  }, [fps]);

  function handlePlayPause() {
    if (frames.length === 0) return;
    if (isPlaying) {
      stopAnimation();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  }

  function handleStop() {
    stopAnimation();
    setIsPlaying(false);
    setCurrentIndex(0);
    indexRef.current = 0;
    dirRef.current = 1;
  }

  function handleFrameClick(index) {
    if (isPlaying) {
      stopAnimation();
      setIsPlaying(false);
    }
    setCurrentIndex(index);
    indexRef.current = index;
  }

  function handleFiles(files) {
    stopAnimation();
    setIsPlaying(false);
    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (imageFiles.length === 0) return;
    const urls = imageFiles.map((f) => URL.createObjectURL(f));
    setFrames((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u));
      return urls;
    });
    setCurrentIndex(0);
    indexRef.current = 0;
    dirRef.current = 1;
    setIsPlaying(true);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function handleFpsChange(e) {
    setFps(Number(e.target.value));
  }

  function handleLoopChange(mode) {
    setLoopMode(mode);
    if (mode === "loop" || mode === "ping-pong") {
      if (!isPlaying && frames.length > 1) {
        setIsPlaying(true);
      }
    }
  }

  const hasFrames = frames.length > 0;

  return (
    <div className="spritesheetviewer-app">
      <h2>SpriteSheet Viewer</h2>

      {/* Drop zone */}
      {!hasFrames && (
        <div
          className={`sv-dropzone ${dragOver ? "sv-dropzone--over" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="sv-dropzone__icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="sv-dropzone__text">
            Drop image files here to preview animation
          </p>
          <p className="sv-dropzone__hint">
            Supports PNG, GIF, JPG, WebP
          </p>
        </div>
      )}

      {/* Preview */}
      {hasFrames && (
        <>
          <div
            className="sv-preview"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {dragOver && (
              <div className="sv-preview__overlay">
                <span>Drop to replace frames</span>
              </div>
            )}
            <img
              className="sv-preview__img"
              src={frames[currentIndex]}
              alt={`Frame ${currentIndex + 1}`}
            />
            <div className="sv-preview__badge">
              {currentIndex + 1} / {frames.length}
            </div>
          </div>

          {/* Strip */}
          <div className="sv-strip">
            {frames.map((url, i) => (
              <button
                key={i}
                className={`sv-strip__thumb ${
                  i === currentIndex && isPlaying
                    ? "sv-strip__thumb--active"
                    : i === currentIndex
                    ? "sv-strip__thumb--selected"
                    : ""
                }`}
                onClick={() => handleFrameClick(i)}
              >
                <img src={url} alt={`Frame ${i + 1}`} />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Controls */}
      <div className="sv-controls">
        <div className="sv-controls__row">
          {hasFrames && (
            <>
              <button
                className="btn btn-primary btn-sm"
                onClick={handlePlayPause}
                disabled={frames.length < 2}
              >
                {isPlaying ? "⏸ Pause" : "▶ Play"}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleStop}
              >
                ⏹ Stop
              </button>
            </>
          )}

          {!hasFrames && (
            <span className="sv-controls__empty">
              Drop images above or drag more to replace
            </span>
          )}
        </div>

        {hasFrames && (
          <div className="sv-controls__sliders">
            {/* FPS */}
            <div className="sv-controls__group">
              <label className="sv-controls__label">
                FPS: <strong>{fps}</strong>
              </label>
              <input
                type="range"
                min="1"
                max="60"
                step="1"
                value={fps}
                onChange={handleFpsChange}
                className="sv-controls__range"
              />
            </div>

            {/* Loop mode */}
            <div className="sv-controls__group sv-controls__group--full">
              <label className="sv-controls__label">Loop</label>
              <div className="sv-controls__tabs">
                {LOOP_MODES.map((m) => (
                  <button
                    key={m.id}
                    className={`btn btn-sm ${
                      loopMode === m.id ? "btn-primary" : "btn-ghost"
                    }`}
                    onClick={() => handleLoopChange(m.id)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
