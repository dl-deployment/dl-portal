import { useState, useEffect } from "react";
import * as store from "./store.js";
import TaskTabs from "./components/TaskTabs";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import "./tasks.css";

export default function TasksApp() {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    store.getTasks().then((t) => {
      setTasks(t);
      setReady(true);
    });
  }, []);

  async function reload() {
    setTasks(await store.getTasks());
  }

  async function handleSave(payload) {
    if (payload.id) {
      await store.updateTask(payload.id, payload);
    } else {
      await store.createTask(payload);
    }
    setShowForm(false);
    setEditingTask(null);
    await reload();
  }

  async function handleToggleComplete(task) {
    await store.completeTask(task.id);
    await reload();
  }

  function handleEdit(task) {
    setEditingTask(task);
    setShowForm(true);
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    await store.deleteTask(task.id);
    await reload();
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
      {!ready ? <div className="app-loading">Loading...</div> : <>
      <div className="tk-header">
        <h2>Tasks</h2>
        <div className="tk-header-actions">
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
      </>}
    </div>
  );
}
