function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  const intervals = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export default function VideoGrid({ videos }) {
  if (videos.length === 0) {
    return (
      <div className="empty">
        <p>No videos yet</p>
        <p>Add some channels, then hit "Fetch Videos" to fetch videos.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="section-title">Latest Videos ({videos.length})</div>
      <div className="videos-grid">
        {videos.map((v) => (
          <div key={v.videoId} className="video-card">
            <a
              href={`https://www.youtube.com/watch?v=${v.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="video-thumb">
                <img src={v.thumbnail} alt={v.title} loading="lazy" />
              </div>
              <div className="video-info">
                <div className="video-title">{v.title}</div>
                <div className="video-meta">
                  <span>{v.channelName}</span>
                  <span>{timeAgo(v.publishedAt)}</span>
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
