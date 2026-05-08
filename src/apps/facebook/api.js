const API_SECRET = import.meta.env.VITE_API_SECRET;

let _cache = null;
let _pending = null;

async function request(path, body) {
  const res = await fetch(`/api/facebook${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_SECRET || "",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export function fetchPages() {
  if (_cache) return Promise.resolve(_cache);
  if (_pending) return _pending;
  _pending = request("/read", {}).then((r) => {
    _cache = r.data;
    _pending = null;
    return _cache;
  });
  return _pending;
}

export function updateCache(data) {
  _cache = data;
}

export function addPage(sheetName, page) {
  return request("/write", { action: "add", sheetName, page });
}

export function deletePage(sheetId, rowIndex) {
  return request("/write", { action: "delete", sheetId, rowIndex });
}

export function createTab(name) {
  return request("/write", { action: "create-tab", name }).then((r) => r.data);
}

export function renameTab(sheetId, name) {
  return request("/write", { action: "rename-tab", sheetId, name });
}

export function deleteTab(sheetId) {
  return request("/write", { action: "delete-tab", sheetId });
}
