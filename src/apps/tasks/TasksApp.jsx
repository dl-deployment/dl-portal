import { useState } from "react";
import * as store from "./store.js";
import TaskTabs from "./components/TaskTabs";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import DataManager from "./components/DataManager";
import "./tasks.css";

export default function TasksApp() {
  const [tasks, setTasks] = useState(() => store.getTasks());
  const [activeTab, setActiveTab] = useState("pending");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  function reload() {
    setTasks(store.getTasks());
  }

  function handleSave(payload) {
    if (payload.id) {
      store.updateTask(payload.id, payload);
    } else {
      store.createTask(payload);
    }
    setShowForm(false);
    setEditingTask(null);
    reload();
  }

  function handleToggleComplete(task) {
    store.completeTask(task.id);
    reload();
  }

  function handleEdit(task) {
    setEditingTask(task);
    setShowForm(true);
  }

  function handleDelete(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    store.deleteTask(task.id);
    reload();
  }

  function handleCancel() {
    setShowForm(false);
    setEditingTask(null);
  }

  function handleAdd() {
    setEditingTask(null);
    setShowForm(true);
  }

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="tasks-app">
      <div className="tk-header">
        <h2>Tasks</h2>
        <div className="tk-header-actions">
          <DataManager onDataChange={reload} />
          <button className="btn btn-primary" onClick={handleAdd}>
            + Add Task
          </button>
        </div>
      </div>

      <TaskTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingCount={pendingCount}
        completedCount={completedCount}
      />

      {showForm && (
        <TaskForm
          task={editingTask}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <TaskList
        tasks={tasks}
        activeTab={activeTab}
        onToggleComplete={handleToggleComplete}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
