import { useState, useEffect, useCallback } from "react";
import * as store from "./store.js";
import TabBar from "./components/TabBar";
import BookmarkForm from "./components/BookmarkForm";
import BookmarkGrid from "./components/BookmarkGrid";
import "./bookmarks.css";

export default function BookmarksApp() {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    store.getTabs().then((t) => {
      setTabs(t);
      if (t.length > 0) {
        setActiveTabId(t[0].id);
        store.getBookmarks(t[0].id).then(setBookmarks);
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (activeTabId) {
      store.getBookmarks(activeTabId).then(setBookmarks);
    }
  }, [activeTabId]);

  const reload = useCallback(async () => {
    const freshTabs = await store.getTabs();
    setTabs(freshTabs);
    setBookmarks(await store.getBookmarks(activeTabId));
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
    if (activeTabId === id) {
      setActiveTabId(freshTabs[0]?.id);
      setBookmarks(await store.getBookmarks(freshTabs[0]?.id));
    } else {
      setBookmarks(await store.getBookmarks(activeTabId));
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

      <BookmarkGrid
        bookmarks={bookmarks}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      </>}
    </div>
  );
}
