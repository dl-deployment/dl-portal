const API_SECRET = import.meta.env.VITE_API_SECRET ?? "";

async function request(method, { body, query } = {}) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_SECRET,
    },
  };
  if (body) {
    opts.body = JSON.stringify(body);
  }

  let url = "/api/tasks";
  if (query) {
    url += "?" + new URLSearchParams(query).toString();
  }

  const res = await fetch(url, opts);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  getTasks: () => request("GET"),
  createTask: (task) => request("POST", { body: task }),
  updateTask: (task) => request("PUT", { body: task }),
  deleteTask: (id) => request("DELETE", { query: { id } }),
};