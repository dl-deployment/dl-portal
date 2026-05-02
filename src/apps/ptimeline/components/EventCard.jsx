import { memo } from "react";
import { getViMonth } from "../../timeline/lunar.js";

const EventCard = memo(function EventCard({ ev, index, onEdit, onDelete }) {
  const { name, solarDate, lunarDate, type, icon, note, eventDate, daysLeft } = ev;

  let stateClass = "";
  let countContent;

  if (daysLeft === 0) {
    stateClass = "is-today";
    countContent = (
      <>
        <div className="pt-count-num pt-today-tag">{"\u{1F389}"}</div>
        <span className="pt-count-label">Today!</span>
      </>
    );
  } else {
    if (daysLeft <= 7) stateClass = "is-soon";
    countContent = (
      <>
        <div className="pt-count-num">{daysLeft}</div>
        <span className="pt-count-label">days</span>
      </>
    );
  }

  const dd = eventDate.getDate().toString().padStart(2, "0");
  const mm = getViMonth(eventDate.getMonth());
  const badgeClass = type === "solar" ? "pt-badge-solar" : "pt-badge-lunar";
  const badgeLabel = type === "solar" ? "☀ Solar" : "☽ Lunar";
  const dateDetail =
    type === "solar"
      ? solarDate.split("-").reverse().join("/")
      : `${lunarDate} · ${solarDate.split("-").reverse().join("/")}`;

  return (
    <div className={`pt-item ${stateClass}`} style={{ animationDelay: `${index * 0.07}s` }}>
      <div className="pt-date">
        <span className="day">{dd}</span>
        <span className="month">{mm}</span>
      </div>
      <div className="pt-dot" />
      <div className="pt-card">
        <div className="pt-card-icon" title={note || ""}>{icon}</div>
        <div className="pt-card-body">
          <div className="pt-card-name">{name}</div>
          <div className="pt-card-dates">
            <span className={`pt-badge ${badgeClass}`}>{badgeLabel}</span>
            <span>{dateDetail}</span>
            {note && <span style={{ color: "var(--pt-text-mute)" }}>{"·"} {note}</span>}
          </div>
        </div>
        <div className="pt-card-count">{countContent}</div>
        <div className="pt-card-actions">
          <button className="pt-action-btn" onClick={() => onEdit(ev)} title="Edit">✏️</button>
          <button className="pt-action-btn pt-action-del" onClick={() => onDelete(ev)} title="Delete">🗑️</button>
        </div>
      </div>
    </div>
  );
});

export default EventCard;
