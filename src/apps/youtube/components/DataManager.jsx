import { useRef, useState } from "react";
import * as store from "../store.js";

const MAX_IMPORT_SIZE = 5 * 1024 * 1024; // 5MB

export default function DataManager({ onDataChange }) {
  const fileRef = useRef(null);
  const [importError, setImportError] = useState(null);

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

    setImportError(null);

    if (file.size > MAX_IMPORT_SIZE) {
      setImportError("File too large (max 5MB)");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        store.importData(reader.result);
        onDataChange();
      } catch (err) {
        setImportError("Import failed: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="data-manager">
      <button
        className="btn-outline btn-sm"
        onClick={handleExport}
        aria-label="Export data as JSON"
      >
        Export
      </button>
      <button
        className="btn-outline btn-sm"
        onClick={() => fileRef.current?.click()}
        aria-label="Import data from JSON file"
      >
        Import
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="visually-hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      {importError && (
        <div className="error-banner" role="alert">
          {importError}
          <button className="btn-ghost" onClick={() => setImportError(null)}>dismiss</button>
        </div>
      )}
    </div>
  );
}
