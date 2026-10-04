import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { openDatabase } from './db.js';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = process.env.DB_PATH || path.join(backendRoot, 'data', 'tasks.db');
const frontendDist = path.resolve(backendRoot, '../frontend/dist');
const staticDir = fs.existsSync(path.join(frontendDist, 'index.html')) ? frontendDist : undefined;

const db = openDatabase(dbPath);
const app = createApp(db, { staticDir });
const port = Number(process.env.PORT) || 3001;

app.listen(port, '0.0.0.0', () => {
  const where = staticDir ? 'API and board' : 'API';
  console.log(`${where} listening on port ${port}`);
});
