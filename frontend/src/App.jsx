import { useEffect, useState } from 'react';
import { api } from './api.js';

const COLUMNS = [
  { id: 'todo', label: 'To do', empty: 'Add a task to start the list.' },
  { id: 'doing', label: 'Doing', empty: 'Move a task here when you start it.' },
  { id: 'done', label: 'Done', empty: 'Finished tasks land here.' },
];

function formatAdded(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function TaskCard({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setNotes(task.notes);
  }, [task.title, task.notes]);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await onUpdate(task.id, { title, notes });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <form className="card card-edit" onSubmit={save}>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required />
        </label>
        <label>
          Notes
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} rows={3} />
        </label>
        <div className="card-actions">
          <button type="submit" disabled={busy || !title.trim()}>Save</button>
          <button type="button" className="ghost" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <article className={`card status-${task.status}`}>
      <h3>{task.title}</h3>
      {task.notes ? <p>{task.notes}</p> : null}
      <p className="meta">Added {formatAdded(task.createdAt)}</p>
      <div className="card-actions">
        <label className="status-label">
          <span className="sr-only">Status for {task.title}</span>
          <select
            value={task.status}
            aria-label={`Status for ${task.title}`}
            onChange={(event) => onUpdate(task.id, { status: event.target.value })}
          >
            <option value="todo">To do</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
          </select>
        </label>
        <button type="button" className="ghost" onClick={() => setEditing(true)}>Edit</button>
        <button type="button" className="ghost danger" onClick={() => onDelete(task)}>Delete</button>
      </div>
    </article>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api.list();
      setTasks(data.tasks);
      setError('');
    } catch (err) {
      setError(err.message === 'Failed to fetch'
        ? 'The API is not running. Start it with npm run dev, then refresh.'
        : err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addTask(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = await api.create({ title, notes });
      setTasks((current) => [data.task, ...current]);
      setTitle('');
      setNotes('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateTask(id, patch) {
    setError('');
    try {
      const data = await api.update(id, patch);
      setTasks((current) => current.map((task) => (task.id === id ? data.task : task)));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete “${task.title}”?`)) return;
    setError('');
    try {
      await api.remove(task.id);
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch (err) {
      setError(err.message);
    }
  }

  const openCount = tasks.filter((task) => task.status !== 'done').length;

  return (
    <main className="page">
      <header className="top">
        <div>
          <h1>Task Manager</h1>
          <p className="lede">A personal board. Each card is a row in SQLite, changed through the API.</p>
        </div>
        <p className="count">{openCount} open</p>
      </header>

      <form className="composer" onSubmit={addTask}>
        <label>
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs doing?"
            maxLength={120}
            required
          />
        </label>
        <label>
          Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional detail"
            maxLength={2000}
            rows={2}
          />
        </label>
        <button type="submit" disabled={saving || !title.trim()}>
          {saving ? 'Adding…' : 'Add task'}
        </button>
      </form>

      {error ? <p className="banner" role="alert">{error}</p> : null}
      {loading ? <p className="loading">Loading tasks…</p> : null}

      <section className="board" aria-label="Task board">
        {COLUMNS.map((column) => {
          const items = tasks.filter((task) => task.status === column.id);
          return (
            <section key={column.id} className="column" aria-labelledby={`${column.id}-heading`}>
              <header>
                <h2 id={`${column.id}-heading`}>{column.label}</h2>
                <span>{items.length}</span>
              </header>
              {items.length === 0 ? <p className="empty">{column.empty}</p> : null}
              {items.map((task) => (
                <TaskCard key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
              ))}
            </section>
          );
        })}
      </section>
    </main>
  );
}
