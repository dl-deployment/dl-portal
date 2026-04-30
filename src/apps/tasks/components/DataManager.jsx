import { useRef, useState } from "react";
import * as store from "../store.js";

const MAX_IMPORT_SIZE = 5 * 1024 * 1024;

export default function DataManager({ onDataChange }) {
  const fileRef = useRef(null);
  const [importError, setImportError] = useState(null);

  function handleExport() {
    const json = store.exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dl-tasks-backup.json";
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
    <div className="tk-data-manager">
      <button className="btn btn-ghost tk-btn-sm" onClick={handleExport}>
        Export
      </button>
      <button className="btn btn-ghost tk-btn-sm" onClick={() => fileRef.current?.click()}>
        Import
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: "none" }}
        tabIndex={-1}
      />
      {importError && (
        <div className="tk-error">
          <span>{importError}</span>
          <button onClick={() => setImportError(null)}>&times;</button>
        </div>
      )}
    </div>
  );
}
