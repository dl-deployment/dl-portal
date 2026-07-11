import { dbApi } from "../../lib/dbApi.js";

const APP = "poe2";

let _cache = null;
let _pending = null;

async function readStore() {
  if (_cache) return _cache;
  if (_pending) return _pending;
  _pending = dbApi.read(APP).then(({ data }) => {
    _cache = data || { quickLinks: [] };
    _pending = null;
    return _cache;
  });
  return _pending;
}

async function writeStore(data) {
  _cache = data;
  await dbApi.write(APP, data);
}

export async function getQuickLinks() {
  const store = await readStore();
  return store.quickLinks;
}

export async function saveQuickLink(link) {
  const store = await readStore();
  const existing = store.quickLinks.find((l) => l.id === link.id);
  if (existing) {
    Object.assign(existing, link);
  } else {
    const maxId = store.quickLinks.reduce((m, l) => Math.max(m, l.id), 0);
    const newLink = { ...link, id: maxId + 1 };
    store.quickLinks.push(newLink);
    await writeStore(store);
    return newLink;
  }
  await writeStore(store);
  return link;
}

export async function deleteQuickLink(id) {
  const store = await readStore();
  store.quickLinks = store.quickLinks.filter((l) => l.id !== id);
  await writeStore(store);
}
