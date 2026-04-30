import { useState, useEffect } from "react";
import { getToday, formatDateVi, solarToLunar, calcDaysLeft } from "./lunar.js";
import eventsData from "../../data/events.json";
import EventCard from "./components/EventCard.jsx";
import "./timeline.css";

function processEvents(rawEvents) {
  return rawEvents
    .map((ev) => {
      const { date, daysLeft } = calcDaysLeft(ev.solarDate, ev.type);
      return { ...ev, eventDate: date, daysLeft };
    })
    .sort((a, b) => a.eventDate - b.eventDate);
}

export default function Timeline() {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    setEvents(processEvents(eventsData));
  }, []);

  const today = getToday();
  const todaySolar = formatDateVi(today);
  const lunar = solarToLunar(today);
  const todayLunar = `${lunar.day}/${lunar.month}/${lunar.year}`;

  return (
    <div className="timeline-app">
      <div className="tl-header">
        <div className="tl-header-inner">
          <div className="tl-header-brand">
            <span className="tl-brand-icon">{"⚙"}</span>
            <span className="tl-brand-title">Event Timeline</span>
          </div>
          <div className="tl-header-controls" />
        </div>
        <div className="tl-today-bar">
          <div className="tl-today-row">
            <span className="tl-today-label">Solar</span>
            <span className="tl-today-date">{todaySolar}</span>
          </div>
          <div className="tl-today-row">
            <span className="tl-today-label">Lunar</span>
            <span className="tl-today-lunar">{todayLunar}</span>
          </div>
        </div>
      </div>

      <div className="tl-main-container">
        <div className="timeline">
          {events.map((ev, i) => (
            <EventCard key={`${ev.name}-${ev.solarDate}`} ev={ev} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
