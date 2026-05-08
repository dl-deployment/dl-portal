import { useState } from "react";

export default function FacebookForm({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSave({ name, url });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="fb-form" onSubmit={handleSubmit}>
      <h3 className="fb-form-title">Add Facebook Page</h3>

      <div className="fb-form-field">
        <label htmlFor="fb-name">Name</label>
        <input
          id="fb-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Page name"
          maxLength={100}
          required
          className={name ? "has-value" : ""}
        />
      </div>

      <div className="fb-form-field">
        <label htmlFor="fb-url">URL</label>
        <input
          id="fb-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://facebook.com/..."
          maxLength={500}
          required
          className={url ? "has-value" : ""}
        />
      </div>

      <div className="fb-form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Create"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
