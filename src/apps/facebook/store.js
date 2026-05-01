import defaultData from "../../data/facebook-default.json";

const STORAGE_KEY = "dl-facebook-data";

function defaultStore() {
  return {
    ...structuredClone(defaultData),
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
  const feedUrls = store.pages.filter((p) => p.tabId === id).map((p) => p.feedUrl);
  store.pages = store.pages.filter((p) => p.tabId !== id);
  store.posts = store.posts.filter((p) => !feedUrls.includes(p.feedUrl));
  saveStore(store);
}

export function getPages(tabId) {
  const store = getStore();
  if (tabId) return store.pages.filter((p) => p.tabId === tabId);
  return store.pages;
}

export function addPage(page) {
  const store = getStore();
  if (store.pages.find((p) => p.feedUrl === page.feedUrl)) return false;
  store.pages.push(page);
  saveStore(store);
  return true;
}

export function deletePage(feedUrl) {
  const store = getStore();
  store.pages = store.pages.filter((p) => p.feedUrl !== feedUrl);
  store.posts = store.posts.filter((p) => p.feedUrl !== feedUrl);
  saveStore(store);
}

export function getPosts(tabId, range = "week") {
  const store = getStore();
  const ms = { hour: 3600000, day: 86400000, week: 604800000, month: 2592000000 };
  const cutoff = new Date(Date.now() - (ms[range] || ms.week)).getTime();
  const tabFeedUrls = tabId
    ? store.pages.filter((p) => p.tabId === tabId).map((p) => p.feedUrl)
    : store.pages.map((p) => p.feedUrl);

  const pageMap = Object.fromEntries(store.pages.map((p) => [p.feedUrl, p.pageName]));

  return store.posts
    .filter((p) => tabFeedUrls.includes(p.feedUrl) && new Date(p.publishedAt).getTime() >= cutoff)
    .map((p) => ({ ...p, pageName: p.pageName || pageMap[p.feedUrl] || "" }))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

export function addPosts(posts) {
  const store = getStore();
  const existing = new Set(store.posts.map((p) => p.postId));
  let added = 0;
  for (const p of posts) {
    if (!existing.has(p.postId)) {
      store.posts.push(p);
      existing.add(p.postId);
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
  if (!data.pages) data.pages = [];
  if (!data.posts) data.posts = [];
  data.nextTabId = Math.max(...data.tabs.map((t) => t.id), 0) + 1;
  saveStore(data);
}
