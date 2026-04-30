# New Page Development Guide

Quick reference for adding a new page to the portal. For CSS conventions, shared components, and API patterns, see the other docs in this folder.

## The 4 Steps

### Step 1 — Create the app folder

```
src/apps/<name>/
├── <Name>App.jsx       # Main component (scoped CSS class: <name>-app)
├── <name>.css          # Scoped styles under .<name>-app
├── components/         # (optional) sub-components
├── store.js            # (optional) localStorage CRUD
└── api.js              # (optional) API client
```

### Step 2 — Create the page wrapper

```jsx
// src/pages/<Name>Page.jsx
import <Name>App from "../apps/<name>/<Name>App";

export default function <Name>Page() {
  return <<Name>App />;
}
```

### Step 3 — Add the route in `src/App.jsx`

```jsx
import <Name>Page from "./pages/<Name>Page";

// Inside <Routes> inside <Route element={<Layout />}>:
<Route path="<name>" element={<ErrorBoundary><Name>Page /></ErrorBoundary>} />
```

### Step 4 — Register in `src/config/projects.js`

```js
// Add to the projects array:
{
  id: "<name>",
  name: "<Display Name>",
  path: "/<name>",
  icon: "<emoji>",
  description: "<Short description>",
}
```

## App Component Template

```jsx
// src/apps/<name>/<Name>App.jsx
import "./<name>.css";

export default function <Name>App() {
  return (
    <div className="<name>-app">
      {/* Your content here */}
    </div>
  );
}
```

## CSS Template

```css
/* src/apps/<name>/<name>.css */
.<name>-app {
  /* App-specific CSS variables */
  --xx-accent: #6366f1;
  --xx-accent-hover: #818cf8;
  --xx-surface: #1a1a24;
  --xx-surface-hover: #22222e;
  --xx-border: #2a2a3a;
  --xx-text: #a0a0b0;
  --xx-text-bright: #e4e4ef;
  --xx-radius: 10px;

  /* Container defaults */
  max-width: 720px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* All selectors must be scoped under the parent class */
.<name>-app h2 {
  margin: 0 0 1.25rem;
  font-size: 1.3rem;
  color: var(--xx-text-bright);
}
```

## Common State Patterns

### localStorage + useState

```jsx
import * as store from "./store.js";

export default function <Name>App() {
  const [items, setItems] = useState(() => store.getItems());

  function reload() {
    setItems(store.getItems());
  }

  function handleAdd(data) {
    store.createItem(data);
    reload();
  }

  function handleDelete(id) {
    store.deleteItem(id);
    reload();
  }

  return <div className="<name>-app">...</div>;
}
```

### Tab state

```jsx
const [activeTab, setActiveTab] = useState("tab1");
const filtered = items.filter((item) => activeTab === "all" || item.status === activeTab);
```

### Form state

```jsx
const [showForm, setShowForm] = useState(false);
const [editingItem, setEditingItem] = useState(null);

function handleEdit(item) {
  setEditingItem(item);
  setShowForm(true);
}
```

### Confirmation before destructive action

```jsx
function handleDelete(item) {
  if (!window.confirm(`Delete "${item.title}"?`)) return;
  store.deleteItem(item.id);
  reload();
}
```
