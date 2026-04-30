import { useState, useEffect } from "react";

const REMINDER_OPTIONS = [
  { value: 5, label: "5m" },
  { value: 10, label: "10m" },
  { value: 15, label: "15m" },
  { value: 30, label: "30m" },
  { value: 60, label: "1h" },
  { value: 1440, label: "1 day" },
];

function toLocalDatetime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function TaskForm({ task, onSave, onCancel }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [reminders, setReminders] = useState([15]);
  const [repeat, setRepeat] = useState("none");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setDueAt(toLocalDatetime(task.dueAt));
      setReminders(task.reminders || [task.reminderMinsBefore || 15]);
      setRepeat(task.repeat || "none");
    } else {
      setTitle("");
      setDescription("");
      setDueAt("");
      setReminders([15]);
      setRepeat("none");
    }
  }, [task]);

  function toggleReminder(value) {
    setReminders((prev) => {
      if (prev.includes(value)) {
        if (prev.length === 1) return prev;
        return prev.filter((v) => v !== value);
      }
      return [...prev, value].sort((a, b) => b - a);
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const localDate = new Date(dueAt);
    const payload = {
      title,
      description,
      dueAt: localDate.toISOString(),
      reminders,
      repeat,
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
          <label htmlFor="tk-repeat">Repeat</label>
          <select
            id="tk-repeat"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
          >
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>

      <div className="tk-form-field">
        <label>Reminders</label>
        <div className="tk-reminder-chips">
          {REMINDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`tk-chip ${reminders.includes(opt.value) ? "tk-chip--active" : ""}`}
              onClick={() => toggleReminder(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tk-form-actions">
        <button type="submit" className="btn btn-primary">
          {isEdit ? "Update" : "Create"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
