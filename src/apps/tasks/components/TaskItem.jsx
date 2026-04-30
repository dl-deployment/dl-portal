import { memo } from "react";

function formatRelative(isoString) {
  const now = Date.now();
  const due = new Date(isoString).getTime();
  const diff = due - now;
  const absDiff = Math.abs(diff);

  const mins = Math.floor(absDiff / 60000);
  const hours = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);

  let relative;
  if (mins < 1) relative = "now";
  else if (mins < 60) relative = `${mins}m`;
  else if (hours < 24) relative = `${hours}h`;
  else relative = `${days}d`;

  if (diff < 0 && mins >= 1) return `${relative} ago`;
  if (diff > 0) return `in ${relative}`;
  return relative;
}

function formatAbsolute(isoString) {
  return new Date(isoString).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function reminderLabel(mins) {
  if (mins === 1440) return "1 day before";
  if (mins === 60) return "1h before";
  if (mins === 30) return "30m before";
  return "15m before";
}

const TaskItem = memo(function TaskItem({ task, onToggleComplete, onEdit, onDelete }) {
  const isOverdue = !task.completed && new Date(task.dueAt).getTime() < Date.now();

  return (
    <div className={`tk-item ${isOverdue ? "tk-item--overdue" : ""} ${task.completed ? "tk-item--done" : ""}`}>
      <button
        className={`tk-checkbox ${task.completed ? "tk-checkbox--checked" : ""}`}
        onClick={() => onToggleComplete(task)}
        aria-label={task.completed ? "Mark as pending" : "Mark as completed"}
      >
        {task.completed && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="tk-item-body">
        <div className="tk-item-title">{task.title}</div>
        {task.description && <div className="tk-item-desc">{task.description}</div>}
        <div className="tk-item-meta">
          <span className={`tk-item-due ${isOverdue ? "tk-item-due--overdue" : ""}`}>
            {formatAbsolute(task.dueAt)} ({formatRelative(task.dueAt)})
          </span>
          <span className="tk-item-reminder">{reminderLabel(task.reminderMinsBefore)}</span>
          {task.reminderSent && <span className="tk-item-sent">Reminded</span>}
        </div>
      </div>

      <div className="tk-item-actions">
        <button className="btn btn-ghost tk-btn-sm" onClick={() => onEdit(task)} aria-label="Edit">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M10 1.5L12.5 4L4.5 12H2V9.5L10 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </button>
        <button className="btn btn-ghost tk-btn-sm tk-btn-danger" onClick={() => onDelete(task)} aria-label="Delete">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3.5L11 11.5M11 3.5L3 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
});

export default TaskItem;
