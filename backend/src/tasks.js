const STATUSES = new Set(['todo', 'doing', 'done']);
const TITLE_MAX = 120;
const NOTES_MAX = 2000;

export function isStatus(value) {
  return STATUSES.has(value);
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : null;
}

export function parseCreate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Expected a JSON object' };
  }

  const title = cleanText(body.title);
  const notes = body.notes === undefined ? '' : cleanText(body.notes);

  if (!title) return { error: 'Title is required' };
  if (title.length > TITLE_MAX) {
    return { error: `Title must be ${TITLE_MAX} characters or fewer` };
  }
  if (notes === null) return { error: 'Notes must be text' };
  if (notes.length > NOTES_MAX) {
    return { error: `Notes must be ${NOTES_MAX} characters or fewer` };
  }

  return { value: { title, notes } };
}

export function parseUpdate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Expected a JSON object' };
  }

  const patch = {};

  if ('title' in body) {
    const title = cleanText(body.title);
    if (!title) return { error: 'Title is required' };
    if (title.length > TITLE_MAX) {
      return { error: `Title must be ${TITLE_MAX} characters or fewer` };
    }
    patch.title = title;
  }

  if ('notes' in body) {
    const notes = cleanText(body.notes);
    if (notes === null) return { error: 'Notes must be text' };
    if (notes.length > NOTES_MAX) {
      return { error: `Notes must be ${NOTES_MAX} characters or fewer` };
    }
    patch.notes = notes;
  }

  if ('status' in body) {
    if (!isStatus(body.status)) {
      return { error: 'Status must be todo, doing, or done' };
    }
    patch.status = body.status;
  }

  if (Object.keys(patch).length === 0) {
    return { error: 'Nothing to update' };
  }

  return { value: patch };
}

function toTask(row) {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listTasks(db, status) {
  const sql = status
    ? 'SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC'
    : 'SELECT * FROM tasks ORDER BY created_at DESC';
  const statement = db.prepare(sql);
  const rows = status ? statement.all(status) : statement.all();
  return rows.map(toTask);
}

export function getTask(db, id) {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  return row ? toTask(row) : null;
}

export function createTask(db, input) {
  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO tasks (title, notes, status, created_at, updated_at)
    VALUES (?, ?, 'todo', ?, ?)
  `).run(input.title, input.notes, now, now);

  return getTask(db, Number(result.lastInsertRowid));
}

export function updateTask(db, id, patch) {
  const existing = getTask(db, id);
  if (!existing) return null;

  const next = {
    title: patch.title ?? existing.title,
    notes: patch.notes ?? existing.notes,
    status: patch.status ?? existing.status,
    updatedAt: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE tasks
    SET title = ?, notes = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(next.title, next.notes, next.status, next.updatedAt, id);

  return getTask(db, id);
}

export function deleteTask(db, id) {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return result.changes > 0;
}
