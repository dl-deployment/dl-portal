import { NavLink, Outlet, useLocation } from "react-router-dom";
import { projects } from "../config/projects";
import { isLoggedIn, login, logout } from "../lib/auth";
import { useState, useEffect, useCallback } from "react";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authed, setAuthed] = useState(() => isLoggedIn());
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

  const publicPages = projects.filter((p) => !p.auth);
  const authPages = projects.filter((p) => p.auth);

  function handleLogin() {
    const pwd = window.prompt("Password:");
    if (pwd && login(pwd)) {
      setAuthed(true);
    } else if (pwd) {
      window.alert("Wrong password");
    }
  }

  function handleLogout() {
    logout();
    setAuthed(false);
  }

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <NavLink to="/" className="sidebar-brand" onClick={closeSidebar}>
          DL Portal
        </NavLink>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {publicPages.map((p) => (
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

          {authed && authPages.length > 0 && (
            <>
              <div className="sidebar-divider" />
              {authPages.map((p) => (
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
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {authed ? (
            <button className="sidebar-auth-btn" onClick={handleLogout}>
              🔓 Logout
            </button>
          ) : (
            <button className="sidebar-auth-btn" onClick={handleLogin}>
              🔒 Login
            </button>
          )}
        </div>
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
