import { memo } from "react";

const PageList = memo(function PageList({ pages, onDelete }) {
  if (pages.length === 0) return null;

  return (
    <div className="pages-section">
      <div className="section-title">Feeds ({pages.length})</div>
      <div className="pages-grid">
        {pages.map((pg) => (
          <div key={pg.feedUrl} className="page-chip">
            <span className="page-name" title={pg.feedUrl}>
              {pg.pageName}
            </span>
            <button
              className="btn-ghost"
              onClick={() => onDelete(pg.feedUrl)}
              title="Remove feed"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

export default PageList;
