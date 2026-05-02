export default function ChannelGrid({ channels, onEdit, onDelete }) {
  if (channels.length === 0) {
    return (
      <div className="yt-empty">
        <p>No channels yet</p>
        <p>Click "+ Add Channel" to get started</p>
      </div>
    );
  }

  return (
    <div className="yt-grid">
      {channels.map((ch) => (
        <div key={ch.channelId} className="yt-card">
          <a
            href={`https://www.youtube.com/channel/${ch.channelId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="yt-card-link"
          >
            <div className="yt-card-icon">
              {ch.thumbnail ? (
                <img src={ch.thumbnail} alt="" className="yt-card-avatar" />
              ) : (
                <span className="yt-card-emoji">📺</span>
              )}
            </div>
            <div className="yt-card-body">
              <div className="yt-card-title">{ch.channelName}</div>
            </div>
          </a>
          <div className="yt-card-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onEdit(ch)}
              aria-label={`Edit ${ch.channelName}`}
            >
              Edit
            </button>
            <button
              className="btn btn-ghost btn-sm yt-btn-danger"
              onClick={() => {
                if (window.confirm(`Delete "${ch.channelName}"?`)) onDelete(ch.channelId);
              }}
              aria-label={`Delete ${ch.channelName}`}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
