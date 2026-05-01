const API_SECRET = import.meta.env.VITE_API_SECRET;

async function request(path, body) {
  const res = await fetch(`/api${path}`, {
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

export const dbApi = {
  read: (app) => request("/db/read", { app }),
  write: (app, data) => request("/db/write", { app, data }),
  migrate: (app, data) => request("/db/migrate", { app, data }),
};
