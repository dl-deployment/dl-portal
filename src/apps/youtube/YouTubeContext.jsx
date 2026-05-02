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
  const [tabs, setTabs] = useState([]);
  const [channels, setChannels] = useState([]);
  const [videos, setVideos] = useState([]);

  const [activeTabId, setActiveTabId] = useState(null);
  const [range, setRange] = useState("week");
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    store.getTabs().then((t) => {
      setTabs(t);
      if (t.length > 0) setActiveTabId(t[0].id);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (activeTabId) {
      store.getChannels(activeTabId).then(setChannels);
      store.getVideos(activeTabId, range).then(setVideos);
    }
  }, [activeTabId, range]);

  const handleCreateTab = useCallback(async (name) => {
    const tab = await store.createTab(name);
    setTabs(await store.getTabs());
    setActiveTabId(tab.id);
  }, []);

  const handleRenameTab = useCallback(async (id, name) => {
    await store.updateTab(id, name);
    setTabs(await store.getTabs());
  }, []);

  const handleDeleteTab = useCallback(async (id) => {
    await store.deleteTab(id);
    const remaining = await store.getTabs();
    setTabs(remaining);
    setActiveTabId((prev) => (prev === id && remaining.length > 0 ? remaining[0].id : prev));
  }, []);

  const handleAddChannel = useCallback(async (input) => {
    const info = await api.resolveChannel(input);
    const added = await store.addChannel({ ...info, tabId: activeTabId });
    if (!added) {
      throw new Error("Channel already added");
    }
    setChannels(await store.getChannels(activeTabId));
  }, [activeTabId]);

  const handleDeleteChannel = useCallback(async (channelId) => {
    await store.deleteChannel(channelId);
    setChannels(await store.getChannels(activeTabId));
    setVideos(await store.getVideos(activeTabId, range));
  }, [activeTabId, range]);

  const handleUpdateChannel = useCallback(async (channelId, updates) => {
    await store.updateChannel(channelId, updates);
    setChannels(await store.getChannels(activeTabId));
  }, [activeTabId]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const chs = await store.getChannels(activeTabId);
      const days = range === "month" ? 30 : 7;
      const publishedAfter = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const failed = [];
      for (const ch of chs) {
        try {
          const { videos: vids } = await api.fetchVideos(ch.channelId, publishedAfter);
          await store.addVideos(vids);
        } catch (err) {
          console.error(`Error fetching ${ch.channelName}:`, err.message);
          failed.push(ch.channelName);
        }
      }
      setVideos(await store.getVideos(activeTabId, range));

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
    tabs, channels, videos,
    activeTabId, range, syncing, error,
    setActiveTabId, setRange, setError,
    handleCreateTab, handleRenameTab, handleDeleteTab,
    handleAddChannel, handleDeleteChannel, handleUpdateChannel,
    handleSync,
  };

  return (
    <YouTubeContext.Provider value={value}>
      {ready ? children : <div className="app-loading">Loading...</div>}
    </YouTubeContext.Provider>
  );
}
