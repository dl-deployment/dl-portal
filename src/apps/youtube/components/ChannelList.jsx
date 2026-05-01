import { useState, memo } from "react";

function channelUrl(channelId) {
  return `https://www.youtube.com/channel/${channelId}`;
}

const IconEdit = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
);
const IconTrash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);
const IconLink = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
);
const IconYoutube = () => (
  <svg className="chip-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></svg>
);

const ChannelList = memo(function ChannelList({ channels, onDelete, onUpdate }) {
  const [confirmId, setConfirmId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");

  if (channels.length === 0) return null;

  function handleEditClick(ch) {
    setEditId(ch.channelId);
    setEditName(ch.channelName);
    setEditUrl(ch.channelId);
  }

  function handleEditSubmit(e) {
    e.preventDefault();
    const trimmedName = editName.trim();
    const trimmedUrl = editUrl.trim();
    if (trimmedName && trimmedUrl && onUpdate) {
      const updates = { channelName: trimmedName };
      if (trimmedUrl !== editId) updates.channelId = trimmedUrl;
      onUpdate(editId, updates);
    }
    setEditId(null);
  }

  function handleEditCancel() {
    setEditId(null);
  }

  return (
    <div className="channels-section">
      <div className="section-title">Channels ({channels.length})</div>
      <div className="channels-grid">
        {channels.map((ch) => (
          <div key={ch.channelId} className={`channel-chip${confirmId === ch.channelId ? " confirm-active" : ""}${editId === ch.channelId ? " chip-editing" : ""}`}>
            <IconYoutube />

            {editId === ch.channelId ? (
              <form className="chip-edit-form" onSubmit={handleEditSubmit}>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && handleEditCancel()}
                  autoFocus
                  className="chip-edit-input"
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && handleEditCancel()}
                  className="chip-edit-input chip-edit-url"
                  placeholder="Channel ID"
                />
                <button type="submit" className="btn-ghost confirm-yes" title="Save"><IconCheck /></button>
                <button type="button" className="btn-ghost confirm-no" onClick={handleEditCancel} title="Cancel"><IconX /></button>
              </form>
            ) : confirmId === ch.channelId ? (
              <span className="confirm-msg">
                Delete?
                <button className="btn-ghost confirm-yes" onClick={() => { onDelete(ch.channelId); setConfirmId(null); }}><IconCheck /></button>
                <button className="btn-ghost confirm-no" onClick={() => setConfirmId(null)}><IconX /></button>
              </span>
            ) : (
              <>
                <span className="chip-name">{ch.channelName}</span>
                <a className="btn-ghost chip-btn chip-link" href={channelUrl(ch.channelId)} target="_blank" rel="noopener noreferrer" title="Open channel">
                  <IconLink />
                </a>
                <button className="btn-ghost chip-btn" onClick={() => handleEditClick(ch)} title="Edit"><IconEdit /></button>
                <button className="btn-ghost chip-btn chip-delete" onClick={() => setConfirmId(ch.channelId)} title="Remove channel"><IconTrash /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

export default ChannelList;
