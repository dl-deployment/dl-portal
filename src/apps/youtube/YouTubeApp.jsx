import { useState, useEffect, useCallback } from "react";
import { api } from "./api.js";
import * as store from "./store.js";
import TabBar from "./components/TabBar.jsx";
import AddChannel from "./components/AddChannel.jsx";
import ChannelList from "./components/ChannelList.jsx";
import VideoGrid from "./components/VideoGrid.jsx";
import DataManager from "./components/DataManager.jsx";
import "./youtube.css";

export default function YouTubeApp() {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [range, setRange] = useState("week");
  const [channels, setChannels] = useState([]);
  const [videos, setVideos] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  const refreshFromStore = useCallback(() => {
    const t = store.getTabs();
    setTabs(t);
    const tabId = t.find((x) => x.id === activeTabId) ? activeTabId : t[0]?.id;
    if (tabId !== activeTabId) setActiveTabId(tabId);
    if (tabId) {
      setChannels(store.getChannels(tabId));
      setVideos(store.getVideos(tabId, range));
    }
  }, [activeTabId, range]);

  useEffect(() => {
    const t = store.getTabs();
    setTabs(t);
    if (t.length > 0) setActiveTabId(t[0].id);
  }, []);

  useEffect(() => {
    if (activeTabId) {
      setChannels(store.getChannels(activeTabId));
      setVideos(store.getVideos(activeTabId, range));
    }
  }, [activeTabId, range]);

  function handleCreateTab(name) {
    const tab = store.createTab(name);
    setTabs(store.getTabs());
    setActiveTabId(tab.id);
  }

  function handleRenameTab(id, name) {
    store.updateTab(id, name);
    setTabs(store.getTabs());
  }

  function handleDeleteTab(id) {
    store.deleteTab(id);
    const remaining = store.getTabs();
    setTabs(remaining);
    if (activeTabId === id && remaining.length > 0) {
      setActiveTabId(remaining[0].id);
    }
  }

  async function handleAddChannel(input) {
    setError(null);
    try {
      const info = await api.resolveChannel(input);
      const added = store.addChannel({ ...info, tabId: activeTabId });
      if (!added) {
        setError("Channel already added");
        return;
      }
      setChannels(store.getChannels(activeTabId));
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDeleteChannel(channelId) {
    store.deleteChannel(channelId);
    setChannels(store.getChannels(activeTabId));
    setVideos(store.getVideos(activeTabId, range));
  }

  async function handleSync() {
    setSyncing(true);
    setError(null);
    try {
      const chs = store.getChannels(activeTabId);
      const days = range === "month" ? 30 : 7;
      const publishedAfter = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      for (const ch of chs) {
        try {
          const { videos: vids } = await api.fetchVideos(ch.channelId, publishedAfter);
          store.addVideos(vids);
        } catch (err) {
          console.error(`Error fetching ${ch.channelName}:`, err.message);
        }
      }
      setVideos(store.getVideos(activeTabId, range));
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }

  function handleDataChange() {
    refreshFromStore();
  }

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
        <div className="error-banner">
          {error}
          <button className="btn-ghost" onClick={() => setError(null)}>dismiss</button>
        </div>
      )}

      <AddChannel onAdded={handleAddChannel} />
      <ChannelList channels={channels} onDelete={handleDeleteChannel} />
      <VideoGrid videos={videos} />
    </div>
  );
}
