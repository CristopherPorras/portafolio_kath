const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'portfolio.db');
const db      = new Database(DB_PATH);

// ─── Schema ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS animator (
    id   INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS projects (
    id         TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch())
  );
`);

// ─── Migración desde projects.json ───────────────────────────────────────────
function migrate() {
  const jsonPath = path.join(DATA_DIR, 'projects.json');
  if (!fs.existsSync(jsonPath)) return;

  const count = db.prepare('SELECT COUNT(*) as n FROM animator').get().n;
  if (count > 0) return; // Ya migrado

  try {
    const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    db.prepare('INSERT OR REPLACE INTO animator (id, data) VALUES (1, ?)')
      .run(JSON.stringify(json.animator || {}));

    const insert = db.prepare('INSERT OR IGNORE INTO projects (id, data, sort_order) VALUES (?, ?, ?)');
    db.transaction(projects =>
      projects.forEach((p, i) => insert.run(p.id, JSON.stringify(p), i))
    )(json.projects || []);

    console.log('✓  Datos migrados de projects.json → SQLite');
  } catch (e) {
    console.warn('⚠  No se pudo migrar projects.json:', e.message);
  }
}

migrate();

// ─── Animator ─────────────────────────────────────────────────────────────────
const stmtGetAnimator = db.prepare('SELECT data FROM animator WHERE id = 1');
const stmtSetAnimator = db.prepare('INSERT OR REPLACE INTO animator (id, data) VALUES (1, ?)');

function getAnimator() {
  const row = stmtGetAnimator.get();
  return row ? JSON.parse(row.data) : {};
}

function setAnimator(data) {
  stmtSetAnimator.run(JSON.stringify(data));
}

// ─── Projects ─────────────────────────────────────────────────────────────────
const stmtAllProjects = db.prepare('SELECT data FROM projects ORDER BY sort_order ASC, created_at DESC');
const stmtGetProject  = db.prepare('SELECT data FROM projects WHERE id = ?');
const stmtInsertProj  = db.prepare('INSERT INTO projects (id, data, sort_order) VALUES (?, ?, 0)');
const stmtUpdateProj  = db.prepare('UPDATE projects SET data = ? WHERE id = ?');
const stmtDeleteProj  = db.prepare('DELETE FROM projects WHERE id = ?');
const stmtExistsProj  = db.prepare('SELECT 1 FROM projects WHERE id = ?');

function getProjects()      { return stmtAllProjects.all().map(r => JSON.parse(r.data)); }
function getProject(id)     { const r = stmtGetProject.get(id); return r ? JSON.parse(r.data) : null; }
function existsProject(id)  { return !!stmtExistsProj.get(id); }
function createProject(p)   { stmtInsertProj.run(p.id, JSON.stringify(p)); return p; }
function updateProject(id, p) { stmtUpdateProj.run(JSON.stringify(p), id); return p; }
function deleteProject(id)  { stmtDeleteProj.run(id); }

module.exports = { getAnimator, setAnimator, getProjects, getProject, existsProject, createProject, updateProject, deleteProject };
