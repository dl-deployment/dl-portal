import { NavLink, Outlet, useLocation } from "react-router-dom";
import { projects } from "../config/projects";
import { useState } from "react";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <NavLink to="/" className="sidebar-brand" onClick={() => setSidebarOpen(false)}>
          DL Portal
        </NavLink>
        <nav className="sidebar-nav">
          {projects.map((p) => (
            <NavLink
              key={p.id}
              to={p.path}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar-icon">{p.icon}</span>
              <span className="sidebar-label">{p.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <button
        className={`sidebar-toggle ${sidebarOpen ? "shifted" : ""}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
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
