export default function TaskTabs({ activeTab, onTabChange, pendingCount, completedCount }) {
  return (
    <div className="tk-tabs">
      <button
        className={`tk-tab ${activeTab === "pending" ? "tk-tab--active" : ""}`}
        onClick={() => onTabChange("pending")}
      >
        Pending
        {pendingCount > 0 && <span className="tk-tab-badge">{pendingCount}</span>}
      </button>
      <button
        className={`tk-tab ${activeTab === "completed" ? "tk-tab--active" : ""}`}
        onClick={() => onTabChange("completed")}
      >
        Completed
        {completedCount > 0 && <span className="tk-tab-badge">{completedCount}</span>}
      </button>
    </div>
  );
}
