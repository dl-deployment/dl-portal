# Tasks App (`/tasks`)

Task manager with due dates, reminders, repeating tasks, and Telegram notifications.

## Files

```
src/apps/tasks/
├── TasksApp.jsx              # Main component — tabs, form toggle, list
├── tasks.css                  # Scoped under .tasks-app, uses --tk-* variables
├── store.js                   # localStorage CRUD with auto-incrementing IDs
└── components/
    ├── TaskTabs.jsx            # Pending/Completed tab switcher with counts
    ├── TaskForm.jsx            # Create/edit form (title, description, due date, reminders, repeat)
    ├── TaskList.jsx            # Filtered task list based on active tab
    ├── TaskItem.jsx            # Single task row with toggle/edit/delete actions
    └── DataManager.jsx         # Export/import data (JSON)
```

## Data Model (localStorage)

Key: `dl-tasks-data`

```js
{
  tasks: [{
    id: number,
    title: string,              // max 200 chars
    description: string,        // max 1000 chars
    dueAt: string,              // ISO 8601 datetime
    reminders: number[],        // minutes before due (e.g., [15, 60])
    repeat: "none" | "daily" | "weekly",
    completed: boolean,
    reminderSent: boolean,
    createdAt: string,          // ISO 8601
  }],
  nextTaskId: number
}
```

## Default Data

Default tasks loaded from `src/data/tasks-default.json` when localStorage is empty.

## Key Implementation Details

- **Repeating tasks:** When a repeating task is completed, a new task is automatically created with the next due date (daily: +1 day, weekly: +7 days).
- **Reminder tracking:** `reminderSent` flag prevents duplicate notifications. Resets when `dueAt` or `reminders` are changed.
- **Tab-based filtering:** Tasks are displayed in "pending" or "completed" tabs.
- **Confirm on delete:** `window.confirm()` before deletion.
- **DataManager:** Export/import with `nextTaskId` recalculated on import.
- CSS prefix: `.tasks-app`, `.tk-*` classes, `--tk-*` variables.
