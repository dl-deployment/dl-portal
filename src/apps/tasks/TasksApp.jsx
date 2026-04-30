import { useState, useEffect, useCallback } from "react";
import { api } from "./api";
import TaskTabs from "./components/TaskTabs";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import "./tasks.css";

export default function TasksApp() {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getTasks();
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function handleSave(payload) {
    setSaving(true);
    try {
      if (payload.id) {
        await api.updateTask(payload);
      } else {
        await api.createTask(payload);
      }
      setShowForm(false);
      setEditingTask(null);
      await loadTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleComplete(task) {
    try {
      await api.updateTask({ id: task.id, completed: !task.completed });
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(task) {
    setEditingTask(task);
    setShowForm(true);
  }

  async function handleDelete(task) {
    try {
      await api.deleteTask(task.id);
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
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

  if (loading) {
    return (
      <div className="tasks-app">
        <div className="tk-loading">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="tasks-app">
      <div className="tk-header">
        <h2>Tasks</h2>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add Task
        </button>
      </div>

      {error && (
        <div className="tk-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

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
          saving={saving}
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
