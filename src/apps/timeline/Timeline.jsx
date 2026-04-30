import { useState, useEffect } from "react";
import { getToday, formatDateVi, solarToLunar, calcDaysLeft, getViMonth } from "./lunar.js";
import eventsData from "./events.json";
import "./timeline.css";

function processEvents(rawEvents) {
  return rawEvents
    .map((ev) => {
      const { date, daysLeft } = calcDaysLeft(ev.solarDate, ev.type);
      return { ...ev, eventDate: date, daysLeft };
    })
    .sort((a, b) => a.eventDate - b.eventDate);
}

function EventCard({ ev, index }) {
  const { name, solarDate, lunarDate, type, icon, note, eventDate, daysLeft } = ev;

  let stateClass = "";
  let countContent;

  if (daysLeft === 0) {
    stateClass = "is-today";
    countContent = (
      <>
        <div className="count-num today-tag">{"\u{1F389}"}</div>
        <span className="count-label">Today!</span>
      </>
    );
  } else if (daysLeft <= 7) {
    stateClass = "is-soon";
    countContent = (
      <>
        <div className="count-num">{daysLeft}</div>
        <span className="count-label">days</span>
      </>
    );
  } else {
    countContent = (
      <>
        <div className="count-num">{daysLeft}</div>
        <span className="count-label">days</span>
      </>
    );
  }

  const dd = eventDate.getDate().toString().padStart(2, "0");
  const mm = getViMonth(eventDate.getMonth());
  const badgeClass = type === "solar" ? "badge-solar" : "badge-lunar";
  const badgeLabel = type === "solar" ? "☀ Solar" : "☽ Lunar";
  const dateDetail =
    type === "solar"
      ? solarDate.split("-").reverse().join("/")
      : `${lunarDate} · ${solarDate.split("-").reverse().join("/")}`;

  return (
    <div
      className={`tl-item ${stateClass}`}
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <div className="tl-date">
        <span className="day">{dd}</span>
        <span className="month">{mm}</span>
      </div>
      <div className="tl-dot" />
      <div className="ev-card">
        <div className="card-icon" title={note || ""}>{icon}</div>
        <div className="card-body">
          <div className="card-name">{name}</div>
          <div className="card-dates">
            <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
            <span>{dateDetail}</span>
            {note && <span style={{ color: "var(--tl-text-mute)" }}>{"·"} {note}</span>}
          </div>
        </div>
        <div className="card-count">{countContent}</div>
      </div>
    </div>
  );
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
