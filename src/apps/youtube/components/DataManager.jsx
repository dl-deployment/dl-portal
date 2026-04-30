import { useRef } from "react";
import * as store from "../store.js";

export default function DataManager({ onDataChange }) {
  const fileRef = useRef(null);

  function handleExport() {
    const json = store.exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dl-youtube-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        store.importData(reader.result);
        onDataChange();
      } catch (err) {
        alert("Import failed: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="data-manager">
      <button className="btn-outline btn-sm" onClick={handleExport} title="Export data as JSON">
        Export
      </button>
      <button className="btn-outline btn-sm" onClick={() => fileRef.current?.click()} title="Import data from JSON">
        Import
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: "none" }}
      />
    </div>
  );
}
