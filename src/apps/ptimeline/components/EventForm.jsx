import { useState } from "react";

const ICON_OPTIONS = ["📌", "🎂", "🎉", "🎆", "💰", "🌕", "🏯", "🇻🇳", "🛠️", "🍑", "🥮", "🎗️", "🎃", "🎄", "🧨", "❤️", "⭐", "🎓", "✈️", "🏠"];

export default function EventForm({ event, onSave, onCancel }) {
  const isEdit = !!event;
  const [name, setName] = useState(event?.name || "");
  const [solarDate, setSolarDate] = useState(event?.solarDate || "");
  const [lunarDate, setLunarDate] = useState(event?.lunarDate || "");
  const [type, setType] = useState(event?.type || "solar");
  const [icon, setIcon] = useState(event?.icon || "📌");
  const [note, setNote] = useState(event?.note || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !solarDate) return;
    setSaving(true);
    await onSave({
      ...(isEdit ? { id: event.id } : {}),
      name,
      solarDate,
      lunarDate: type === "lunar" ? lunarDate : "",
      type,
      icon,
      note,
    });
    setSaving(false);
  }

  return (
    <form className="pt-form" onSubmit={handleSubmit}>
      <div className="pt-form-header">
        <h3>{isEdit ? "Edit Event" : "Add Event"}</h3>
      </div>

      <div className="pt-form-grid">
        <div className="pt-field">
          <label>Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" maxLength={200} required />
        </div>

        <div className="pt-field">
          <label>Solar Date *</label>
          <input type="date" value={solarDate} onChange={(e) => setSolarDate(e.target.value)} required />
        </div>

        <div className="pt-field">
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="solar">☀ Solar</option>
            <option value="lunar">☽ Lunar</option>
          </select>
        </div>

        {type === "lunar" && (
          <div className="pt-field">
            <label>Lunar Date</label>
            <input type="text" value={lunarDate} onChange={(e) => setLunarDate(e.target.value)} placeholder="DD/MM (e.g. 01/01)" maxLength={5} />
          </div>
        )}

        <div className="pt-field">
          <label>Note</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" maxLength={500} />
        </div>

        <div className="pt-field">
          <label>Icon</label>
          <div className="pt-icon-grid">
            {ICON_OPTIONS.map((ic) => (
              <button key={ic} type="button" className={`pt-icon-btn ${icon === ic ? "active" : ""}`} onClick={() => setIcon(ic)}>{ic}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving || !name.trim() || !solarDate}>
          {saving ? "Saving..." : isEdit ? "Update" : "Add"}
        </button>
      </div>
    </form>
  );
}
