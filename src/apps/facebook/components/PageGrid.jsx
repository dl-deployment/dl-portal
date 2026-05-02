export default function PageGrid({ pages, onEdit, onDelete }) {
  if (pages.length === 0) {
    return (
      <div className="fb-empty">
        <p>No feeds yet</p>
        <p>Click "+ Add Feed" to get started</p>
      </div>
    );
  }

  return (
    <div className="fb-grid">
      {pages.map((pg) => (
        <div key={pg.feedUrl} className="fb-card">
          <a
            href={pg.feedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fb-card-link"
          >
            <div className="fb-card-icon">
              {pg.thumbnail ? (
                <img src={pg.thumbnail} alt="" className="fb-card-avatar" />
              ) : (
                <span className="fb-card-emoji">📡</span>
              )}
            </div>
            <div className="fb-card-body">
              <div className="fb-card-title">{pg.pageName}</div>
              <div className="fb-card-desc">{pg.feedUrl}</div>
            </div>
          </a>
          <div className="fb-card-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onEdit(pg)}
              aria-label={`Edit ${pg.pageName}`}
            >
              Edit
            </button>
            <button
              className="btn btn-ghost btn-sm fb-btn-danger"
              onClick={() => {
                if (window.confirm(`Delete "${pg.pageName}"?`)) onDelete(pg.feedUrl);
              }}
              aria-label={`Delete ${pg.pageName}`}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
