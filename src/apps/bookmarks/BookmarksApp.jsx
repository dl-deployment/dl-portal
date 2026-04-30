import { useState, useEffect } from "react";
import * as store from "./store.js";
import TabBar from "./components/TabBar";
import BookmarkForm from "./components/BookmarkForm";
import BookmarkGrid from "./components/BookmarkGrid";
import DataManager from "./components/DataManager";
import "./bookmarks.css";

export default function BookmarksApp() {
  const [tabs, setTabs] = useState(() => store.getTabs());
  const [activeTabId, setActiveTabId] = useState(() => store.getTabs()[0]?.id);
  const [bookmarks, setBookmarks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);

  useEffect(() => {
    setBookmarks(store.getBookmarks(activeTabId));
  }, [activeTabId]);

  function reload() {
    const freshTabs = store.getTabs();
    setTabs(freshTabs);
    setBookmarks(store.getBookmarks(activeTabId));
  }

  function handleCreateTab(name) {
    const tab = store.createTab(name);
    setActiveTabId(tab.id);
    reload();
  }

  function handleRenameTab(id, name) {
    store.updateTab(id, name);
    reload();
  }

  function handleDeleteTab(id) {
    store.deleteTab(id);
    const freshTabs = store.getTabs();
    setTabs(freshTabs);
    if (activeTabId === id) {
      setActiveTabId(freshTabs[0]?.id);
    }
    setBookmarks(store.getBookmarks(activeTabId === id ? freshTabs[0]?.id : activeTabId));
  }

  function handleSave(payload) {
    if (payload.id) {
      store.updateBookmark(payload.id, payload);
    } else {
      store.createBookmark({ ...payload, tabId: activeTabId });
    }
    setShowForm(false);
    setEditingBookmark(null);
    reload();
  }

  function handleEdit(bookmark) {
    setEditingBookmark(bookmark);
    setShowForm(true);
  }

  function handleDelete(id) {
    store.deleteBookmark(id);
    reload();
  }

  function handleAdd() {
    setEditingBookmark(null);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingBookmark(null);
  }

  function handleDataChange() {
    const freshTabs = store.getTabs();
    setTabs(freshTabs);
    setActiveTabId(freshTabs[0]?.id);
    setBookmarks(store.getBookmarks(freshTabs[0]?.id));
  }

  return (
    <div className="bookmarks-app">
      <div className="bm-header">
        <h2>Bookmarks</h2>
        <div className="bm-header-actions">
          <DataManager onDataChange={handleDataChange} />
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
    </div>
  );
}
