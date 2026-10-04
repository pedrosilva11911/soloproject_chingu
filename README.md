# Task Manager

A personal task board with a small backend. You add a task, move it from **To do** to **Doing** to **Done**, and the change is stored in SQLite.

This is a finished solo project, sized so one person can plan it, build it, and run it. It is not an account system or a team tool.

## Scope

In this version:

- Create a task with a title and optional notes
- List tasks on a three-column board
- Change status, edit the text, or delete a task
- Keep the data in a SQLite file on the machine running the API

Left out on purpose:

- Accounts and sign-in
- Sharing a board with other people
- Due dates, reminders, and drag-and-drop

## Run it

You need Node.js 22 or newer. SQLite comes with Node, so there is no separate database to install.

```bash
npm install
npm test
npm run dev
```

Open http://127.0.0.1:5173. The API runs at http://127.0.0.1:3001.

To serve the built board and the API from one process:

```bash
npm start
```

Then open http://127.0.0.1:3001.

Tasks are stored in `backend/data/tasks.db`. Delete that file to start over.

## API

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/api/health` | Checks that the API is up |
| `GET` | `/api/tasks` | Lists tasks. Add `?status=todo`, `doing`, or `done` to filter |
| `GET` | `/api/tasks/:id` | Returns one task |
| `POST` | `/api/tasks` | Creates a task. Body: `{ "title": "...", "notes": "..." }` |
| `PATCH` | `/api/tasks/:id` | Updates `title`, `notes`, and/or `status` |
| `DELETE` | `/api/tasks/:id` | Deletes a task |

A task looks like this:

```json
{
  "id": 1,
  "title": "Write the API",
  "notes": "Create, read, update, delete",
  "status": "todo",
  "createdAt": "2026-10-04T12:00:00.000Z",
  "updatedAt": "2026-10-04T12:00:00.000Z"
}
```

Errors use `{ "error": "Title is required" }` and a 400 or 404 status.

## Layout

```
backend/src/db.js       opens SQLite and creates the tasks table
backend/src/tasks.js    checks input and reads or writes rows
backend/src/app.js      HTTP routes
backend/src/index.js    starts the server
backend/src/app.test.js API tests
frontend/               React board that calls /api/tasks
```

The browser never opens the database. It only calls the API.
