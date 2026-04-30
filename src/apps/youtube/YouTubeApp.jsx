import { YouTubeProvider, useYouTube } from "./YouTubeContext.jsx";
import TabBar from "./components/TabBar.jsx";
import AddChannel from "./components/AddChannel.jsx";
import ChannelList from "./components/ChannelList.jsx";
import VideoGrid from "./components/VideoGrid.jsx";
import DataManager from "./components/DataManager.jsx";
import "./youtube.css";

function YouTubeInner() {
  const {
    tabs, channels, videos,
    activeTabId, range, syncing, error,
    setActiveTabId, setRange, setError,
    handleCreateTab, handleRenameTab, handleDeleteTab,
    handleAddChannel, handleDeleteChannel,
    handleSync, handleDataChange,
  } = useYouTube();

  return (
    <div className="youtube-app">
      <div className="youtube-header">
        <h2>DL YouTube</h2>
        <div className="header-actions">
          <DataManager onDataChange={handleDataChange} />
          <div className="range-toggle">
            <button
              className={`range-btn ${range === "week" ? "active" : ""}`}
              onClick={() => setRange("week")}
            >
              Week
            </button>
            <button
              className={`range-btn ${range === "month" ? "active" : ""}`}
              onClick={() => setRange("month")}
            >
              Month
            </button>
          </div>
          <button
            className="btn-green"
            onClick={handleSync}
            disabled={syncing || channels.length === 0}
          >
            {syncing ? "Syncing..." : "Fetch Videos"}
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

      <AddChannel onAdded={handleAddChannel} />
      <ChannelList channels={channels} onDelete={handleDeleteChannel} />
      <VideoGrid videos={videos} syncing={syncing} />
    </div>
  );
}

export default function YouTubeApp() {
  return (
    <YouTubeProvider>
      <YouTubeInner />
    </YouTubeProvider>
  );
}
