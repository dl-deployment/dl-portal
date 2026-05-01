import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "./api.js";
import * as store from "./store.js";

const FacebookContext = createContext(null);

export function useFacebook() {
  const ctx = useContext(FacebookContext);
  if (!ctx) throw new Error("useFacebook must be used within <FacebookProvider>");
  return ctx;
}

export function FacebookProvider({ children }) {
  const [tabs, setTabs] = useState([]);
  const [pages, setPages] = useState([]);
  const [posts, setPosts] = useState([]);

  const [activeTabId, setActiveTabId] = useState(null);
  const [range, setRange] = useState("week");
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  const refreshFromStore = useCallback(async () => {
    const t = await store.getTabs();
    setTabs(t);
    const tabId = t.find((x) => x.id === activeTabId) ? activeTabId : t[0]?.id;
    if (tabId !== activeTabId) setActiveTabId(tabId);
    if (tabId) {
      setPages(await store.getPages(tabId));
      setPosts(await store.getPosts(tabId, range));
    }
  }, [activeTabId, range]);

  useEffect(() => {
    store.getTabs().then((t) => {
      setTabs(t);
      if (t.length > 0) setActiveTabId(t[0].id);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (activeTabId) {
      store.getPages(activeTabId).then(setPages);
      store.getPosts(activeTabId, range).then(setPosts);
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

  const handleAddPage = useCallback(async (feedUrl, pageName) => {
    setError(null);
    const name = pageName || extractFeedName(feedUrl);
    const added = await store.addPage({ feedUrl, pageName: name, tabId: activeTabId });
    if (!added) {
      setError("Feed already added");
      return;
    }
    setPages(await store.getPages(activeTabId));
  }, [activeTabId]);

  const handleDeletePage = useCallback(async (feedUrl) => {
    await store.deletePage(feedUrl);
    setPages(await store.getPages(activeTabId));
    setPosts(await store.getPosts(activeTabId, range));
  }, [activeTabId, range]);

  const handleUpdatePage = useCallback(async (feedUrl, updates) => {
    await store.updatePage(feedUrl, updates);
    setPages(await store.getPages(activeTabId));
    if (updates.feedUrl) setPosts(await store.getPosts(activeTabId, range));
  }, [activeTabId, range]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const pgs = await store.getPages(activeTabId);
      const ms = { hour: 3600000, day: 86400000, week: 604800000, month: 2592000000 };
      const publishedAfter = new Date(Date.now() - (ms[range] || ms.week)).toISOString();

      const failed = [];
      for (const pg of pgs) {
        try {
          const { posts: fetched } = await api.fetchPosts(pg.feedUrl, publishedAfter);
          await store.addPosts(fetched);
        } catch (err) {
          console.error(`Error fetching ${pg.pageName}:`, err.message);
          failed.push(pg.pageName);
        }
      }
      setPosts(await store.getPosts(activeTabId, range));

      if (failed.length > 0 && failed.length === pgs.length) {
        setError("Failed to fetch feeds. Please check your feed URLs and try again.");
      } else if (failed.length > 0) {
        setError(`Failed to fetch: ${failed.join(", ")}. Some posts may be missing.`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }, [activeTabId, range]);

  const value = {
    tabs, pages, posts,
    activeTabId, range, syncing, error,
    setActiveTabId, setRange, setError,
    handleCreateTab, handleRenameTab, handleDeleteTab,
    handleAddPage, handleDeletePage, handleUpdatePage,
    handleSync, handleDataChange: refreshFromStore,
  };

  return (
    <FacebookContext.Provider value={value}>
      {ready ? children : <div className="app-loading">Loading...</div>}
    </FacebookContext.Provider>
  );
}

function extractFeedName(feedUrl) {
  try {
    const url = new URL(feedUrl);
    const host = url.hostname.replace(/^www\./, "");
    const segments = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    if (segments.length > 0) {
      return segments[segments.length - 1].replace(/[-_]/g, " ");
    }
    return host;
  } catch {
    return feedUrl;
  }
}
