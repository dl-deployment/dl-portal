import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "./api.js";
import * as store from "./store.js";

const YouTubeContext = createContext(null);

export function useYouTube() {
  const ctx = useContext(YouTubeContext);
  if (!ctx) throw new Error("useYouTube must be used within <YouTubeProvider>");
  return ctx;
}

export function YouTubeProvider({ children }) {
  // ── Data state ──
  const [tabs, setTabs] = useState([]);
  const [channels, setChannels] = useState([]);
  const [videos, setVideos] = useState([]);

  // ── UI state ──
  const [activeTabId, setActiveTabId] = useState(null);
  const [range, setRange] = useState("week");
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // ── Refresh from localStorage ──
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

  // ── Init ──
  useEffect(() => {
    const t = store.getTabs();
    setTabs(t);
    if (t.length > 0) setActiveTabId(t[0].id);
  }, []);

  // ── Sync on tab/range change ──
  useEffect(() => {
    if (activeTabId) {
      setChannels(store.getChannels(activeTabId));
      setVideos(store.getVideos(activeTabId, range));
    }
  }, [activeTabId, range]);

  // ── Tab handlers ──
  const handleCreateTab = useCallback((name) => {
    const tab = store.createTab(name);
    setTabs(store.getTabs());
    setActiveTabId(tab.id);
  }, []);

  const handleRenameTab = useCallback((id, name) => {
    store.updateTab(id, name);
    setTabs(store.getTabs());
  }, []);

  const handleDeleteTab = useCallback((id) => {
    store.deleteTab(id);
    const remaining = store.getTabs();
    setTabs(remaining);
    setActiveTabId((prev) => (prev === id && remaining.length > 0 ? remaining[0].id : prev));
  }, []);

  // ── Channel handlers ──
  const handleAddChannel = useCallback(async (input) => {
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
  }, [activeTabId]);

  const handleDeleteChannel = useCallback((channelId) => {
    store.deleteChannel(channelId);
    setChannels(store.getChannels(activeTabId));
    setVideos(store.getVideos(activeTabId, range));
  }, [activeTabId, range]);

  const handleUpdateChannel = useCallback((channelId, updates) => {
    store.updateChannel(channelId, updates);
    setChannels(store.getChannels(activeTabId));
    if (updates.channelId) setVideos(store.getVideos(activeTabId, range));
  }, [activeTabId, range]);

  // ── Sync handler ──
  const handleSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const chs = store.getChannels(activeTabId);
      const days = range === "month" ? 30 : 7;
      const publishedAfter = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const failed = [];
      for (const ch of chs) {
        try {
          const { videos: vids } = await api.fetchVideos(ch.channelId, publishedAfter);
          store.addVideos(vids);
        } catch (err) {
          console.error(`Error fetching ${ch.channelName}:`, err.message);
          failed.push(ch.channelName);
        }
      }
      setVideos(store.getVideos(activeTabId, range));

      if (failed.length > 0 && failed.length === chs.length) {
        setError("YouTube RSS is temporarily unavailable. Please try again later.");
      } else if (failed.length > 0) {
        setError(`Failed to fetch: ${failed.join(", ")}. Some videos may be missing.`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }, [activeTabId, range]);

  const value = {
    // data
    tabs,
    channels,
    videos,
    // UI state
    activeTabId,
    range,
    syncing,
    error,
    // setters
    setActiveTabId,
    setRange,
    setError,
    // handlers
    handleCreateTab,
    handleRenameTab,
    handleDeleteTab,
    handleAddChannel,
    handleDeleteChannel,
    handleUpdateChannel,
    handleSync,
    handleDataChange: refreshFromStore,
  };

  return (
    <YouTubeContext.Provider value={value}>
      {children}
    </YouTubeContext.Provider>
  );
}
