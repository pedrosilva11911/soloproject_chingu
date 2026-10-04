import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import {
  createTask,
  deleteTask,
  getTask,
  isStatus,
  listTasks,
  parseCreate,
  parseUpdate,
  updateTask,
} from './tasks.js';

function readId(value) {
  if (!/^\d+$/.test(value)) return null;
  return Number(value);
}

export function createApp(db, { staticDir } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/tasks', (req, res) => {
    const { status } = req.query;
    if (status !== undefined && !isStatus(status)) {
      return res.status(400).json({ error: 'Status must be todo, doing, or done' });
    }
    res.json({ tasks: listTasks(db, status) });
  });

  app.get('/api/tasks/:id', (req, res) => {
    const id = readId(req.params.id);
    if (id === null) return res.status(400).json({ error: 'Invalid task id' });

    const task = getTask(db, id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
  });

  app.post('/api/tasks', (req, res) => {
    const parsed = parseCreate(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    res.status(201).json({ task: createTask(db, parsed.value) });
  });

  app.patch('/api/tasks/:id', (req, res) => {
    const id = readId(req.params.id);
    if (id === null) return res.status(400).json({ error: 'Invalid task id' });

    const parsed = parseUpdate(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const task = updateTask(db, id, parsed.value);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
  });

  app.delete('/api/tasks/:id', (req, res) => {
    const id = readId(req.params.id);
    if (id === null) return res.status(400).json({ error: 'Invalid task id' });
    if (!deleteTask(db, id)) return res.status(404).json({ error: 'Task not found' });
    res.status(204).end();
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((error, _req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    next(error);
  });

  if (staticDir && fs.existsSync(path.join(staticDir, 'index.html'))) {
    app.use(express.static(staticDir));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  return app;
}
