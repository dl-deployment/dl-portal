import { dbApi } from "../../lib/dbApi.js";

const APP = "ptimeline";

async function readStore() {
  const { data } = await dbApi.read(APP);
  return data || { events: [] };
}

async function writeStore(data) {
  await dbApi.write(APP, data);
}

export async function getEvents() {
  const store = await readStore();
  return store.events;
}

export async function createEvent({ name, solarDate, lunarDate, type, icon, note }) {
  const store = await readStore();
  const maxId = store.events.reduce((m, e) => Math.max(m, e.id), 0);
  const event = {
    id: maxId + 1,
    name: name.trim().slice(0, 200),
    solarDate,
    lunarDate: lunarDate || "",
    type: type || "solar",
    icon: icon || "📌",
    note: (note || "").trim().slice(0, 500),
    createdAt: new Date().toISOString(),
  };
  store.events.push(event);
  await writeStore(store);
  return event;
}

export async function updateEvent(id, fields) {
  const store = await readStore();
  const event = store.events.find((e) => e.id === id);
  if (!event) return null;

  if (fields.name !== undefined) event.name = fields.name.trim().slice(0, 200);
  if (fields.solarDate !== undefined) event.solarDate = fields.solarDate;
  if (fields.lunarDate !== undefined) event.lunarDate = fields.lunarDate;
  if (fields.type !== undefined) event.type = fields.type;
  if (fields.icon !== undefined) event.icon = fields.icon;
  if (fields.note !== undefined) event.note = fields.note.trim().slice(0, 500);

  await writeStore(store);
  return event;
}

export async function deleteEvent(id) {
  const store = await readStore();
  store.events = store.events.filter((e) => e.id !== id);
  await writeStore(store);
}
