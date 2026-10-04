import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createApp } from './app.js';
import { openDatabase } from './db.js';

async function withApi(run) {
  const db = openDatabase(':memory:');
  const server = createApp(db).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  try {
    await run(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    db.close();
  }
}

async function send(base, path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { status: response.status, body };
}

test('creates, lists, updates, and deletes a task', async () => {
  await withApi(async (base) => {
    const created = await send(base, '/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: '  Write the API  ', notes: 'CRUD for tasks' }),
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.task.title, 'Write the API');
    assert.equal(created.body.task.status, 'todo');

    const listed = await send(base, '/api/tasks');
    assert.equal(listed.status, 200);
    assert.equal(listed.body.tasks.length, 1);

    const id = created.body.task.id;
    const updated = await send(base, `/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'doing' }),
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.task.status, 'doing');

    const filtered = await send(base, '/api/tasks?status=doing');
    assert.equal(filtered.body.tasks.length, 1);

    const removed = await fetch(`${base}/api/tasks/${id}`, { method: 'DELETE' });
    assert.equal(removed.status, 204);

    const missing = await send(base, `/api/tasks/${id}`);
    assert.equal(missing.status, 404);
  });
});

test('rejects an empty title and an unknown status', async () => {
  await withApi(async (base) => {
    const empty = await send(base, '/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: '   ' }),
    });
    assert.equal(empty.status, 400);
    assert.equal(empty.body.error, 'Title is required');

    const created = await send(base, '/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Ship it' }),
    });
    const badStatus = await send(base, `/api/tasks/${created.body.task.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'later' }),
    });
    assert.equal(badStatus.status, 400);
  });
});
