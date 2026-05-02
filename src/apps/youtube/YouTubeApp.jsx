import { useState } from "react";
import { YouTubeProvider, useYouTube } from "./YouTubeContext.jsx";
import TabBar from "./components/TabBar.jsx";
import ChannelForm from "./components/ChannelForm.jsx";
import ChannelGrid from "./components/ChannelGrid.jsx";
import VideoGrid from "./components/VideoGrid.jsx";
import "./youtube.css";

function YouTubeInner() {
  const {
    tabs, channels, videos,
    activeTabId, range, syncing, error,
    setActiveTabId, setRange, setError,
    handleCreateTab, handleRenameTab, handleDeleteTab,
    handleAddChannel, handleDeleteChannel, handleUpdateChannel,
    handleSync,
  } = useYouTube();

  const [showForm, setShowForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  function handleAdd() {
    setEditingChannel(null);
    setFormError(null);
    setShowForm(true);
  }

  function handleEdit(channel) {
    setEditingChannel(channel);
    setFormError(null);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingChannel(null);
    setFormError(null);
  }

  async function handleSave(payload) {
    setFormError(null);
    if (payload.channelId) {
      // Edit mode — update name
      await handleUpdateChannel(payload.channelId, { channelName: payload.channelName });
      setShowForm(false);
      setEditingChannel(null);
    } else {
      // Add mode — resolve + add
      setFormLoading(true);
      try {
        await handleAddChannel(payload.input);
        setShowForm(false);
        setEditingChannel(null);
      } catch (err) {
        setFormError(err.message);
      } finally {
        setFormLoading(false);
      }
    }
  }

  return (
    <div className="youtube-app">
      <div className="youtube-header">
        <h2>DL YouTube</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleAdd}>
            + Add Channel
          </button>
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

      {showForm && (
        <ChannelForm
          channel={editingChannel}
          onSave={handleSave}
          onCancel={handleCancel}
          loading={formLoading}
          error={formError}
        />
      )}

      <ChannelGrid
        channels={channels}
        onEdit={handleEdit}
        onDelete={handleDeleteChannel}
      />
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
