import { useState, useCallback, useEffect } from "react";
import { getQuickLinks, saveQuickLink, deleteQuickLink } from "./store.js";
import "./poe2.css";

const TABS = [
  { key: "regex", label: "Regex" },
  { key: "market", label: "Market" },
];

const REGEX_SEGMENTS = [
  {
    label: "Rarity",
    patterns: [
      { key: "normal", label: "Normal", regex: "Rarity: Normal" },
      { key: "magic", label: "Magic", regex: "Rarity: Magic" },
      { key: "rare", label: "Rare", regex: "Rarity: Rare" },
      { key: "unique", label: "Unique", regex: "Rarity: Unique" },
    ],
  },
  {
    label: "Status",
    patterns: [
      { key: "corrupted", label: "Corrupted", regex: "Corrupted" },
      { key: "unidentified", label: "Unidentified", regex: "Unidentified" },
    ],
  },
  {
    label: "Price",
    patterns: [
      { key: "exalted", label: "Exalted", regex: "exalted" },
      { key: "chaos", label: "Chaos", regex: "chaos" },
      { key: "divine", label: "Divine", regex: "divine" },
    ],
  },
  {
    label: "Waystone",
    subsections: [
      { key: "effectiveness", label: "Effectiveness", regex: "ess:.*#%" },
      { key: "pack-size", label: "Pack Size", regex: "k s.*#%" },
      { key: "monster-rarity", label: "Monster Rarity", regex: "ter ra.*#%" },
      { key: "item-rarity", label: "Item Rarity", regex: "em r.*#%" },
      { key: "waystone-drop", label: "Waystone Drop", regex: "p c.*#%" },
    ],
  },
  {
    label: "Tablet",
    patterns: [
      { key: "tablet", label: "Tablet", regex: "Tablet" },
    ],
  },
];

function buildMinNumberRegex(n) {
  if (!n || n < 0) return null;
  const s = String(n);
  if (s.length === 1) {
    return `[${n}-9]|[1-9]\\d`;
  }
  const tens = parseInt(s[0]);
  const ones = parseInt(s[1]);
  const parts = [];
  if (ones <= 8) {
    parts.push(`${tens}[${ones}-9]`);
  } else {
    parts.push(`${tens}9`);
  }
  if (tens < 9) {
    parts.push(`[${tens + 1}-9]\\d`);
  }
  parts.push("[1-9]\\d{2,}");
  return parts.join("|");
}

const DEFAULT_MARKET_URL = "https://www.pathofexile.com/api/trade2/search/poe2/Runes%20of%20Aldur";

function emptyPayload() {
  return JSON.stringify({ query: { status: { option: "securable" } } }, null, 2);
}

export default function Poe2App() {
  const [activeTab, setActiveTab] = useState("regex");
  const [regexText, setRegexText] = useState("");
  const [waystoneThresholds, setWaystoneThresholds] = useState({
    effectiveness: 36,
    "pack-size": 40,
    "monster-rarity": 55,
    "item-rarity": 60,
    "waystone-drop": 110,
  });

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }, []);

  const toggleRegex = useCallback((regex) => {
    const token = '"' + regex + '"';
    setRegexText((prev) => {
      if (prev.includes(token)) {
        const next = prev.replace(token, "").replace(/  +/g, " ").trim();
        copyToClipboard(next);
        return next;
      }
      const next = prev ? prev + " " + token : token;
      copyToClipboard(next);
      return next;
    });
  }, [copyToClipboard]);

  const [marketUrl, setMarketUrl] = useState(DEFAULT_MARKET_URL);
  const [marketData, setMarketData] = useState([]);
  const [quickLinks, setQuickLinks] = useState([]);
  const [editing, setEditing] = useState(null); // null | { id?, name, payload }
  const [searchingId, setSearchingId] = useState(null);

  useEffect(() => {
    getQuickLinks().then(setQuickLinks);
  }, []);

  useEffect(() => {
    setRegexText((prev) => {
      let next = prev;
      REGEX_SEGMENTS.forEach((seg) => {
        if (!seg.subsections) return;
        seg.subsections.forEach(({ key: subKey, regex: subRegex }) => {
          const baseEscaped = subRegex.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("#%", "\\([^)]*\\)%");
          const oldPattern = new RegExp('"' + baseEscaped + '"');
          const match = next.match(oldPattern);
          if (match) {
            const numRegex = buildMinNumberRegex(waystoneThresholds[subKey]);
            const newCombined = numRegex ? subRegex.replace("#%", `(${numRegex})%`) : subRegex.replace("#%", "\\d+%");
            next = next.replace(match[0], '"' + newCombined + '"');
          }
        });
      });
      if (next !== prev) {
        copyToClipboard(next);
      }
      return next;
    });
  }, [waystoneThresholds]);

  async function handleSearch(link) {
    setSearchingId(link.id);
    try {
      const res = await fetch("/api/poe2-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: marketUrl, payload: link.payload }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const tradeUrl = marketUrl.replace("/api/trade2/", "/trade2/") + "/" + data.id;
      window.open(tradeUrl, "_blank", "noopener,noreferrer");
    } catch {
      // silently fail — trade site may be unreachable
    }
    setSearchingId(null);
  }

  function startCreate() {
    setEditing({ name: "", payload: emptyPayload() });
  }

  function startEdit(link) {
    setEditing({ id: link.id, name: link.name, payload: link.payload });
  }

  function cancelEdit() {
    setEditing(null);
  }

  async function saveEdit() {
    if (!editing.name.trim()) return;
    const link = {
      id: editing.id || 0,
      name: editing.name.trim(),
      payload: editing.payload,
    };
    await saveQuickLink(link);
    setQuickLinks(await getQuickLinks());
    setEditing(null);
  }

  async function removeLink(id) {
    await deleteQuickLink(id);
    setQuickLinks(await getQuickLinks());
  }

  function handlePayloadKeyDown(e) {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.target;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const value = ta.value;
      ta.value = value.substring(0, start) + "  " + value.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 2;
    }
  }

  return (
    <div className="poe2-app">
      <div className="poe2-header">
        <h2>POE 2</h2>
      </div>

      <div className="poe2-tabs" role="tablist">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`poe2-tab${activeTab === key ? " poe2-tab-active" : ""}`}
            onClick={() => setActiveTab(key)}
            role="tab"
            aria-selected={activeTab === key}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="poe2-tab-content">
        {activeTab === "regex" && (
          <div className="poe2-regex">
            <div className="poe2-segment">
              <label className="poe2-segment-label">Regex</label>
              <div className="poe2-regex-row">
                <input
                  type="text"
                  className="poe2-input"
                  value={regexText}
                  onChange={(e) => setRegexText(e.target.value)}
                  placeholder="Click to build regex"
                />
                <button
                  className="poe2-btn poe2-btn-clear"
                  onClick={() => setRegexText("")}
                  disabled={!regexText}
                >
                  Clear
                </button>
              </div>
            </div>
            {REGEX_SEGMENTS.map((seg) =>
              seg.subsections ? (
                <div className="poe2-segment" key={seg.label}>
                  <label className="poe2-segment-label">{seg.label}</label>
                  {seg.subsections.map(({ key: subKey, label: subLabel, regex: subRegex }) => {
                    const displayRegex = waystoneThresholds[subKey]
                      ? subRegex.replace("#%", `(${buildMinNumberRegex(waystoneThresholds[subKey])})%`)
                      : subRegex;
                    return (
                    <div className="poe2-waystone-row" key={subKey}>
                      <input
                        type="number"
                        className="poe2-waystone-input"
                        placeholder="Min"
                        value={waystoneThresholds[subKey] || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setWaystoneThresholds((prev) => ({
                            ...prev,
                            [subKey]: v === "" ? undefined : parseInt(v, 10),
                          }));
                        }}
                      />
                      <span className="poe2-waystone-label">{subLabel}</span>
                      {(() => {
                        const numRegex = buildMinNumberRegex(waystoneThresholds[subKey]);
                        const combined = numRegex ? subRegex.replace("#%", `(${numRegex})%`) : subRegex.replace("#%", "\\d+%");
                        const isActive = regexText.includes('"' + combined + '"');
                        return (
                          <code
                            className={`poe2-waystone-regex${isActive ? " poe2-waystone-regex-active" : ""}`}
                            onClick={() => toggleRegex(combined)}
                          >{displayRegex}</code>
                        );
                      })()}
                    </div>
                  )})}
                </div>
              ) : (
                <div className="poe2-segment" key={seg.label}>
                  <label className="poe2-segment-label">{seg.label}</label>
                  <div className="poe2-rarity-tabs">
                    {seg.patterns.map(({ key, label: btnLabel, regex }) => {
                      const isActive = regexText.includes('"' + regex + '"');
                      return (
                      <button
                        key={key}
                        className={`poe2-rarity-tab${isActive ? " poe2-rarity-active" : ""}`}
                        onClick={() => toggleRegex(regex)}
                      >
                        {btnLabel}
                      </button>
                    )})}
                  </div>
                </div>
              )
            )}
          </div>
        )}
        {activeTab === "market" && (
          <div className="poe2-market">
            <div className="poe2-segment">
              <label className="poe2-segment-label">Market Url</label>
              <div className="poe2-url-row">
                <input
                  type="text"
                  className="poe2-input"
                  value={marketUrl}
                  onChange={(e) => setMarketUrl(e.target.value)}
                />
                <button className="poe2-btn poe2-btn-create" onClick={startCreate}>
                  Create
                </button>
              </div>
            </div>

            {editing && (
              <div className="poe2-segment poe2-segment-edit">
                <label className="poe2-segment-label">
                  {editing.id ? "Edit Quick Link" : "New Quick Link"}
                </label>
                <input
                  type="text"
                  className="poe2-input"
                  placeholder="Name"
                  value={editing.name}
                  onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                />
                <textarea
                  className="poe2-input poe2-textarea"
                  placeholder="Payload (JSON)"
                  value={editing.payload}
                  onChange={(e) => setEditing((p) => ({ ...p, payload: e.target.value }))}
                  onKeyDown={handlePayloadKeyDown}
                />
                <div className="poe2-edit-actions">
                  <button className="poe2-btn poe2-btn-save" onClick={saveEdit}>
                    Save
                  </button>
                  <button className="poe2-btn poe2-btn-cancel" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {quickLinks.length > 0 && (
              <div className="poe2-segment">
                <label className="poe2-segment-label">Quick Link</label>
                <ul className="poe2-data-list">
                  {quickLinks.map((link) => (
                    <li key={link.id} className="poe2-data-item poe2-quick-link-item">
                      <button
                        className="poe2-quick-link-btn"
                        disabled={searchingId === link.id}
                        onClick={() => handleSearch(link)}
                      >
                        {searchingId === link.id ? "..." : link.name}
                      </button>
                      <div className="poe2-quick-link-actions">
                        <button
                          className="poe2-btn poe2-btn-icon"
                          title="Edit"
                          onClick={() => startEdit(link)}
                        >
                          ✎
                        </button>
                        <button
                          className="poe2-btn poe2-btn-icon poe2-btn-danger"
                          title="Remove"
                          onClick={() => removeLink(link.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {marketData.length > 0 && (
              <div className="poe2-segment">
                <label className="poe2-segment-label">Results</label>
                <ul className="poe2-data-list">
                  {marketData.map((item, i) => (
                    <li key={i} className="poe2-data-item">
                      {typeof item === "string" ? item : JSON.stringify(item)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
