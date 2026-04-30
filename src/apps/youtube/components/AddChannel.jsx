import { useState } from "react";

export default function AddChannel({ onAdded }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

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
          onChange={(e) => setValue(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn-accent" disabled={loading || !value.trim()}>
          {loading ? "Adding..." : "Add Channel"}
        </button>
      </form>
      {error && (
        <div className="error-banner">
          {error}
          <button className="btn-ghost" onClick={() => setError(null)}>dismiss</button>
        </div>
      )}
    </div>
  );
}
