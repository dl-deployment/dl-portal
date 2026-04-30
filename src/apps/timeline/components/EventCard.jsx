import { memo } from "react";
import { getViMonth } from "../lunar.js";

const EventCard = memo(function EventCard({ ev, index }) {
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
  } else {
    if (daysLeft <= 7) stateClass = "is-soon";
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
});

export default EventCard;
