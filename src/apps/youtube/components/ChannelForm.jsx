import { useState, useEffect } from "react";

export default function ChannelForm({ channel, onSave, onCancel, loading, error }) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");

  const isEdit = !!channel;

  useEffect(() => {
    if (channel) {
      setUrl("");
      setName(channel.channelName || "");
    } else {
      setUrl("");
      setName("");
    }
  }, [channel]);

  function handleSubmit(e) {
    e.preventDefault();
    if (isEdit) {
      onSave({ channelId: channel.channelId, channelName: name.trim() });
    } else {
      onSave({ input: url.trim(), channelName: name.trim() || undefined });
    }
  }

  return (
    <form className="yt-form" onSubmit={handleSubmit}>
      <h3 className="yt-form-title">{isEdit ? "Edit Channel" : "New Channel"}</h3>

      {!isEdit && (
        <div className="yt-form-field">
          <label htmlFor="yt-url">YouTube URL or @handle</label>
          <input
            id="yt-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/@MKBHD or @MKBHD"
            required
            autoFocus
          />
        </div>
      )}

      {isEdit && (
        <div className="yt-form-field">
          <label htmlFor="yt-name">Channel Name</label>
          <input
            id="yt-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Channel name"
            required
            autoFocus
          />
        </div>
      )}

      {isEdit && (
        <div className="yt-form-field">
          <label>Channel ID</label>
          <input type="text" value={channel.channelId} disabled />
          <div className="yt-form-hint">Channel ID cannot be changed</div>
        </div>
      )}

      {error && <div className="yt-form-error">{error}</div>}

      <div className="yt-form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Resolving..." : isEdit ? "Update" : "Add Channel"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </form>
  );
}
