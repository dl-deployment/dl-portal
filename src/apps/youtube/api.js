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
  resolveChannel: (channel) =>
    request("/resolve-channel", {
      method: "POST",
      body: JSON.stringify({ channel }),
    }),

  fetchVideos: (channelId, publishedAfter) =>
    request("/fetch-videos", {
      method: "POST",
      body: JSON.stringify({ channelId, publishedAfter }),
    }),
};
