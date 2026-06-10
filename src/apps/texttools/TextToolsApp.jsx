import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "./texttools.css";

// ── Protobuf Decode (defined first to avoid Vite hoisting issues) ──
function protobufDecode(text) {
  const raw = atob(text.trim());
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return formatProtobufFields(decodeProtobuf(bytes, 0).result, 0);
}

function formatProtobufFields(fields, indent) {
  const pad = "  ".repeat(indent);
  const lines = fields.map((f) => {
    const prefix = `${pad}${f.fieldNumber} [${f.type}]`;
    if (f.repeated) {
      return `${prefix}: [\n${f.value.map((v) => {
        if (typeof v === "object" && !Array.isArray(v)) {
          return `${pad}  ${formatProtobufFields([v], indent + 2)}`;
        }
        return `${pad}  ${v}`;
      }).join(",\n")}\n${pad}]`;
    }
    if (f.type === "message") {
      return `${prefix}:\n${formatProtobufFields(f.value, indent + 1)}`;
    }
    return `${prefix}: ${f.value}`;
  });
  return lines.join("\n");
}

function decodeProtobuf(bytes, offset) {
  const fields = [];
  while (offset < bytes.length) {
    const tag = decodeVarint(bytes, offset);
    if (tag === null) break;
    const fieldNumber = tag.value >> 3;
    const wireType = tag.value & 0x07;
    offset = tag.next;

    const field = { fieldNumber, wireType };
    if (wireType === 0) {
      const v = decodeVarint(bytes, offset);
      if (v === null) throw new Error(`Truncated varint at field ${fieldNumber}`);
      field.type = "varint";
      field.value = v.value;
      offset = v.next;
    } else if (wireType === 1) {
      if (offset + 8 > bytes.length) throw new Error(`Truncated 64-bit at field ${fieldNumber}`);
      field.type = "fixed64";
      const dv = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
      const asDouble = dv.getFloat64(0, true);
      const hex = [...bytes.slice(offset, offset + 8)].reverse().map(b => b.toString(16).padStart(2, "0")).join("");
      field.value = `${asDouble} (0x${hex})`;
      offset += 8;
    } else if (wireType === 2) {
      const len = decodeVarint(bytes, offset);
      if (len === null) throw new Error(`Truncated length at field ${fieldNumber}`);
      offset = len.next;
      if (offset + len.value > bytes.length) throw new Error(`Truncated data at field ${fieldNumber}`);
      const sub = bytes.slice(offset, offset + len.value);
      if (isPrintable(sub)) {
        field.type = "string";
        field.value = new TextDecoder().decode(sub);
      } else {
        const nested = decodeProtobuf(sub, 0);
        if (sub.length >= 2 && nested.result.length > 0 && nested.offset === sub.length) {
          field.type = "message";
          field.value = nested.result;
        } else {
          field.type = "bytes";
          field.value = [...sub].map(b => b.toString(16).padStart(2, "0")).join(" ");
        }
      }
      offset += len.value;
    } else if (wireType === 5) {
      if (offset + 4 > bytes.length) throw new Error(`Truncated 32-bit at field ${fieldNumber}`);
      field.type = "fixed32";
      const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 4);
      field.value = `0x${[...bytes.slice(offset, offset + 4)].reverse().map(b => b.toString(16).padStart(2, "0")).join("")}`;
      offset += 4;
    } else {
      field.type = "unknown";
      field.value = `wireType=${wireType}`;
    }
    const last = fields[fields.length - 1];
    if (last && last.fieldNumber === field.fieldNumber && last.type === field.type && !Array.isArray(last.value)) {
      last.value = [last.value, field.value];
      last.repeated = true;
    } else if (last && last.fieldNumber === field.fieldNumber && last.repeated) {
      last.value.push(field.value);
    } else {
      fields.push(field);
    }
  }
  return { result: fields, offset };
}

function decodeVarint(bytes, offset) {
  let value = 0;
  let shift = 0;
  while (offset < bytes.length) {
    const byte = bytes[offset++];
    value |= (byte & 0x7f) << shift;
    if (!(byte & 0x80)) return { value, next: offset };
    shift += 7;
    if (shift > 63) throw new Error("Varint too long");
  }
  return null;
}

function isPrintable(bytes) {
  if (bytes.length === 0) return false;
  for (const b of bytes) {
    if (b < 32 && b !== 9 && b !== 10 && b !== 13) return false;
    if (b > 126) return false;
  }
  return true;
}

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
      { id: "case-camel", label: "camelCase", action: toCamelCase },
      { id: "case-snake", label: "snake_case", action: toSnakeCase },
      { id: "case-kebab", label: "kebab-case", action: toKebabCase },
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
  {
    id: "url",
    label: "URL",
    options: [
      { id: "url-encode", label: "Encode", action: urlEncode },
      { id: "url-decode", label: "Decode", action: urlDecode },
    ],
  },
  {
    id: "html",
    label: "HTML",
    options: [
      { id: "html-encode", label: "Encode", action: htmlEncode },
      { id: "html-decode", label: "Decode", action: htmlDecode },
    ],
  },
  {
    id: "jwt",
    label: "JWT",
    options: [{ id: "jwt-decode", label: "Decode", action: jwtDecode }],
  },
  {
    id: "format",
    label: "Format",
    options: [
      { id: "fmt-xml", label: "XML / HTML", action: formatXml },
      { id: "fmt-sql", label: "SQL", action: formatSql },
    ],
  },
  {
    id: "lines",
    label: "Lines",
    options: [
      { id: "lines-sort-asc", label: "Sort A→Z", action: sortLinesAsc },
      { id: "lines-sort-desc", label: "Sort Z→A", action: sortLinesDesc },
      { id: "lines-dedup", label: "Remove Duplicates", action: dedup },
      { id: "lines-reverse", label: "Reverse", action: reverseLines },
      { id: "lines-number", label: "Add Numbers", action: addLineNumbers },
    ],
  },
  {
    id: "proto",
    label: "Protobuf",
    options: [
      { id: "proto-decode", label: "Decode (Base64)", action: protobufDecode },
    ],
  },
  {
    id: "hash",
    label: "Hash",
    options: [
      { id: "hash-md5", label: "MD5", action: hashMd5 },
      { id: "hash-sha256", label: "SHA-256", action: hashSha256 },
    ],
  },
];

// ── JSON ──────────────────────────────────
function formatJsonPretty(text) {
  return JSON.stringify(JSON.parse(text), null, 2);
}
function formatJsonMinify(text) {
  return JSON.stringify(JSON.parse(text));
}

// ── Case ──────────────────────────────────
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
function splitWords(text) {
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_\-]+/g, " ")
    .trim()
    .split(/\s+/);
}
function toCamelCase(text) {
  const words = splitWords(text);
  return words
    .map((w, i) =>
      i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()
    )
    .join("");
}
function toSnakeCase(text) {
  return splitWords(text)
    .map((w) => w.toLowerCase())
    .join("_");
}
function toKebabCase(text) {
  return splitWords(text)
    .map((w) => w.toLowerCase())
    .join("-");
}

// ── Trim ──────────────────────────────────
function trimText(text) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Base64 ────────────────────────────────
function base64Encode(text) {
  return btoa(unescape(encodeURIComponent(text)));
}
function base64Decode(text) {
  return decodeURIComponent(escape(atob(text)));
}

// ── URL ───────────────────────────────────
function urlEncode(text) {
  return encodeURIComponent(text);
}
function urlDecode(text) {
  return decodeURIComponent(text);
}

// ── HTML Entity ───────────────────────────
function htmlEncode(text) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return text.replace(/[&<>"']/g, (c) => map[c]);
}
function htmlDecode(text) {
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
}

// ── JWT ───────────────────────────────────
function jwtDecode(text) {
  const parts = text.trim().split(".");
  if (parts.length < 2) throw new Error("Invalid JWT");
  const pad = (s) => s + "=".repeat((4 - (s.length % 4)) % 4);
  const header = JSON.parse(atob(pad(parts[0].replace(/-/g, "+").replace(/_/g, "/"))));
  const payload = JSON.parse(atob(pad(parts[1].replace(/-/g, "+").replace(/_/g, "/"))));
  return JSON.stringify({ header, payload }, null, 2);
}

// ── Format XML/HTML ───────────────────────
function formatXml(text) {
  let formatted = "";
  let indent = 0;
  const lines = text
    .replace(/(>)\s*(<)/g, "$1\n$2")
    .split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("</")) indent = Math.max(indent - 1, 0);
    formatted += "  ".repeat(indent) + trimmed + "\n";
    if (
      trimmed.match(/^<[^/!?]/) &&
      !trimmed.match(/\/>$/) &&
      !trimmed.match(/<\/.*>$/)
    )
      indent++;
  }
  return formatted.trim();
}

// ── Format SQL ────────────────────────────
function formatSql(text) {
  const keywords = [
    "SELECT", "FROM", "WHERE", "AND", "OR", "ORDER BY", "GROUP BY",
    "HAVING", "LIMIT", "OFFSET", "INSERT INTO", "VALUES", "UPDATE",
    "SET", "DELETE FROM", "JOIN", "LEFT JOIN", "RIGHT JOIN",
    "INNER JOIN", "OUTER JOIN", "ON", "AS", "IN", "NOT", "NULL",
    "IS", "LIKE", "BETWEEN", "UNION", "ALL", "DISTINCT", "CREATE",
    "TABLE", "ALTER", "DROP", "INDEX", "INTO",
  ];
  let result = text.replace(/\s+/g, " ").trim();
  for (const kw of keywords) {
    const regex = new RegExp(`\\b${kw}\\b`, "gi");
    result = result.replace(regex, `\n${kw}`);
  }
  return result.trim();
}

// ── Lines ─────────────────────────────────
function sortLinesAsc(text) {
  return text.split("\n").sort((a, b) => a.localeCompare(b)).join("\n");
}
function sortLinesDesc(text) {
  return text.split("\n").sort((a, b) => b.localeCompare(a)).join("\n");
}
function dedup(text) {
  return [...new Set(text.split("\n"))].join("\n");
}
function reverseLines(text) {
  return text.split("\n").reverse().join("\n");
}
function addLineNumbers(text) {
  return text
    .split("\n")
    .map((l, i) => `${i + 1}  ${l}`)
    .join("\n");
}

// ── Hash (async) ──────────────────────────
async function hashWith(algo, text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest(algo, data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
async function hashMd5(text) {
  const { md5 } = await import("./md5.js");
  return md5(text);
}
async function hashSha256(text) {
  return hashWith("SHA-256", text);
}

// ── Stats ─────────────────────────────────
function getStats(text) {
  if (!text) return { chars: 0, words: 0, lines: 0 };
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text.split("\n").length;
  return { chars, words, lines };
}

export default function TextToolsApp() {
  const [text, setText] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [toast, setToast] = useState(null);
  const menuRef = useRef(null);
  const toastTimer = useRef(null);

  const stats = useMemo(() => getStats(text), [text]);

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

  async function applyTool(action) {
    if (!text) return;
    try {
      const result = await action(text);
      setText(result);
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

      <div className="tt-footer">
        <span>{stats.chars} chars</span>
        <span>{stats.words} words</span>
        <span>{stats.lines} lines</span>
      </div>

      {toast && (
        <div className={`tt-toast tt-toast--${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
