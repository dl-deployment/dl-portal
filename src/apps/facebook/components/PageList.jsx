import { useState, memo } from "react";

const IconRss = () => (
  <svg className="chip-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1" /></svg>
);
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

const PageList = memo(function PageList({ pages, onDelete, onUpdate }) {
  const [confirmId, setConfirmId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");

  if (pages.length === 0) return null;

  function handleEditClick(pg) {
    setEditId(pg.feedUrl);
    setEditName(pg.pageName);
    setEditUrl(pg.feedUrl);
  }

  function handleEditSubmit(e) {
    e.preventDefault();
    const trimmedName = editName.trim();
    const trimmedUrl = editUrl.trim();
    if (trimmedName && trimmedUrl && onUpdate) {
      const updates = { pageName: trimmedName };
      if (trimmedUrl !== editId) updates.feedUrl = trimmedUrl;
      onUpdate(editId, updates);
    }
    setEditId(null);
  }

  function handleEditCancel() {
    setEditId(null);
  }

  return (
    <div className="pages-section">
      <div className="section-title">Feeds ({pages.length})</div>
      <div className="pages-grid">
        {pages.map((pg) => (
          <div key={pg.feedUrl} className={`page-chip${confirmId === pg.feedUrl ? " confirm-active" : ""}${editId === pg.feedUrl ? " chip-editing" : ""}`}>
            <IconRss />

            {editId === pg.feedUrl ? (
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
                  placeholder="Feed URL"
                />
                <button type="submit" className="btn-ghost confirm-yes" title="Save"><IconCheck /></button>
                <button type="button" className="btn-ghost confirm-no" onClick={handleEditCancel} title="Cancel"><IconX /></button>
              </form>
            ) : confirmId === pg.feedUrl ? (
              <span className="confirm-msg">
                Delete?
                <button className="btn-ghost confirm-yes" onClick={() => { onDelete(pg.feedUrl); setConfirmId(null); }}><IconCheck /></button>
                <button className="btn-ghost confirm-no" onClick={() => setConfirmId(null)}><IconX /></button>
              </span>
            ) : (
              <>
                <span className="chip-name" title={pg.feedUrl}>{pg.pageName}</span>
                <a className="btn-ghost chip-btn chip-link" href={pg.feedUrl} target="_blank" rel="noopener noreferrer" title="Open feed URL">
                  <IconLink />
                </a>
                <button className="btn-ghost chip-btn" onClick={() => handleEditClick(pg)} title="Edit"><IconEdit /></button>
                <button className="btn-ghost chip-btn chip-delete" onClick={() => setConfirmId(pg.feedUrl)} title="Remove feed"><IconTrash /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

export default PageList;
