const STORAGE_KEY = "dl-youtube-data";

function defaultStore() {
  return {
    tabs: [{ id: 1, name: "General", position: 0 }],
    channels: [],
    videos: [],
    nextTabId: 2,
  };
}

export function getStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    const data = JSON.parse(raw);
    if (!data.tabs || data.tabs.length === 0) return defaultStore();
    if (!data.nextTabId) data.nextTabId = Math.max(...data.tabs.map((t) => t.id)) + 1;
    return data;
  } catch {
    return defaultStore();
  }
}

export function saveStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getTabs() {
  return getStore().tabs.sort((a, b) => a.position - b.position);
}

export function createTab(name) {
  const store = getStore();
  const tab = { id: store.nextTabId++, name, position: store.tabs.length };
  store.tabs.push(tab);
  saveStore(store);
  return tab;
}

export function updateTab(id, name) {
  const store = getStore();
  const tab = store.tabs.find((t) => t.id === id);
  if (tab) tab.name = name;
  saveStore(store);
}

export function deleteTab(id) {
  const store = getStore();
  if (store.tabs.length <= 1) return;
  store.tabs = store.tabs.filter((t) => t.id !== id);
  const channelIds = store.channels.filter((c) => c.tabId === id).map((c) => c.channelId);
  store.channels = store.channels.filter((c) => c.tabId !== id);
  store.videos = store.videos.filter((v) => !channelIds.includes(v.channelId));
  saveStore(store);
}

export function getChannels(tabId) {
  const store = getStore();
  if (tabId) return store.channels.filter((c) => c.tabId === tabId);
  return store.channels;
}

export function addChannel(channel) {
  const store = getStore();
  if (store.channels.find((c) => c.channelId === channel.channelId)) return false;
  store.channels.push(channel);
  saveStore(store);
  return true;
}

export function deleteChannel(channelId) {
  const store = getStore();
  store.channels = store.channels.filter((c) => c.channelId !== channelId);
  store.videos = store.videos.filter((v) => v.channelId !== channelId);
  saveStore(store);
}

export function getVideos(tabId, range = "week") {
  const store = getStore();
  const days = range === "month" ? 30 : 7;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).getTime();
  const tabChannelIds = tabId
    ? store.channels.filter((c) => c.tabId === tabId).map((c) => c.channelId)
    : store.channels.map((c) => c.channelId);

  const channelMap = Object.fromEntries(store.channels.map((c) => [c.channelId, c.channelName]));

  return store.videos
    .filter((v) => tabChannelIds.includes(v.channelId) && new Date(v.publishedAt).getTime() >= cutoff)
    .map((v) => ({ ...v, channelName: v.channelName || channelMap[v.channelId] || "" }))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

export function addVideos(videos) {
  const store = getStore();
  const existing = new Set(store.videos.map((v) => v.videoId));
  let added = 0;
  for (const v of videos) {
    if (!existing.has(v.videoId)) {
      store.videos.push(v);
      existing.add(v.videoId);
      added++;
    }
  }
  if (added > 0) saveStore(store);
  return added;
}

export function exportData() {
  const store = getStore();
  const { nextTabId: _, ...data } = store;
  return JSON.stringify(data, null, 2);
}

export function importData(json) {
  const data = JSON.parse(json);
  if (!data.tabs || !Array.isArray(data.tabs)) throw new Error("Invalid data: missing tabs");
  if (!data.channels) data.channels = [];
  if (!data.videos) data.videos = [];
  data.nextTabId = Math.max(...data.tabs.map((t) => t.id), 0) + 1;
  saveStore(data);
}
