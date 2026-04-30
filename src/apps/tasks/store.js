import defaultData from "../../data/tasks-default.json";

const STORAGE_KEY = "dl-tasks-data";

function defaultStore() {
  return {
    ...structuredClone(defaultData),
    nextTaskId: 1,
  };
}

export function getStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    const data = JSON.parse(raw);
    if (!data.tasks || !Array.isArray(data.tasks)) return defaultStore();
    if (!data.nextTaskId) data.nextTaskId = Math.max(...data.tasks.map((t) => t.id), 0) + 1;
    return data;
  } catch {
    return defaultStore();
  }
}

export function saveStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getTasks() {
  return getStore().tasks;
}

export function createTask({ title, description, dueAt, reminders, repeat }) {
  const store = getStore();
  const task = {
    id: store.nextTaskId++,
    title: title.trim().slice(0, 200),
    description: (description || "").trim().slice(0, 1000),
    dueAt,
    reminders: Array.isArray(reminders) ? reminders : [15],
    repeat: repeat || "none",
    completed: false,
    reminderSent: false,
    createdAt: new Date().toISOString(),
  };
  store.tasks.push(task);
  saveStore(store);
  return task;
}

export function updateTask(id, fields) {
  const store = getStore();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) return null;

  const dueChanged = fields.dueAt && fields.dueAt !== task.dueAt;
  const remindersChanged =
    fields.reminders !== undefined &&
    JSON.stringify(fields.reminders) !== JSON.stringify(task.reminders);

  if (fields.title !== undefined) task.title = fields.title.trim().slice(0, 200);
  if (fields.description !== undefined) task.description = fields.description.trim().slice(0, 1000);
  if (fields.dueAt !== undefined) task.dueAt = fields.dueAt;
  if (fields.reminders !== undefined) task.reminders = fields.reminders;
  if (fields.repeat !== undefined) task.repeat = fields.repeat;
  if (fields.completed !== undefined) task.completed = fields.completed;

  if (dueChanged || remindersChanged) {
    task.reminderSent = false;
  }

  saveStore(store);
  return task;
}

export function completeTask(id) {
  const store = getStore();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) return null;

  if (task.completed) {
    task.completed = false;
    saveStore(store);
    return task;
  }

  task.completed = true;

  if (task.repeat && task.repeat !== "none") {
    const days = task.repeat === "daily" ? 1 : 7;
    const nextDue = new Date(task.dueAt);
    nextDue.setDate(nextDue.getDate() + days);

    const nextTask = {
      id: store.nextTaskId++,
      title: task.title,
      description: task.description,
      dueAt: nextDue.toISOString(),
      reminders: [...task.reminders],
      repeat: task.repeat,
      completed: false,
      reminderSent: false,
      createdAt: new Date().toISOString(),
    };
    store.tasks.push(nextTask);
  }

  saveStore(store);
  return task;
}

export function deleteTask(id) {
  const store = getStore();
  store.tasks = store.tasks.filter((t) => t.id !== id);
  saveStore(store);
}

export function exportData() {
  const store = getStore();
  const { nextTaskId: _, ...data } = store;
  return JSON.stringify(data, null, 2);
}

export function importData(json) {
  const data = JSON.parse(json);
  if (!data.tasks || !Array.isArray(data.tasks)) throw new Error("Invalid data: missing tasks");
  data.nextTaskId = Math.max(...data.tasks.map((t) => t.id), 0) + 1;
  saveStore(data);
}
