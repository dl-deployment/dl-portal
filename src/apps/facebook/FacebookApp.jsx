import { useState, useEffect, useRef } from "react";
import * as api from "./api.js";
import TabBar from "../bookmarks/components/TabBar";
import FacebookForm from "./components/FacebookForm";
import FacebookGrid from "./components/FacebookGrid";
import "./facebook.css";

function syncCache(tabs, pagesMap) {
  const pages = [];
  for (const t of tabs) {
    for (const p of pagesMap[t.id] || []) pages.push(p);
  }
  api.updateCache({ tabs, pages });
}

export default function FacebookApp() {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [pagesMap, setPagesMap] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [ready, setReady] = useState(false);
  const visitedTabs = useRef(new Set());

  const activeTab = tabs.find((t) => t.id === activeTabId);

  useEffect(() => {
    api.fetchPages().then(({ tabs: freshTabs, pages: allPages }) => {
      setTabs(freshTabs);

      const map = {};
      for (const t of freshTabs) map[t.id] = [];
      for (const p of allPages) {
        if (map[p.sheetId]) map[p.sheetId].push(p);
      }
      setPagesMap(map);

      if (freshTabs.length > 0) {
        const firstId = freshTabs[0].id;
        setActiveTabId(firstId);
        visitedTabs.current.add(firstId);
      }
      setReady(true);
    });
  }, []);

  function handleSelectTab(id) {
    visitedTabs.current.add(id);
    setActiveTabId(id);
  }

  async function handleCreateTab(name) {
    const tab = await api.createTab(name);
    const newTabs = [...tabs, tab];
    const newMap = { ...pagesMap, [tab.id]: [] };
    setTabs(newTabs);
    setPagesMap(newMap);
    visitedTabs.current.add(tab.id);
    setActiveTabId(tab.id);
    syncCache(newTabs, newMap);
  }

  async function handleRenameTab(id, name) {
    const newTabs = tabs.map((t) => (t.id === id ? { ...t, name } : t));
    setTabs(newTabs);
    syncCache(newTabs, pagesMap);
    await api.renameTab(id, name);
  }

  async function handleDeleteTab(id) {
    const remaining = tabs.filter((t) => t.id !== id);
    const newMap = { ...pagesMap };
    delete newMap[id];
    setTabs(remaining);
    setPagesMap(newMap);
    visitedTabs.current.delete(id);
    if (activeTabId === id) {
      const nextId = remaining[0]?.id ?? null;
      if (nextId) visitedTabs.current.add(nextId);
      setActiveTabId(nextId);
    }
    syncCache(remaining, newMap);
    await api.deleteTab(id);
  }

  async function handleSave(page) {
    if (!activeTab) return;
    await api.addPage(activeTab.name, page);
    const newPage = { ...page, sheetId: activeTabId, id: Date.now() };
    const newMap = {
      ...pagesMap,
      [activeTabId]: [...(pagesMap[activeTabId] || []), newPage],
    };
    setPagesMap(newMap);
    setShowForm(false);
    syncCache(tabs, newMap);
  }

  async function handleDelete(sheetId, rowIndex) {
    const newMap = {
      ...pagesMap,
      [sheetId]: (pagesMap[sheetId] || []).filter((p) => p.id !== rowIndex),
    };
    setPagesMap(newMap);
    syncCache(tabs, newMap);
    await api.deletePage(sheetId, rowIndex);
  }

  return (
    <div className="facebook-app">
      {!ready ? <div className="app-loading">Loading...</div> : <>
      <div className="fb-header">
        <h2>Facebook Pages</h2>
        <div className="fb-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
            disabled={tabs.length === 0}
          >
            + Add Page
          </button>
        </div>
      </div>

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelect={handleSelectTab}
        onCreate={handleCreateTab}
        onRename={handleRenameTab}
        onDelete={handleDeleteTab}
      />

      {showForm && (
        <FacebookForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {tabs.filter((t) => visitedTabs.current.has(t.id)).map((t) => (
        <div key={t.id} style={{ display: t.id === activeTabId ? undefined : "none" }}>
          <FacebookGrid pages={pagesMap[t.id] || []} onDelete={handleDelete} />
        </div>
      ))}
      </>}
    </div>
  );
}
