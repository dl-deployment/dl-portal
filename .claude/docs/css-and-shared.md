# CSS & Shared Components

## Global CSS Variables

Defined in `src/index.css` — available to all apps. Use these instead of hardcoding values.

```css
/* Colors */
--bg: #0f0f13;            --bg-card: #1a1a24;
--bg-sidebar: #14141c;    --bg-hover: #22222e;
--text: #a0a0b0;          --text-bright: #e4e4ef;
--accent: #6366f1;        --accent-hover: #818cf8;
--border: #2a2a3a;         --radius: 10px;
--success: #22c55e;       --danger: #ef4444;       --warning: #f59e0b;

/* Layout */
--sidebar-width: 220px;
--font: "Inter", system-ui, -apple-system, sans-serif;
```

## Shared Button Classes

Available globally in `src/index.css`. Never redefine these.

| Class | Appearance |
|-------|-----------|
| `.btn` | Base (flex, padding, border-radius, transitions) |
| `.btn-primary` | Accent background, white text |
| `.btn-danger` | Red background |
| `.btn-ghost` | Transparent, text color only |
| `.btn-outline` | Transparent with border |
| `.btn-sm` | Smaller padding |

All buttons support `:disabled` (opacity 0.5).

```jsx
<button className="btn btn-primary">Save</button>
<button className="btn btn-ghost btn-sm">Cancel</button>
```

## Skeleton Loading Classes

For async content placeholders. Defined in `src/index.css`.

| Class | Use |
|-------|-----|
| `.skeleton` | Base with pulse animation |
| `.skeleton-line` | Text placeholder (14px height) |
| `.skeleton-thumb` | Image placeholder (16:9 ratio) |
| `.skeleton-grid` | Auto-fill grid layout |
| `.skeleton-card` | Card with border and structure |

```jsx
<div className="skeleton-grid">
  {[1, 2, 3].map(i => (
    <div key={i} className="skeleton-card">
      <div className="skeleton skeleton-thumb" />
      <div className="skeleton-text">
        <div className="skeleton skeleton-line" style={{ width: "60%" }} />
        <div className="skeleton skeleton-line" style={{ width: "40%" }} />
      </div>
    </div>
  ))}
</div>
```

## Shared Components

### ErrorBoundary (`src/components/ErrorBoundary.jsx`)

Wraps each route. Catches render errors and shows a retry button.

```jsx
<Route path="<name>" element={<ErrorBoundary><Name>Page /></ErrorBoundary>} />
```

### Layout (`src/components/Layout.jsx`)

Sidebar navigation + main content area. Nav links are auto-populated from `projects.js`. No need to modify this when adding a page.

## Layout Structure

```
<div class="layout">
  <aside class="sidebar">...</aside>
  <main class="main-content">  <!-- auto-padded, margin-left: sidebar-width -->
    <Outlet />             <!-- your page renders here -->
  </main>
</div>
```

- `.main-content` has `padding: 32px 40px` (desktop), `padding: 60px 16px 20px` (mobile).
- Mobile: sidebar hidden behind hamburger toggle, overlay on open.
- The sidebar is `position: fixed` with `height: 100vh`.