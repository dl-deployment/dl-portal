import { dbApi } from "../../lib/dbApi.js";

const APP = "bookmarks";

async function readStore() {
  const { data } = await dbApi.read(APP);
  return data || { tabs: [], bookmarks: [] };
}

async function writeStore(data) {
  await dbApi.write(APP, data);
}

export async function getTabs() {
  const store = await readStore();
  return store.tabs.sort((a, b) => a.position - b.position);
}

export async function createTab(name) {
  const store = await readStore();
  const maxId = store.tabs.reduce((m, t) => Math.max(m, t.id), 0);
  const tab = { id: maxId + 1, name, position: store.tabs.length };
  store.tabs.push(tab);
  await writeStore(store);
  return tab;
}

export async function updateTab(id, name) {
  const store = await readStore();
  const tab = store.tabs.find((t) => t.id === id);
  if (tab) tab.name = name;
  await writeStore(store);
}

export async function deleteTab(id) {
  const store = await readStore();
  if (store.tabs.length <= 1) return;
  store.tabs = store.tabs.filter((t) => t.id !== id);
  store.bookmarks = store.bookmarks.filter((b) => b.tabId !== id);
  await writeStore(store);
}

export async function getBookmarks(tabId) {
  const store = await readStore();
  if (tabId) return store.bookmarks.filter((b) => b.tabId === tabId);
  return store.bookmarks;
}

export async function createBookmark({ tabId, title, url, description, icon }) {
  const store = await readStore();
  const maxId = store.bookmarks.reduce((m, b) => Math.max(m, b.id), 0);
  const bookmark = {
    id: maxId + 1,
    tabId,
    title,
    url,
    description: description || "",
    icon: icon || "",
    createdAt: new Date().toISOString(),
  };
  store.bookmarks.push(bookmark);
  await writeStore(store);
  return bookmark;
}

export async function updateBookmark(id, fields) {
  const store = await readStore();
  const bookmark = store.bookmarks.find((b) => b.id === id);
  if (bookmark) {
    if (fields.title !== undefined) bookmark.title = fields.title;
    if (fields.url !== undefined) bookmark.url = fields.url;
    if (fields.description !== undefined) bookmark.description = fields.description;
    if (fields.icon !== undefined) bookmark.icon = fields.icon;
  }
  await writeStore(store);
}

export async function deleteBookmark(id) {
  const store = await readStore();
  store.bookmarks = store.bookmarks.filter((b) => b.id !== id);
  await writeStore(store);
}
