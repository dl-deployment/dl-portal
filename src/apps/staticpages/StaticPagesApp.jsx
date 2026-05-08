import staticPages from "virtual:static-pages";
import "./staticpages.css";

function formatName(name) {
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StaticPagesApp() {
  return (
    <div className="staticpages-app">
      <h1 className="sp-title">Static Pages</h1>
      <div className="sp-grid">
        {staticPages.map((page) => (
          <a
            key={page.name}
            href={page.path}
            target="_blank"
            rel="noopener noreferrer"
            className="sp-card"
          >
            <span className="sp-icon">
              {page.type === "folder" ? "📁" : "📄"}
            </span>
            <span className="sp-name">{formatName(page.name)}</span>
            <span className="sp-type">{page.type === "folder" ? "Folder" : "HTML"}</span>
          </a>
        ))}
      </div>
      {staticPages.length === 0 && (
        <p className="sp-empty">No static pages found.</p>
      )}
    </div>
  );
}
