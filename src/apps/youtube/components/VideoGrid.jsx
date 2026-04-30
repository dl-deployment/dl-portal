import { memo } from "react";
import { timeAgo } from "../utils.js";
import Skeleton from "../../../components/Skeleton.jsx";

const VideoGrid = memo(function VideoGrid({ videos, syncing }) {
  if (syncing) {
    return (
      <div>
        <div className="section-title">Fetching videos...</div>
        <Skeleton variant="card" count={6} />
      </div>
    );
  }

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
});

export default VideoGrid;
