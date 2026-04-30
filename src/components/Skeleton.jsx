export default function Skeleton({ variant = "text", count = 1 }) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "card") {
    return (
      <div className="skeleton-grid">
        {items.map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton skeleton-thumb" />
            <div className="skeleton skeleton-line" style={{ width: "80%" }} />
            <div className="skeleton skeleton-line" style={{ width: "50%" }} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "thumbnail") {
    return (
      <div className="skeleton-grid">
        {items.map((i) => (
          <div key={i} className="skeleton skeleton-thumb" />
        ))}
      </div>
    );
  }

  // text variant
  return (
    <div className="skeleton-text">
      {items.map((i) => (
        <div
          key={i}
          className="skeleton skeleton-line"
          style={{ width: `${60 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  );
}
