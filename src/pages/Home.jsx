import { Link } from "react-router-dom";
import { projects } from "../config/projects";

export default function Home() {
  return (
    <div>
      <div className="home-header">
        <h1>DL Portal</h1>
        <p>Personal tools and utilities</p>
      </div>
      <div className="projects-grid">
        {projects.map((p) => (
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
