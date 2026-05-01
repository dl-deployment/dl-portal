import { useState } from "react";

export default function TabBar({ tabs, activeTabId, onSelect, onCreate, onRename, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreate(newName.trim());
    setNewName("");
    setAdding(false);
  }

  function startRename(tab) {
    setEditingId(tab.id);
    setEditName(tab.name);
  }

  function handleRename(e) {
    e.preventDefault();
    if (!editName.trim()) return;
    onRename(editingId, editName.trim());
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setAdding(false);
    setNewName("");
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      cancelEdit();
    }
  }

  return (
    <div className="tab-bar" onKeyDown={handleKeyDown}>
      <div className="tab-list" role="tablist" aria-label="Page groups">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab-item ${tab.id === activeTabId ? "active" : ""}`}
            role="tab"
            aria-selected={tab.id === activeTabId}
            tabIndex={tab.id === activeTabId ? 0 : -1}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(tab.id);
              }
            }}
          >
            {editingId === tab.id ? (
              <form onSubmit={handleRename} className="tab-edit-form">
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => setEditingId(null)}
                  className="tab-edit-input"
                  aria-label="Rename tab"
                />
              </form>
            ) : (
              <>
                <span
                  className="tab-name"
                  onDoubleClick={(e) => { e.stopPropagation(); startRename(tab); }}
                >
                  {tab.name}
                </span>
                {tabs.length > 1 && (
                  <button
                    className="tab-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete tab "${tab.name}"? All pages and posts in this tab will be removed.`)) {
                        onDelete(tab.id);
                      }
                    }}
                    aria-label={`Delete tab ${tab.name}`}
                  >
                    x
                  </button>
                )}
              </>
            )}
          </div>
        ))}

        {adding ? (
          <form onSubmit={handleAdd} className="tab-add-form">
            <input
              autoFocus
              placeholder="Tab name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => { if (!newName.trim()) setAdding(false); }}
              className="tab-add-input"
              aria-label="New tab name"
            />
          </form>
        ) : (
          <button
            className="tab-add-btn"
            onClick={() => setAdding(true)}
            aria-label="Add new tab"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
