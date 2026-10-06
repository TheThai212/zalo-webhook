import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_PATH = path.join(DATA_DIR, 'processed.json');

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(STORE_PATH, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      await writeFile(STORE_PATH, '[]\n', 'utf8');
    } else {
      throw err;
    }
  }
}

async function loadIds() {
  await ensureStore();
  const raw = await readFile(STORE_PATH, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

async function saveIds(ids) {
  await ensureStore();
  await writeFile(STORE_PATH, `${JSON.stringify([...ids], null, 2)}\n`, 'utf8');
}

export async function hasProcessed(id) {
  const ids = await loadIds();
  return ids.has(String(id));
}

export async function markProcessed(id) {
  const ids = await loadIds();
  ids.add(String(id));
  await saveIds(ids);
}
