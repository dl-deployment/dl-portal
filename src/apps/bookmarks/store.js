import defaultData from "../../data/bookmarks-default.json";

const STORAGE_KEY = "dl-bookmarks-data";

function defaultStore() {
  return {
    ...structuredClone(defaultData),
    nextTabId: Math.max(...defaultData.tabs.map((t) => t.id), 0) + 1,
    nextBookmarkId: 1,
  };
}

export function getStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    const data = JSON.parse(raw);
    if (!data.tabs || data.tabs.length === 0) return defaultStore();
    if (!data.bookmarks) data.bookmarks = [];
    if (!data.nextTabId) data.nextTabId = Math.max(...data.tabs.map((t) => t.id), 0) + 1;
    if (!data.nextBookmarkId) data.nextBookmarkId = Math.max(...data.bookmarks.map((b) => b.id), 0) + 1;
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
  store.bookmarks = store.bookmarks.filter((b) => b.tabId !== id);
  saveStore(store);
}

export function getBookmarks(tabId) {
  const store = getStore();
  if (tabId) return store.bookmarks.filter((b) => b.tabId === tabId);
  return store.bookmarks;
}

export function createBookmark({ tabId, title, url, description, icon }) {
  const store = getStore();
  const bookmark = {
    id: store.nextBookmarkId++,
    tabId,
    title,
    url,
    description: description || "",
    icon: icon || "",
    createdAt: new Date().toISOString(),
  };
  store.bookmarks.push(bookmark);
  saveStore(store);
  return bookmark;
}

export function updateBookmark(id, fields) {
  const store = getStore();
  const bookmark = store.bookmarks.find((b) => b.id === id);
  if (bookmark) {
    if (fields.title !== undefined) bookmark.title = fields.title;
    if (fields.url !== undefined) bookmark.url = fields.url;
    if (fields.description !== undefined) bookmark.description = fields.description;
    if (fields.icon !== undefined) bookmark.icon = fields.icon;
  }
  saveStore(store);
}

export function deleteBookmark(id) {
  const store = getStore();
  store.bookmarks = store.bookmarks.filter((b) => b.id !== id);
  saveStore(store);
}

export function exportData() {
  const store = getStore();
  const { nextTabId: _, nextBookmarkId: __, ...data } = store;
  return JSON.stringify(data, null, 2);
}

export function importData(json) {
  const data = JSON.parse(json);
  if (!data.tabs || !Array.isArray(data.tabs)) throw new Error("Invalid data: missing tabs");
  if (!data.bookmarks) data.bookmarks = [];
  data.nextTabId = Math.max(...data.tabs.map((t) => t.id), 0) + 1;
  data.nextBookmarkId = Math.max(...data.bookmarks.map((b) => b.id), 0) + 1;
  saveStore(data);
}
