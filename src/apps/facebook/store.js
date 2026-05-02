import { dbApi } from "../../lib/dbApi.js";

const APP = "facebook";
const POSTS_KEY = "dl-facebook-posts";

function getLocalPosts() {
  try {
    return JSON.parse(localStorage.getItem(POSTS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLocalPosts(posts) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

async function readStore() {
  const { data } = await dbApi.read(APP);
  return data || { tabs: [], pages: [] };
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
  const { tab } = await dbApi.createTab(APP, name, store.tabs.length);
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
  const feedUrls = store.pages.filter((p) => p.tabId === id).map((p) => p.feedUrl);
  store.pages = store.pages.filter((p) => p.tabId !== id);
  const posts = getLocalPosts().filter((p) => !feedUrls.includes(p.feedUrl));
  saveLocalPosts(posts);
  await writeStore(store);
}

export async function getPages(tabId) {
  const store = await readStore();
  if (tabId) return store.pages.filter((p) => p.tabId === tabId);
  return store.pages;
}

export async function addPage(page) {
  const store = await readStore();
  if (store.pages.find((p) => p.feedUrl === page.feedUrl)) return false;
  store.pages.push(page);
  await writeStore(store);
  return true;
}

export async function updatePage(feedUrl, updates) {
  const store = await readStore();
  const pg = store.pages.find((p) => p.feedUrl === feedUrl);
  if (pg) {
    if (updates.pageName !== undefined) pg.pageName = updates.pageName;
    if (updates.feedUrl !== undefined && updates.feedUrl !== feedUrl) {
      const posts = getLocalPosts();
      posts.forEach((p) => {
        if (p.feedUrl === feedUrl) p.feedUrl = updates.feedUrl;
      });
      saveLocalPosts(posts);
      pg.feedUrl = updates.feedUrl;
    }
    await writeStore(store);
  }
}

export async function deletePage(feedUrl) {
  const store = await readStore();
  store.pages = store.pages.filter((p) => p.feedUrl !== feedUrl);
  const posts = getLocalPosts().filter((p) => p.feedUrl !== feedUrl);
  saveLocalPosts(posts);
  await writeStore(store);
}

export async function getPosts(tabId, range = "week") {
  const store = await readStore();
  const posts = getLocalPosts();
  const ms = { hour: 3600000, day: 86400000, week: 604800000, month: 2592000000 };
  const cutoff = new Date(Date.now() - (ms[range] || ms.week)).getTime();
  const tabFeedUrls = tabId
    ? store.pages.filter((p) => p.tabId === tabId).map((p) => p.feedUrl)
    : store.pages.map((p) => p.feedUrl);

  const pageMap = Object.fromEntries(store.pages.map((p) => [p.feedUrl, p.pageName]));

  return posts
    .filter((p) => tabFeedUrls.includes(p.feedUrl) && new Date(p.publishedAt).getTime() >= cutoff)
    .map((p) => ({ ...p, pageName: p.pageName || pageMap[p.feedUrl] || "" }))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

export async function addPosts(posts) {
  const existing = getLocalPosts();
  const existingIds = new Set(existing.map((p) => p.postId));
  let added = 0;
  for (const p of posts) {
    if (!existingIds.has(p.postId)) {
      existing.push(p);
      existingIds.add(p.postId);
      added++;
    }
  }
  if (added > 0) saveLocalPosts(existing);
  return added;
}
