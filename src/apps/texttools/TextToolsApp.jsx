import { useState, useEffect, useRef, useCallback } from "react";
import "./texttools.css";

const TOOLS = [
  {
    id: "json",
    label: "JSON",
    options: [
      { id: "json-pretty", label: "Pretty", action: formatJsonPretty },
      { id: "json-minify", label: "Minify", action: formatJsonMinify },
    ],
  },
  {
    id: "case",
    label: "Case",
    options: [
      { id: "case-upper", label: "UPPER", action: toUpper },
      { id: "case-lower", label: "lower", action: toLower },
      { id: "case-title", label: "Title Case", action: toTitleCase },
    ],
  },
  { id: "trim", label: "Trim", action: trimText },
  {
    id: "base64",
    label: "Base64",
    options: [
      { id: "b64-encode", label: "Encode", action: base64Encode },
      { id: "b64-decode", label: "Decode", action: base64Decode },
    ],
  },
];

function formatJsonPretty(text) {
  return JSON.stringify(JSON.parse(text), null, 2);
}

function formatJsonMinify(text) {
  return JSON.stringify(JSON.parse(text));
}

function toUpper(text) {
  return text.toUpperCase();
}

function toLower(text) {
  return text.toLowerCase();
}

function toTitleCase(text) {
  return text.replace(
    /\b\w+/g,
    (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()
  );
}

function trimText(text) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function base64Encode(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

function base64Decode(text) {
  return decodeURIComponent(escape(atob(text)));
}

export default function TextToolsApp() {
  const [text, setText] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [toast, setToast] = useState(null);
  const menuRef = useRef(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function applyTool(action) {
    if (!text) return;
    try {
      setText(action(text));
      showToast("Done");
    } catch {
      showToast("Error: invalid input", "error");
    }
    setOpenMenu(null);
  }

  function handleCopy() {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast("Copied");
  }

  function handleClear() {
    setText("");
    setOpenMenu(null);
  }

  return (
    <div className="texttools-app">
      <div className="tt-header">
        <h2>Text Tools</h2>
        <div className="tt-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
            Copy
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleClear}>
            Clear
          </button>
        </div>
      </div>

      <div className="tt-toolbar" ref={menuRef}>
        {TOOLS.map((tool) =>
          tool.options ? (
            <div className="tt-dropdown" key={tool.id}>
              <button
                className={`btn btn-outline btn-sm${openMenu === tool.id ? " active" : ""}`}
                onClick={() =>
                  setOpenMenu(openMenu === tool.id ? null : tool.id)
                }
              >
                {tool.label} ▾
              </button>
              {openMenu === tool.id && (
                <div className="tt-dropdown-menu">
                  {tool.options.map((opt) => (
                    <button
                      key={opt.id}
                      className="tt-dropdown-item"
                      onClick={() => applyTool(opt.action)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              key={tool.id}
              className="btn btn-outline btn-sm"
              onClick={() => applyTool(tool.action)}
            >
              {tool.label}
            </button>
          )
        )}
      </div>

      <textarea
        className="tt-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or type text here..."
        spellCheck={false}
      />

      {toast && (
        <div className={`tt-toast tt-toast--${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
