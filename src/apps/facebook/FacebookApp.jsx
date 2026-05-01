import { FacebookProvider, useFacebook } from "./FacebookContext.jsx";
import TabBar from "./components/TabBar.jsx";
import AddPage from "./components/AddPage.jsx";
import PageList from "./components/PageList.jsx";
import PostList from "./components/PostList.jsx";
import DataManager from "./components/DataManager.jsx";
import "./facebook.css";

const RANGES = [
  { key: "hour", label: "Hour" },
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
    handleSync, handleDataChange,
  } = useFacebook();

  return (
    <div className="facebook-app">
      <div className="facebook-header">
        <h2>DL Facebook</h2>
        <div className="header-actions">
          <DataManager onDataChange={handleDataChange} />
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

      <AddPage onAdded={handleAddPage} />
      <PageList pages={pages} onDelete={handleDeletePage} onUpdate={handleUpdatePage} />
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
