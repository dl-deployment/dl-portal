import { dbApi } from "../../lib/dbApi.js";

const APP = "youtube";
const VIDEOS_KEY = "dl-youtube-videos";

function getLocalVideos() {
  try {
    return JSON.parse(localStorage.getItem(VIDEOS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLocalVideos(videos) {
  localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
}

async function readStore() {
  const { data } = await dbApi.read(APP);
  return data || { tabs: [], channels: [] };
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
  const channelIds = store.channels.filter((c) => c.tabId === id).map((c) => c.channelId);
  store.channels = store.channels.filter((c) => c.tabId !== id);
  const videos = getLocalVideos().filter((v) => !channelIds.includes(v.channelId));
  saveLocalVideos(videos);
  await writeStore(store);
}

export async function getChannels(tabId) {
  const store = await readStore();
  if (tabId) return store.channels.filter((c) => c.tabId === tabId);
  return store.channels;
}

export async function addChannel(channel) {
  const store = await readStore();
  if (store.channels.find((c) => c.channelId === channel.channelId)) return false;
  store.channels.push(channel);
  await writeStore(store);
  return true;
}

export async function updateChannel(channelId, updates) {
  const store = await readStore();
  const ch = store.channels.find((c) => c.channelId === channelId);
  if (ch) {
    if (updates.channelName !== undefined) ch.channelName = updates.channelName;
    if (updates.channelId !== undefined && updates.channelId !== channelId) {
      const videos = getLocalVideos();
      videos.forEach((v) => {
        if (v.channelId === channelId) v.channelId = updates.channelId;
      });
      saveLocalVideos(videos);
      ch.channelId = updates.channelId;
    }
    await writeStore(store);
  }
}

export async function deleteChannel(channelId) {
  const store = await readStore();
  store.channels = store.channels.filter((c) => c.channelId !== channelId);
  const videos = getLocalVideos().filter((v) => v.channelId !== channelId);
  saveLocalVideos(videos);
  await writeStore(store);
}

export async function getVideos(tabId, range = "week") {
  const store = await readStore();
  const videos = getLocalVideos();
  const days = range === "month" ? 30 : 7;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).getTime();
  const tabChannelIds = tabId
    ? store.channels.filter((c) => c.tabId === tabId).map((c) => c.channelId)
    : store.channels.map((c) => c.channelId);

  const channelMap = Object.fromEntries(store.channels.map((c) => [c.channelId, c.channelName]));

  return videos
    .filter((v) => tabChannelIds.includes(v.channelId) && new Date(v.publishedAt).getTime() >= cutoff)
    .map((v) => ({ ...v, channelName: v.channelName || channelMap[v.channelId] || "" }))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

export async function addVideos(videos) {
  const existing = getLocalVideos();
  const existingIds = new Set(existing.map((v) => v.videoId));
  let added = 0;
  for (const v of videos) {
    if (!existingIds.has(v.videoId)) {
      existing.push(v);
      existingIds.add(v.videoId);
      added++;
    }
  }
  if (added > 0) saveLocalVideos(existing);
  return added;
}
