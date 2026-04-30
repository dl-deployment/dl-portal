import { NavLink, Outlet, useLocation } from "react-router-dom";
import { projects } from "../config/projects";
import { useState, useEffect, useCallback } from "react";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && sidebarOpen) {
        closeSidebar();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen, closeSidebar]);

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <NavLink to="/" className="sidebar-brand" onClick={closeSidebar}>
          DL Portal
        </NavLink>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {projects.map((p) => (
            <NavLink
              key={p.id}
              to={p.path}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              onClick={closeSidebar}
            >
              <span className="sidebar-icon" aria-hidden="true">{p.icon}</span>
              <span className="sidebar-label">{p.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <button
        className={`sidebar-toggle ${sidebarOpen ? "shifted" : ""}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        aria-expanded={sidebarOpen}
      >
        <span />
        <span />
        <span />
      </button>

      <main className={`main-content ${isHome ? "home" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}
