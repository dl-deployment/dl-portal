import { useState, useEffect, useCallback, useRef } from "react";
import * as store from "./store.js";
import TabBar from "./components/TabBar";
import BookmarkForm from "./components/BookmarkForm";
import BookmarkGrid from "./components/BookmarkGrid";
import "./bookmarks.css";

export default function BookmarksApp() {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [bookmarksMap, setBookmarksMap] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [ready, setReady] = useState(false);
  const visitedTabs = useRef(new Set());

  const bookmarks = bookmarksMap[activeTabId] || [];

  useEffect(() => {
    store.getTabs().then((t) => {
      setTabs(t);
      if (t.length > 0) {
        const firstId = t[0].id;
        setActiveTabId(firstId);
        visitedTabs.current.add(firstId);
        store.getBookmarks(firstId).then((bm) =>
          setBookmarksMap((prev) => ({ ...prev, [firstId]: bm }))
        );
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (activeTabId) {
      visitedTabs.current.add(activeTabId);
      store.getBookmarks(activeTabId).then((bm) =>
        setBookmarksMap((prev) => ({ ...prev, [activeTabId]: bm }))
      );
    }
  }, [activeTabId]);

  const reload = useCallback(async () => {
    const freshTabs = await store.getTabs();
    setTabs(freshTabs);
    const bm = await store.getBookmarks(activeTabId);
    setBookmarksMap((prev) => ({ ...prev, [activeTabId]: bm }));
  }, [activeTabId]);

  async function handleCreateTab(name) {
    const tab = await store.createTab(name);
    setActiveTabId(tab.id);
    await reload();
  }

  async function handleRenameTab(id, name) {
    await store.updateTab(id, name);
    await reload();
  }

  async function handleDeleteTab(id) {
    await store.deleteTab(id);
    const freshTabs = await store.getTabs();
    setTabs(freshTabs);
    visitedTabs.current.delete(id);
    setBookmarksMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (activeTabId === id) {
      const newId = freshTabs[0]?.id;
      setActiveTabId(newId);
      if (newId) {
        visitedTabs.current.add(newId);
        store.getBookmarks(newId).then((bm) =>
          setBookmarksMap((prev) => ({ ...prev, [newId]: bm }))
        );
      }
    }
  }

  async function handleSave(payload) {
    if (payload.id) {
      await store.updateBookmark(payload.id, payload);
    } else {
      await store.createBookmark({ ...payload, tabId: activeTabId });
    }
    setShowForm(false);
    setEditingBookmark(null);
    await reload();
  }

  function handleEdit(bookmark) {
    setEditingBookmark(bookmark);
    setShowForm(true);
  }

  async function handleDelete(id) {
    await store.deleteBookmark(id);
    await reload();
  }

  function handleAdd() {
    setEditingBookmark(null);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingBookmark(null);
  }

  return (
    <div className="bookmarks-app">
      {!ready ? <div className="app-loading">Loading...</div> : <>
      <div className="bm-header">
        <h2>Bookmarks</h2>
        <div className="bm-header-actions">
          <button className="btn btn-primary" onClick={handleAdd}>
            + Add Bookmark
          </button>
        </div>
      </div>

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelect={setActiveTabId}
        onCreate={handleCreateTab}
        onRename={handleRenameTab}
        onDelete={handleDeleteTab}
      />

      {showForm && (
        <BookmarkForm
          bookmark={editingBookmark}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {tabs.filter((t) => visitedTabs.current.has(t.id)).map((t) => (
        <div key={t.id} style={{ display: t.id === activeTabId ? undefined : "none" }}>
          <BookmarkGrid
            bookmarks={bookmarksMap[t.id] || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      ))}
      </>}
    </div>
  );
}
