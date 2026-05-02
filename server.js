const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');
const db      = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Configuración ───────────────────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'linda2024';
const UPLOAD_DIR     = process.env.UPLOAD_DIR || path.join(__dirname, 'assets', 'projects');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ─── Auth tokens en memoria ───────────────────────────────────────────────────
const tokens = new Set();

function requireAuth(req, res, next) {
  if (!tokens.has(req.headers['x-admin-token']))
    return res.status(401).json({ error: 'No autorizado' });
  next();
}

// ─── Multer ───────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpe?g|png|gif|webp|svg|mp4|mov|webm|avi)$/i;
    cb(null, allowed.test(file.originalname));
  }
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  const token = crypto.randomBytes(32).toString('hex');
  tokens.add(token);
  res.json({ token });
});

app.post('/api/logout', requireAuth, (req, res) => {
  tokens.delete(req.headers['x-admin-token']);
  res.json({ ok: true });
});

// ─── Sync SQLite → projects.json (para el frontend público) ──────────────────
const JSON_PATH = path.join(__dirname, 'data', 'projects.json');

function syncJson() {
  try {
    // Preservar las categorías existentes del JSON (no están en SQLite)
    let categories = [];
    if (fs.existsSync(JSON_PATH)) {
      try { categories = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8')).categories || []; } catch (_) {}
    }
    const payload = { animator: db.getAnimator(), categories, projects: db.getProjects() };
    fs.writeFileSync(JSON_PATH, JSON.stringify(payload, null, 2), 'utf8');
  } catch (e) {
    console.warn('⚠  No se pudo sincronizar projects.json:', e.message);
  }
}

// ─── Animator ─────────────────────────────────────────────────────────────────
app.get('/api/animator', (_req, res) => res.json(db.getAnimator()));

app.put('/api/animator', requireAuth, (req, res) => {
  const updated = { ...db.getAnimator(), ...req.body };
  db.setAnimator(updated);
  syncJson();
  res.json(updated);
});

// ─── Projects ─────────────────────────────────────────────────────────────────
app.get('/api/projects', (_req, res) => res.json(db.getProjects()));

app.post('/api/projects', requireAuth, (req, res) => {
  const project = { id: `proj-${Date.now()}`, ...req.body };
  db.createProject(project);
  syncJson();
  res.json(project);
});

app.put('/api/projects/:id', requireAuth, (req, res) => {
  if (!db.existsProject(req.params.id))
    return res.status(404).json({ error: 'Proyecto no encontrado' });
  const updated = { ...db.getProject(req.params.id), ...req.body };
  db.updateProject(req.params.id, updated);
  syncJson();
  res.json(updated);
});

app.delete('/api/projects/:id', requireAuth, (req, res) => {
  if (!db.existsProject(req.params.id))
    return res.status(404).json({ error: 'Proyecto no encontrado' });
  db.deleteProject(req.params.id);
  syncJson();
  res.json({ ok: true });
});

// ─── Archivos ─────────────────────────────────────────────────────────────────
app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });
  res.json({
    url:          `/assets/projects/${req.file.filename}`,
    filename:     req.file.filename,
    originalname: req.file.originalname,
    size:         req.file.size
  });
});

app.get('/api/files', requireAuth, (_req, res) => {
  const files = fs.readdirSync(UPLOAD_DIR)
    .filter(f => !f.startsWith('.'))
    .map(f => {
      const stat = fs.statSync(path.join(UPLOAD_DIR, f));
      return { filename: f, url: `/assets/projects/${f}`, size: stat.size, mtime: stat.mtime };
    })
    .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
  res.json(files);
});

app.delete('/api/files/:filename', requireAuth, (req, res) => {
  const fp = path.join(UPLOAD_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(fp)) return res.status(404).json({ error: 'Archivo no encontrado' });
  fs.unlinkSync(fp);
  res.json({ ok: true });
});

// ─── Panel Admin ──────────────────────────────────────────────────────────────
app.get('/admin', (_req, res) =>
  res.sendFile(path.join(__dirname, 'admin', 'index.html'))
);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✨  Portafolio: http://localhost:${PORT}`);
  console.log(`🔑  Panel Admin: http://localhost:${PORT}/admin`);
  console.log(`    Contraseña: ${ADMIN_PASSWORD}\n`);
  // Sincronizar SQLite → projects.json al arrancar
  syncJson();
  console.log('✓  projects.json sincronizado con la base de datos\n');
});
