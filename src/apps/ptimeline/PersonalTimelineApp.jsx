import { useState, useEffect } from "react";
import { getToday, formatDateVi, solarToLunar, calcDaysLeft } from "../timeline/lunar.js";
import * as store from "./store.js";
import EventCard from "./components/EventCard.jsx";
import EventForm from "./components/EventForm.jsx";
import "./ptimeline.css";

function processEvents(rawEvents) {
  return rawEvents
    .map((ev) => {
      const { date, daysLeft } = calcDaysLeft(ev.solarDate, ev.type);
      return { ...ev, eventDate: date, daysLeft };
    })
    .sort((a, b) => a.eventDate - b.eventDate);
}

export default function PersonalTimelineApp() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    store.getEvents().then((evts) => {
      setEvents(processEvents(evts));
      setReady(true);
    });
  }, []);

  async function reload() {
    const evts = await store.getEvents();
    setEvents(processEvents(evts));
  }

  async function handleSave(payload) {
    if (payload.id) {
      await store.updateEvent(payload.id, payload);
    } else {
      await store.createEvent(payload);
    }
    setShowForm(false);
    setEditingEvent(null);
    await reload();
  }

  function handleEdit(ev) {
    setEditingEvent(ev);
    setShowForm(true);
  }

  async function handleDelete(ev) {
    if (!window.confirm(`Delete "${ev.name}"?`)) return;
    await store.deleteEvent(ev.id);
    await reload();
  }

  function handleAdd() {
    setEditingEvent(null);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingEvent(null);
  }

  const today = getToday();
  const todaySolar = formatDateVi(today);
  const lunar = solarToLunar(today);
  const todayLunar = `${lunar.day}/${lunar.month}/${lunar.year}`;

  return (
    <div className="ptimeline-app">
      {!ready ? <div className="app-loading">Loading...</div> : <>
        <div className="pt-header">
          <div className="pt-header-inner">
            <div className="pt-header-brand">
              <span className="pt-brand-icon">{"📅"}</span>
              <span className="pt-brand-title">Personal Timeline</span>
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>+ Add Event</button>
          </div>
          <div className="pt-today-bar">
            <div className="pt-today-row">
              <span className="pt-today-label">Solar</span>
              <span className="pt-today-date">{todaySolar}</span>
            </div>
            <div className="pt-today-row">
              <span className="pt-today-label">Lunar</span>
              <span className="pt-today-lunar">{todayLunar}</span>
            </div>
          </div>
        </div>

        {showForm && (
          <EventForm event={editingEvent} onSave={handleSave} onCancel={handleCancel} />
        )}

        <div className="pt-main-container">
          {events.length === 0 ? (
            <div className="pt-empty">No events yet. Add your first event!</div>
          ) : (
            <div className="pt-timeline">
              {events.map((ev, i) => (
                <EventCard key={ev.id} ev={ev} index={i} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </>}
    </div>
  );
}
