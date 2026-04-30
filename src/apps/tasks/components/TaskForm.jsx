import { useState, useEffect } from "react";

const REMINDER_OPTIONS = [
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 1440, label: "1 day before" },
];

function toLocalDatetime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function TaskForm({ task, onSave, onCancel, saving }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [reminderMinsBefore, setReminderMinsBefore] = useState(60);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setDueAt(toLocalDatetime(task.dueAt));
      setReminderMinsBefore(task.reminderMinsBefore);
    } else {
      setTitle("");
      setDescription("");
      setDueAt("");
      setReminderMinsBefore(60);
    }
  }, [task]);

  function handleSubmit(e) {
    e.preventDefault();
    const localDate = new Date(dueAt);
    const payload = {
      title,
      description,
      dueAt: localDate.toISOString(),
      reminderMinsBefore,
    };
    if (task) payload.id = task.id;
    onSave(payload);
  }

  const isEdit = !!task;

  return (
    <form className="tk-form" onSubmit={handleSubmit}>
      <h3 className="tk-form-title">{isEdit ? "Edit Task" : "New Task"}</h3>

      <div className="tk-form-field">
        <label htmlFor="tk-title">Title</label>
        <input
          id="tk-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          maxLength={200}
          required
        />
      </div>

      <div className="tk-form-field">
        <label htmlFor="tk-desc">Description</label>
        <textarea
          id="tk-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          maxLength={1000}
          rows={3}
        />
      </div>

      <div className="tk-form-row">
        <div className="tk-form-field">
          <label htmlFor="tk-due">Due Date & Time</label>
          <input
            id="tk-due"
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            required
          />
        </div>

        <div className="tk-form-field">
          <label htmlFor="tk-reminder">Reminder</label>
          <select
            id="tk-reminder"
            value={reminderMinsBefore}
            onChange={(e) => setReminderMinsBefore(Number(e.target.value))}
          >
            {REMINDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="tk-form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Update" : "Create"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
