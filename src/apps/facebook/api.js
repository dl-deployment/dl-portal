async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  fetchPosts: (feedUrl, publishedAfter) =>
    request("/fetch-facebook-posts", {
      method: "POST",
      body: JSON.stringify({ feedUrl, publishedAfter }),
    }),
};
