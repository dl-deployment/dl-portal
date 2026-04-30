import TaskItem from "./TaskItem";

export default function TaskList({ tasks, activeTab, onToggleComplete, onEdit, onDelete }) {
  const filtered = tasks
    .filter((t) => (activeTab === "pending" ? !t.completed : t.completed))
    .sort((a, b) => {
      const da = new Date(a.dueAt).getTime();
      const db = new Date(b.dueAt).getTime();
      return activeTab === "pending" ? da - db : db - da;
    });

  if (filtered.length === 0) {
    return (
      <div className="tk-empty">
        {activeTab === "pending" ? "No pending tasks" : "No completed tasks"}
      </div>
    );
  }

  return (
    <div className="tk-list">
      {filtered.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
