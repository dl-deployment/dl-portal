import { useState, memo } from "react";

const ChannelList = memo(function ChannelList({ channels, onDelete }) {
  const [copied, setCopied] = useState(null);

  if (channels.length === 0) return null;

  function handleCopy(channelId) {
    const url = `https://www.youtube.com/channel/${channelId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(channelId);
      setTimeout(() => setCopied(null), 1500);
    }).catch(() => {
      /* clipboard API not available */
    });
  }

  return (
    <div className="channels-section">
      <div className="section-title">Channels ({channels.length})</div>
      <div className="channels-grid">
        {channels.map((ch) => (
          <div key={ch.channelId} className="channel-chip">
            {ch.thumbnail && <img src={ch.thumbnail} alt={ch.channelName} />}
            <span
              className="channel-name-click"
              onClick={() => handleCopy(ch.channelId)}
              title="Click to copy channel link"
            >
              {ch.channelName}
              {copied === ch.channelId && <span className="copied-badge">Copied!</span>}
            </span>
            <button
              className="btn-ghost"
              onClick={() => onDelete(ch.channelId)}
              title="Remove channel"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

export default ChannelList;
