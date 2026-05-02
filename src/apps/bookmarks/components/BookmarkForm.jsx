import { useState, useEffect } from "react";

export default function BookmarkForm({ bookmark, onSave, onCancel }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title);
      setUrl(bookmark.url);
      setDescription(bookmark.description || "");
      setIcon(bookmark.icon || "");
    } else {
      setTitle("");
      setUrl("");
      setDescription("");
      setIcon("");
    }
  }, [bookmark]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSave({
        ...(bookmark && { id: bookmark.id }),
        title,
        url,
        description,
        icon,
      });
    } finally {
      setSaving(false);
    }
  }

  const isEdit = !!bookmark;

  return (
    <form className="bm-form" onSubmit={handleSubmit}>
      <h3 className="bm-form-title">{isEdit ? "Edit Bookmark" : "New Bookmark"}</h3>

      <div className="bm-form-field">
        <label htmlFor="bm-title">Title</label>
        <input
          id="bm-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="App or website name"
          maxLength={100}
          required
        />
      </div>

      <div className="bm-form-field">
        <label htmlFor="bm-url">URL</label>
        <input
          id="bm-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          maxLength={500}
          required
        />
      </div>

      <div className="bm-form-field">
        <label htmlFor="bm-desc">Description</label>
        <textarea
          id="bm-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          maxLength={200}
          rows={2}
        />
      </div>

      <div className="bm-form-field">
        <label htmlFor="bm-icon">Icon</label>
        <input
          id="bm-icon"
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder='Emoji or favicon URL (optional)'
          maxLength={300}
        />
        <div className="bm-form-hint">Paste an emoji or a favicon URL</div>
      </div>

      <div className="bm-form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Update" : "Create"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
