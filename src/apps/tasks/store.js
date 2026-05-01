import { dbApi } from "../../lib/dbApi.js";

const APP = "tasks";

async function readStore() {
  const { data } = await dbApi.read(APP);
  return data || { tasks: [] };
}

async function writeStore(data) {
  await dbApi.write(APP, data);
}

export async function getTasks() {
  const store = await readStore();
  return store.tasks;
}

export async function createTask({ title, description, dueAt, reminders, repeat }) {
  const store = await readStore();
  const maxId = store.tasks.reduce((m, t) => Math.max(m, t.id), 0);
  const task = {
    id: maxId + 1,
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
  await writeStore(store);
  return task;
}

export async function updateTask(id, fields) {
  const store = await readStore();
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

  await writeStore(store);
  return task;
}

export async function completeTask(id) {
  const store = await readStore();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) return null;

  if (task.completed) {
    task.completed = false;
    await writeStore(store);
    return task;
  }

  task.completed = true;

  if (task.repeat && task.repeat !== "none") {
    const days = task.repeat === "daily" ? 1 : 7;
    const nextDue = new Date(task.dueAt);
    nextDue.setDate(nextDue.getDate() + days);

    const maxId = store.tasks.reduce((m, t) => Math.max(m, t.id), 0);
    const nextTask = {
      id: maxId + 1,
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

  await writeStore(store);
  return task;
}

export async function deleteTask(id) {
  const store = await readStore();
  store.tasks = store.tasks.filter((t) => t.id !== id);
  await writeStore(store);
}
