import { Link } from "react-router-dom";
import { projects } from "../config/projects";
import { isLoggedIn } from "../lib/auth";

export default function Home() {
  const authed = isLoggedIn();
  const visible = projects.filter((p) => !p.auth || authed);

  return (
    <div>
      <div className="home-header">
        <h1>DL Portal</h1>
        <p>Personal tools and utilities</p>
      </div>
      <div className="projects-grid">
        {visible.map((p) => (
          <Link key={p.id} to={p.path} className="project-card">
            <div className="project-card-icon">{p.icon}</div>
            <div className="project-card-name">{p.name}</div>
            <div className="project-card-desc">{p.description}</div>
            <div className="project-card-arrow">Open &rarr;</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
