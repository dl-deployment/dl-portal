function isUrl(str) {
  return str && (str.startsWith("http://") || str.startsWith("https://"));
}

export default function BookmarkGrid({ bookmarks, onEdit, onDelete }) {
  if (bookmarks.length === 0) {
    return (
      <div className="bm-empty">
        <p>No bookmarks yet</p>
        <p>Click "+ Add Bookmark" to get started</p>
      </div>
    );
  }

  return (
    <div className="bm-grid">
      {bookmarks.map((bm) => (
        <div key={bm.id} className="bm-card">
          <a href={bm.url} target="_blank" rel="noopener noreferrer" className="bm-card-link">
            <div className="bm-card-icon">
              {isUrl(bm.icon) ? (
                <img src={bm.icon} alt="" className="bm-card-favicon" />
              ) : (
                <span className="bm-card-emoji">{bm.icon || "🔗"}</span>
              )}
            </div>
            <div className="bm-card-body">
              <div className="bm-card-title">{bm.title}</div>
              {bm.description && <div className="bm-card-desc">{bm.description}</div>}
            </div>
          </a>
          <div className="bm-card-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(bm)} aria-label={`Edit ${bm.title}`}>
              Edit
            </button>
            <button
              className="btn btn-ghost btn-sm bm-btn-danger"
              onClick={() => {
                if (window.confirm(`Delete "${bm.title}"?`)) onDelete(bm.id);
              }}
              aria-label={`Delete ${bm.title}`}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
