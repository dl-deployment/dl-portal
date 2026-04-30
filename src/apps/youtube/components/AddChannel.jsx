import { useState } from "react";

const YT_PATTERNS = [
  /^https?:\/\/(www\.)?youtube\.com\/(channel\/|@|c\/)/,
  /^https?:\/\/youtu\.be\//,
  /^@[\w.-]+$/,
];

function isValidInput(input) {
  return YT_PATTERNS.some((re) => re.test(input));
}

export default function AddChannel({ onAdded }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

    if (!isValidInput(trimmed)) {
      setError("Please enter a valid YouTube URL or @handle");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onAdded(trimmed);
      setValue("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form className="add-channel" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="YouTube link or @handle (e.g. https://youtube.com/@MKBHD)"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(null); }}
          disabled={loading}
        />
        <button type="submit" className="btn-accent" disabled={loading || !value.trim()}>
          {loading ? "Adding..." : "Add Channel"}
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
