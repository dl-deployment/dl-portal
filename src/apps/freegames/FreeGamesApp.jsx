import { useState, useEffect, useCallback } from "react";
import Skeleton from "../../components/Skeleton";
import "./freegames.css";

export default function FreeGamesApp() {
  const [games, setGames] = useState({ epic: [], steam: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/fetch-free-games");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setGames({ epic: data.epic ?? [], steam: data.steam ?? [] });
      if (data.errors?.length) {
        setError(data.errors.map((e) => `${e.store}: ${e.error}`).join("; "));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const totalGames = games.epic.length + games.steam.length;

  return (
    <div className="freegames-app">
      <div className="freegames-header">
        <h2>Free Games</h2>
        <button
          className="freegames-refresh"
          onClick={fetchGames}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <div className="freegames-error">{error}</div>}

      {loading ? (
        <div className="freegames-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} style={{ height: 260, borderRadius: 8 }} />
          ))}
        </div>
      ) : totalGames === 0 ? (
        <div className="freegames-empty">
          No free games found right now. Check back later!
        </div>
      ) : (
        <>
          {games.epic.length > 0 && (
            <GameSection
              title="Epic Games Store"
              badge="EPIC"
              games={games.epic}
            />
          )}
          {games.steam.length > 0 && (
            <GameSection
              title="Steam"
              badge="STEAM"
              games={games.steam}
            />
          )}
        </>
      )}
    </div>
  );
}

function GameSection({ title, badge, games }) {
  return (
    <section className="freegames-section">
      <h3 className="freegames-section-title">
        <span className={`freegames-store-badge freegames-store-${badge.toLowerCase()}`}>
          {badge}
        </span>
        {title}
        <span className="freegames-count">{games.length}</span>
      </h3>
      <div className="freegames-grid">
        {games.map((game) => (
          <GameCard key={game.url} game={game} />
        ))}
      </div>
    </section>
  );
}

function GameCard({ game }) {
  const endDate = game.endDate ? new Date(game.endDate) : null;
  const timeLeft = endDate ? formatTimeLeft(endDate) : null;

  return (
    <a
      className="freegames-card"
      href={game.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="freegames-card-image">
        {game.image ? (
          <img src={game.image} alt={game.title} loading="lazy" />
        ) : (
          <div className="freegames-card-placeholder" />
        )}
        <span className="freegames-free-badge">FREE</span>
      </div>
      <div className="freegames-card-info">
        <div className="freegames-card-title">{game.title}</div>
        <div className="freegames-card-meta">
          {game.originalPrice && (
            <span className="freegames-original-price">
              {game.originalPrice}
            </span>
          )}
          {timeLeft && (
            <span className="freegames-ends">Ends in {timeLeft}</span>
          )}
        </div>
      </div>
    </a>
  );
}

function formatTimeLeft(endDate) {
  const diff = endDate - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}
