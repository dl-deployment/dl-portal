import { useState, useEffect } from "react";

export default function PageForm({ page, onSave, onCancel }) {
  const [feedUrl, setFeedUrl] = useState("");
  const [name, setName] = useState("");

  const isEdit = !!page;

  useEffect(() => {
    if (page) {
      setFeedUrl(page.feedUrl || "");
      setName(page.pageName || "");
    } else {
      setFeedUrl("");
      setName("");
    }
  }, [page]);

  function handleSubmit(e) {
    e.preventDefault();
    if (isEdit) {
      onSave({
        oldFeedUrl: page.feedUrl,
        feedUrl: feedUrl.trim(),
        pageName: name.trim(),
      });
    } else {
      onSave({
        feedUrl: feedUrl.trim(),
        pageName: name.trim() || undefined,
      });
    }
  }

  return (
    <form className="fb-form" onSubmit={handleSubmit}>
      <h3 className="fb-form-title">{isEdit ? "Edit Feed" : "New Feed"}</h3>

      <div className="fb-form-field">
        <label htmlFor="fb-url">Feed URL</label>
        <input
          id="fb-url"
          type="url"
          value={feedUrl}
          onChange={(e) => setFeedUrl(e.target.value)}
          placeholder="https://rss.app/feeds/... or any RSS/Atom feed"
          required
          autoFocus={!isEdit}
        />
      </div>

      <div className="fb-form-field">
        <label htmlFor="fb-name">Name</label>
        <input
          id="fb-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Page name (optional, auto-extracted from URL)"
          autoFocus={isEdit}
        />
      </div>

      <div className="fb-form-actions">
        <button type="submit" className="btn btn-primary">
          {isEdit ? "Update" : "Add Feed"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
