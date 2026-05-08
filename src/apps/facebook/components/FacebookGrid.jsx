export default function FacebookGrid({ pages, onDelete }) {
  if (pages.length === 0) {
    return (
      <div className="fb-empty">
        <p>No pages in this tab</p>
        <p>Click "+ Add Page" to get started</p>
      </div>
    );
  }

  return (
    <div className="fb-grid">
      {pages.map((page) => (
        <div key={`${page.sheetId}-${page.id}`} className="fb-card">
          <a href={page.url} target="_blank" rel="noopener noreferrer" className="fb-card-link">
            <span className="fb-card-icon">📘</span>
            <div className="fb-card-body">
              <div className="fb-card-title">{page.name}</div>
            </div>
          </a>
          <div className="fb-card-actions">
            <button
              className="btn btn-ghost btn-sm fb-btn-danger"
              onClick={() => {
                if (window.confirm(`Delete "${page.name}"?`)) onDelete(page.sheetId, page.id);
              }}
              aria-label={`Delete ${page.name}`}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
