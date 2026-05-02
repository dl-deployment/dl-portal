import { useState } from "react";
import { FacebookProvider, useFacebook } from "./FacebookContext.jsx";
import TabBar from "./components/TabBar.jsx";
import PageForm from "./components/PageForm.jsx";
import PageGrid from "./components/PageGrid.jsx";
import PostList from "./components/PostList.jsx";
import "./facebook.css";

const RANGES = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

function FacebookInner() {
  const {
    tabs, pages, posts,
    activeTabId, range, syncing, error,
    setActiveTabId, setRange, setError,
    handleCreateTab, handleRenameTab, handleDeleteTab,
    handleAddPage, handleDeletePage, handleUpdatePage,
    handleSync,
  } = useFacebook();

  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState(null);

  function handleAdd() {
    setEditingPage(null);
    setShowForm(true);
  }

  function handleEdit(page) {
    setEditingPage(page);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingPage(null);
  }

  async function handleSave(payload) {
    if (payload.oldFeedUrl) {
      // Edit mode
      const updates = { pageName: payload.pageName };
      if (payload.feedUrl !== payload.oldFeedUrl) {
        updates.feedUrl = payload.feedUrl;
      }
      await handleUpdatePage(payload.oldFeedUrl, updates);
    } else {
      // Add mode
      await handleAddPage(payload.feedUrl, payload.pageName);
    }
    setShowForm(false);
    setEditingPage(null);
  }

  return (
    <div className="facebook-app">
      <div className="facebook-header">
        <h2>DL Facebook</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleAdd}>
            + Add Feed
          </button>
          <div className="range-toggle">
            {RANGES.map((r) => (
              <button
                key={r.key}
                className={`range-btn ${range === r.key ? "active" : ""}`}
                onClick={() => setRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            className="btn-green"
            onClick={handleSync}
            disabled={syncing || pages.length === 0}
          >
            {syncing ? "Fetching..." : "Fetch Posts"}
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

      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button className="btn-ghost" onClick={() => setError(null)}>dismiss</button>
        </div>
      )}

      {showForm && (
        <PageForm
          page={editingPage}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <PageGrid
        pages={pages}
        onEdit={handleEdit}
        onDelete={handleDeletePage}
      />
      <PostList posts={posts} syncing={syncing} />
    </div>
  );
}

export default function FacebookApp() {
  return (
    <FacebookProvider>
      <FacebookInner />
    </FacebookProvider>
  );
}
