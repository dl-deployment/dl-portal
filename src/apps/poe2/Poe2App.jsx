import { useState, useMemo, useCallback } from "react";
import Skeleton from "../../components/Skeleton";
import "./poe2.css";

const DEFAULT_URL = "https://poe2db.tw/us/Amulets#ModifiersCalc";
const TRADE_SITE = "https://www.pathofexile.com/trade2";

const SOURCE_META = [
  { key: "normal", label: "Base" },
  { key: "essence", label: "Essence" },
  { key: "perfect_essence", label: "Perfect Essence" },
  { key: "desecrated", label: "Boss" },
  { key: "corrupted", label: "Vaal" },
  { key: "breach_otherworldly", label: "Breach" },
  { key: "breach_minion", label: "Breach Minion" },
  { key: "breach_caster", label: "Breach Caster" },
];

function cleanStat(html) {
  return html
    .replace(/<span\s+class="ndash">—<\/span>/g, "—")
    .replace(/<span\s+class='mod-value'>([\s\S]*?)<\/span>/g, "$1")
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&ndash;/g, "—")
    .replace(/\s+/g, " ")
    .trim();
}

function niceName(str) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/^(\w)/, (c) => c.toUpperCase())
    .replace(/Ib /g, "IB ")
    .trim();
}

/**
 * Derive a short description from a stat string by replacing numbers/ranges/parens with #.
 */
function shortDesc(stat) {
  return stat
    .replace(/[+]\s*/, "")
    .replace(/\(?\d+\s*(—|–|-)\s*\d+\)?/g, "#")
    .replace(/\(?\d+\)?/g, "#")
    .replace(/—\d+/g, "")
    .replace(/\s*#\s*/g, " # ")
    .replace(/\s+/g, " ")
    .replace(/^# . /, "")
    .trim();
}

function parseModifiersConfig(html) {
  const mvIdx = html.indexOf("new ModsView(");
  if (mvIdx === -1) return null;
  const jsonStart = html.indexOf("{", mvIdx);
  if (jsonStart === -1) return null;
  let depth = 1;
  let i = jsonStart + 1;
  while (depth > 0 && i < html.length) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") depth--;
    i++;
  }
  try {
    return JSON.parse(html.substring(jsonStart, i));
  } catch {
    return null;
  }
}

function buildData(config) {
  const result = { prefix: {}, suffix: {} };

  for (const { key: srcKey } of SOURCE_META) {
    const arr = config[srcKey];
    if (!Array.isArray(arr) || arr.length === 0) continue;

    for (const m of arr) {
      const family = (m.ModFamilyList && m.ModFamilyList[0]) || "Other";
      const typeKey = m.ModGenerationTypeID === "1" ? "prefix" : "suffix";
      if (!result[typeKey][srcKey]) result[typeKey][srcKey] = {};
      if (!result[typeKey][srcKey][family]) result[typeKey][srcKey][family] = [];
      result[typeKey][srcKey][family].push({
        ...m,
        _src: srcKey,
        _family: family,
        _stat: cleanStat(m.str || ""),
        _cleanName: cleanStat(m.Name || ""),
        _levelNum: parseInt(m.Level, 10) || 0,
      });
    }
  }

  for (const typeKey of ["prefix", "suffix"]) {
    for (const sources of Object.values(result[typeKey])) {
      for (const list of Object.values(sources)) {
        list.sort((a, b) => a._levelNum - b._levelNum);
        list.forEach((m, i) => {
          m._tier = i + 1;
          m._id = `${typeKey}-${m._src}-${m._family}-${m.Name}-${m.Level}`;
        });
      }
    }
  }

  return result;
}

export default function Poe2App() {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mainTab, setMainTab] = useState("prefix");
  const [sourceTab, setSourceTab] = useState(null);
  const [tradeLink, setTradeLink] = useState("");
  const [collapsed, setCollapsed] = useState({});

  async function handleFetch() {
    setLoading(true);
    setError("");
    setData(null);
    setSelected({});
    setFilter("");
    setMainTab("prefix");
    setSourceTab(null);
    setCollapsed({});

    try {
      const res = await fetch(`/api/fetch-poedb?url=${encodeURIComponent(url)}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Request failed (${res.status})`);
      }
      const { html } = await res.json();
      if (!html) throw new Error("Empty response");

      const config = parseModifiersConfig(html);
      if (!config) {
        setError("Could not find modifier data in this page.");
        return;
      }

      const d = buildData(config);
      const total = Object.values(d.prefix).reduce((s, src) => s + Object.values(src).reduce((a, l) => a + l.length, 0), 0)
                 + Object.values(d.suffix).reduce((s, src) => s + Object.values(src).reduce((a, l) => a + l.length, 0), 0);

      if (total === 0) {
        setError("No modifiers found.");
        return;
      }

      setData(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleMod(id) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function getSelectedStats() {
    if (!data) return [];
    const stats = [];
    for (const typeKey of ["prefix", "suffix"]) {
      for (const sources of Object.values(data[typeKey])) {
        for (const list of Object.values(sources)) {
          for (const m of list) {
            if (selected[m._id]) stats.push(m._stat);
          }
        }
      }
    }
    return stats;
  }

  function handleCopyMods() {
    const list = getSelectedStats();
    if (list.length === 0) {
      alert("Select at least one modifier first.");
      return;
    }
    navigator.clipboard.writeText(list.join("\n")).catch(() => {});
  }

  function generateTradeUrl() {
    const stats = getSelectedStats();
    if (stats.length === 0) return TRADE_SITE;
    const query = {
      query: {
        status: { option: "online" },
        stats: [{
          type: "and",
          filters: stats.map(s => ({
            id: s,
            value: { min: 1 },
            disabled: false,
          })),
        }],
      },
      sort: { price: "asc" },
    };
    return `${TRADE_SITE}#${encodeURIComponent(JSON.stringify(query))}`;
  }

  function openTradeSite() {
    const url = generateTradeUrl();
    navigator.clipboard.writeText(url).catch(() => {});
    setTradeLink(url);
    window.open(url, "_blank", "noopener", "noreferrer");
  }

  function toggleCollapse(familyName) {
    setCollapsed((prev) => ({ ...prev, [familyName]: !prev[familyName] }));
  }

  function expandAll() {
    if (!familyList.length) return;
    const all = {};
    familyList.forEach((f) => { all[f.familyName] = true; });
    setCollapsed(all);
  }

  function collapseAll() {
    setCollapsed({});
  }

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const sourceTabList = useMemo(() => {
    if (!data) return [];
    const typeData = data[mainTab];
    return SOURCE_META.filter(({ key }) => typeData[key]).map(({ key, label }) => {
      const total = Object.values(typeData[key]).reduce((s, list) => s + list.length, 0);
      return { key, label, total };
    });
  }, [data, mainTab]);

  const activeSource = sourceTab && data?.[mainTab]?.[sourceTab]
    ? sourceTab
    : sourceTabList[0]?.key || null;

  const familyList = useMemo(() => {
    if (!data || !activeSource) return [];
    const sources = data[mainTab][activeSource];
    if (!sources) return [];
    const f = filter.toLowerCase().trim();

    return Object.entries(sources)
      .map(([familyName, mods]) => {
        const matched = f
          ? mods.filter(m => m._cleanName.toLowerCase().includes(f) || m._stat.toLowerCase().includes(f))
          : mods;
        return { familyName, mods: matched, _desc: shortDesc(matched[0]?._stat || "") };
      })
      .filter(e => e.mods.length > 0)
      .sort((a, b) => a.familyName.localeCompare(b.familyName));
  }, [data, mainTab, activeSource, filter]);

  // Auto-expand families that match filter
  const effectiveCollapsed = useMemo(() => {
    if (!filter.trim()) return collapsed;
    const result = { ...collapsed };
    for (const f of familyList) {
      const hasFilterMatch = f.mods.some(
        (m) => m._cleanName.toLowerCase().includes(filter.toLowerCase()) || m._stat.toLowerCase().includes(filter.toLowerCase())
      );
      if (hasFilterMatch) result[f.familyName] = true;
    }
    return result;
  }, [collapsed, filter, familyList]);

  function selectAllInFamily(mods) {
    setSelected((prev) => {
      const next = { ...prev };
      mods.forEach((m) => { next[m._id] = true; });
      return next;
    });
  }

  function deselectAllInFamily(mods) {
    setSelected((prev) => {
      const next = { ...prev };
      mods.forEach((m) => { delete next[m._id]; });
      return next;
    });
  }

  return (
    <div className="poe2-app">
      <div className="poe2-header">
        <h2>POE 2 Trade Helper — Modifiers</h2>
      </div>

      <div className="poe2-input-row">
        <input
          className="poe2-url-input"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter poe2db.tw URL..."
        />
        <button className="poe2-btn poe2-btn-primary" onClick={handleFetch} disabled={loading}>
          {loading ? "Loading..." : "Fetch Modifiers"}
        </button>
      </div>

      {error && <div className="poe2-error">{error}</div>}

      {loading && (
        <div className="poe2-loading">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} style={{ height: 80, borderRadius: 8, marginBottom: 12 }} />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="poe2-toolbar">
            <input
              className="poe2-filter-input"
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name or stat..."
            />
            <span className="poe2-count">{selectedCount} selected</span>
            <div className="poe2-toolbar-actions">
              <button className="poe2-btn poe2-btn-outline" onClick={() => setSelected({})} disabled={selectedCount === 0}>
                Clear
              </button>
              <button className="poe2-btn poe2-btn-outline" onClick={handleCopyMods}>
                Copy Mods
              </button>
              <button className="poe2-btn poe2-btn-trade" onClick={openTradeSite}>
                Open Trade Site
              </button>
            </div>
          </div>

          <div className="poe2-maintabs" role="tablist">
            <button
              className={`poe2-maintab${mainTab === "prefix" ? " poe2-maintab-active" : ""}`}
              onClick={() => { setMainTab("prefix"); setSourceTab(null); }}
              role="tab"
              aria-selected={mainTab === "prefix"}
            >
              Prefix
            </button>
            <button
              className={`poe2-maintab${mainTab === "suffix" ? " poe2-maintab-active" : ""}`}
              onClick={() => { setMainTab("suffix"); setSourceTab(null); }}
              role="tab"
              aria-selected={mainTab === "suffix"}
            >
              Suffix
            </button>
          </div>

          <div className="poe2-sourcetabs" role="tablist">
            {sourceTabList.map(({ key, label, total }) => (
              <button
                key={key}
                className={`poe2-sourcetab${activeSource === key ? " poe2-sourcetab-active" : ""}`}
                onClick={() => setSourceTab(key)}
                role="tab"
                aria-selected={activeSource === key}
              >
                {label}
                <span className="poe2-tab-count">{total}</span>
              </button>
            ))}
          </div>

          {/* Trade link */}
          {tradeLink && (
            <div className="poe2-trade-link">
              <a href={tradeLink} target="_blank" rel="noopener noreferrer">{tradeLink}</a>
              <button className="poe2-btn poe2-btn-mini" onClick={() => { navigator.clipboard.writeText(tradeLink).catch(() => {}); }}>Copy</button>
            </div>
          )}

          {/* Expand / Collapse All */}
          {familyList.length > 1 && (
            <div className="poe2-collapse-actions">
              <button className="poe2-btn poe2-btn-text" onClick={expandAll}>Expand All</button>
              <button className="poe2-btn poe2-btn-text" onClick={collapseAll}>Collapse All</button>
            </div>
          )}

          {/* Family groups */}
          {familyList.length > 0 ? (
            familyList.map(({ familyName, mods, _desc }) => {
              const isOpen = !!effectiveCollapsed[familyName];
              return (
                <section key={familyName} className="poe2-family-group">
                  <div className="poe2-family-header" onClick={() => toggleCollapse(familyName)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && toggleCollapse(familyName)}>
                    <span className={`poe2-collapse-icon${isOpen ? " poe2-collapse-open" : ""}`}>&#9654;</span>
                    <span className="poe2-family-title">{niceName(familyName)}</span>
                    {!_desc && <span className="poe2-family-count">{mods.length}</span>}
                    <div className="poe2-family-actions" onClick={(e) => e.stopPropagation()}>
                      {isOpen && (
                        <>
                          <button className="poe2-btn poe2-btn-mini" onClick={() => selectAllInFamily(mods)}>All</button>
                          <button className="poe2-btn poe2-btn-mini" onClick={() => deselectAllInFamily(mods)}>None</button>
                        </>
                      )}
                    </div>
                  </div>

                  {!isOpen && _desc && (
                    <div className="poe2-family-desc" onClick={() => toggleCollapse(familyName)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && toggleCollapse(familyName)}>
                      {_desc}
                    </div>
                  )}

                  {isOpen && (
                    <div className="poe2-mod-list">
                      {mods.map((m) => (
                        <label
                          key={m._id}
                          className={`poe2-mod-item${selected[m._id] ? " poe2-mod-checked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={!!selected[m._id]}
                            onChange={() => toggleMod(m._id)}
                          />
                          <span className="poe2-mod-text">
                            <span className="poe2-mod-tier">T{m._tier}</span>
                            <span className="poe2-mod-level">({m.Level})</span>
                            {m._cleanName && <span className="poe2-mod-name">{m._cleanName}</span>}
                            <span className="poe2-mod-stat">{m._stat}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </section>
              );
            })
          ) : (
            <div className="poe2-empty">No modifiers match your filter.</div>
          )}
        </>
      )}
    </div>
  );
}
