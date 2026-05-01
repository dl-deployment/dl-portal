# Tasks App (`/tasks`)

Task manager with due dates, reminders, repeating tasks, and Telegram notifications. Data stored in Supabase via serverless API.

## Files

```
src/apps/tasks/
├── TasksApp.jsx              # Main component — tabs, form toggle, list
├── tasks.css                  # Scoped under .tasks-app, uses --tk-* variables
├── store.js                   # Async DB CRUD via dbApi
└── components/
    ├── TaskTabs.jsx            # Pending/Completed tab switcher with counts
    ├── TaskForm.jsx            # Create/edit form (title, description, due date, reminders, repeat)
    ├── TaskList.jsx            # Filtered task list based on active tab
    └── TaskItem.jsx            # Single task row with toggle/edit/delete actions
```

## Data Model (Supabase)

Table: `tasks`

```
tasks: { id, title, description, due_at, reminders, repeat, completed, reminder_sent, created_at }
```

JS store uses camelCase; DB uses snake_case.

## Key Implementation Details

- **Repeating tasks:** When a repeating task is completed, a new task is automatically created with the next due date (daily: +1 day, weekly: +7 days).
- **Reminder tracking:** `reminderSent` flag prevents duplicate notifications. Resets when `dueAt` or `reminders` are changed.
- **Tab-based filtering:** Tasks are displayed in "pending" or "completed" tabs.
- **Confirm on delete:** `window.confirm()` before deletion.
- **Async store:** All store functions return Promises. ID generation uses `maxId + 1`.
- CSS prefix: `.tasks-app`, `.tk-*` classes, `--tk-*` variables.
