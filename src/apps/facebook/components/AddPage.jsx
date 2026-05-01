import { useState } from "react";

function isValidFeedUrl(input) {
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function AddPage({ onAdded }) {
  const [feedUrl, setFeedUrl] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmedUrl = feedUrl.trim();
    if (!trimmedUrl) return;

    if (!isValidFeedUrl(trimmedUrl)) {
      setError("Please enter a valid RSS feed URL");
      return;
    }

    setError(null);
    onAdded(trimmedUrl, name.trim() || undefined);
    setFeedUrl("");
    setName("");
  }

  return (
    <div>
      <form className="add-page" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="RSS feed URL (from rss.app or any RSS/Atom feed)"
          value={feedUrl}
          onChange={(e) => { setFeedUrl(e.target.value); setError(null); }}
        />
        <input
          type="text"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="add-page-name"
        />
        <button type="submit" className="btn-accent" disabled={!feedUrl.trim()}>
          Add Feed
        </button>
      </form>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button className="btn-ghost" onClick={() => setError(null)}>dismiss</button>
        </div>
      )}
    </div>
  );
}
