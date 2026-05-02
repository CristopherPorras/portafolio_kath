/* ═══════════════════════════════════════════════════
   Panel Admin — Sara Porras
═══════════════════════════════════════════════════ */

// Redirigir automáticamente si no están en el puerto correcto
if (location.port !== '3000') {
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fdf9f7;font-family:Inter,sans-serif;padding:2rem;text-align:center">
      <div>
        <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
        <h2 style="color:#1e1614;margin-bottom:.75rem">Puerto incorrecto</h2>
        <p style="color:#6b5c56;margin-bottom:1.5rem">Estás en <strong>${location.origin}</strong> (Live Server).<br>El panel admin necesita el servidor Node.js.</p>
        <p style="color:#6b5c56;margin-bottom:1.5rem">1. Abre una terminal<br>2. Escribe: <code style="background:#f5eeea;padding:.2rem .5rem;border-radius:4px">cd C:\\Users\\MAC\\Desktop\\Portafolio && node server.js</code><br>3. Luego abre:</p>
        <a href="http://localhost:3000/admin" style="background:#b07280;color:white;padding:.75rem 1.5rem;border-radius:8px;font-weight:600;text-decoration:none">
          Ir a http://localhost:3000/admin
        </a>
      </div>
    </div>`;
  throw new Error('Puerto incorrecto — redirigir manualmente a localhost:3000/admin');
}

// ─── Estado global ──────────────────────────────────────────────────────────
const state = {
  token:          localStorage.getItem('admin_token') || null,
  projects:       [],
  animator:       {},
  currentSection: 'projects',
  editingId:      null,
  thumbUrl:       null,
  mediaUrl:       null,
};

// ─── API ─────────────────────────────────────────────────────────────────────
const api = {
  headers() {
    return { 'Content-Type': 'application/json', 'x-admin-token': state.token };
  },

  // Fetch wrapper: si recibe 401 limpia el token y muestra login
  async _fetch(input, init = {}) {
    const r = await fetch(input, init);
    if (r.status === 401) {
      state.token = null;
      localStorage.removeItem('admin_token');
      $('#app').hidden = true;
      $('#login-screen').hidden = false;
      $('#login-error').textContent = 'Sesión expirada. Vuelve a ingresar.';
      $('#login-error').hidden = false;
      throw new Error('401 Unauthorized');
    }
    return r;
  },

  async login(password) {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 7000);
    try {
      const r = await fetch('/api/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
        signal:  ctrl.signal
      });
      return r.json();
    } finally {
      clearTimeout(tid);
    }
  },

  async logout() {
    await fetch('/api/logout', { method: 'POST', headers: api.headers() });
  },

  async getAnimator()      { return (await api._fetch('/api/animator', { headers: api.headers() })).json(); },
  async saveAnimator(data) {
    return (await api._fetch('/api/animator', { method: 'PUT', headers: api.headers(), body: JSON.stringify(data) })).json();
  },

  async getProjects()      { return (await api._fetch('/api/projects', { headers: api.headers() })).json(); },
  async createProject(p)   {
    return (await api._fetch('/api/projects', { method: 'POST', headers: api.headers(), body: JSON.stringify(p) })).json();
  },
  async updateProject(id, p) {
    return (await api._fetch(`/api/projects/${id}`, { method: 'PUT', headers: api.headers(), body: JSON.stringify(p) })).json();
  },
  async deleteProject(id) {
    return (await api._fetch(`/api/projects/${id}`, { method: 'DELETE', headers: api.headers() })).json();
  },

  async getFiles()         { return (await api._fetch('/api/files', { headers: api.headers() })).json(); },
  async deleteFile(name)   {
    return (await api._fetch(`/api/files/${name}`, { method: 'DELETE', headers: api.headers() })).json();
  },

  async uploadFile(file, onProgress) {
    const fd = new FormData();
    fd.append('file', file);
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');
      xhr.setRequestHeader('x-admin-token', state.token);
      xhr.upload.onprogress = e => e.lengthComputable && onProgress(e.loaded / e.total * 100);
      xhr.onload = () => {
        if (xhr.status === 401) {
          state.token = null;
          localStorage.removeItem('admin_token');
          $('#app').hidden = true;
          $('#login-screen').hidden = false;
          reject(new Error('Sesión expirada'));
        } else {
          resolve(JSON.parse(xhr.responseText));
        }
      };
      xhr.onerror = () => reject(new Error('Error de red'));
      xhr.send(fd);
    });
  }
};

// ─── Utilidades ──────────────────────────────────────────────────────────────
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function toast(msg, type = '') {
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'toast' + (type ? ' ' + type : '');
  el.hidden = false;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.hidden = true; }, 3000);
}

function formatSize(bytes) {
  if (bytes < 1024)       return bytes + ' B';
  if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function isImage(url) { return /\.(jpe?g|png|gif|webp|svg)$/i.test(url); }
function isVideo(url) { return /\.(mp4|mov|webm|avi)$/i.test(url); }

function showSection(name) {
  state.currentSection = name;
  $$('.section').forEach(s => s.classList.remove('active'));
  $(`#section-${name}`).classList.add('active');
  $$('.sidebar-link').forEach(l => {
    l.classList.toggle('active', l.dataset.section === name);
  });
}

// ─── Login ────────────────────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const btn   = $('#login-btn');
  const errEl = $('#login-error');
  btn.disabled = true;
  btn.innerHTML = '<span>Entrando...</span>';
  errEl.hidden  = true;

  const password = $('#password-input').value;

  let res;
  try {
    res = await api.login(password);
  } catch (_) {
    errEl.textContent = '⚠ No se pudo conectar al servidor. Asegúrate de que "node server.js" está corriendo en la terminal.';
    errEl.hidden  = false;
    btn.disabled  = false;
    btn.innerHTML = '<span>Entrar al panel</span>';
    return;
  }

  if (res.error) {
    errEl.textContent = '✕ Contraseña incorrecta. Intenta de nuevo.';
    errEl.hidden  = false;
    btn.disabled  = false;
    btn.innerHTML = '<span>Entrar al panel</span>';
    return;
  }

  state.token = res.token;
  localStorage.setItem('admin_token', res.token);
  showApp();
}

function showApp() {
  $('#login-screen').hidden = true;
  $('#app').hidden = false;
  loadCurrentSection();
}

// ─── Logout ───────────────────────────────────────────────────────────────────
async function handleLogout() {
  await api.logout().catch(() => {});
  state.token = null;
  localStorage.removeItem('admin_token');
  location.reload();
}

// ─── Carga inicial ────────────────────────────────────────────────────────────
function loadCurrentSection() {
  if (state.currentSection === 'projects') loadProjects();
  if (state.currentSection === 'profile')  loadProfile();
  if (state.currentSection === 'files')    loadFiles();
}

// ─── PROYECTOS ────────────────────────────────────────────────────────────────
async function loadProjects() {
  const list = $('#projects-list');
  list.innerHTML = '<div class="loading">Cargando proyectos...</div>';

  const data = await api.getProjects().catch(() => []);
  state.projects = data;
  $('#projects-count').textContent = `${data.length} proyecto${data.length !== 1 ? 's' : ''}`;

  if (!data.length) {
    list.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="9" y1="12" x2="15" y2="12"/><line x1="12" y1="9" x2="12" y2="15"/>
        </svg>
        <h3>Sin proyectos aún</h3>
        <p>Haz clic en "Nuevo proyecto" para comenzar</p>
      </div>`;
    return;
  }

  list.innerHTML = data.map(p => `
    <div class="project-row" data-id="${p.id}">
      <div class="project-row-thumb">
        ${p.thumbnail
          ? `<img src="${escHtml(toAbsUrl(p.thumbnail))}" alt="" loading="lazy">`
          : THUMB_PLACEHOLDER
        }
      </div>
      <div class="project-row-info">
        <div class="project-row-title">${escHtml(p.title)}</div>
        <div class="project-row-meta">${escHtml(p.client || 'Proyecto personal')} · ${p.year || '—'} · ${escHtml(p.duration || '')}</div>
        <div class="project-row-tags">
          ${p.featured ? '<span class="tag featured">Destacado</span>' : ''}
          ${(p.category || []).map(c => `<span class="tag">${escHtml(c)}</span>`).join('')}
        </div>
      </div>
      <div class="project-row-actions">
        <button class="btn-icon" data-action="edit" data-id="${p.id}" title="Editar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-icon danger" data-action="delete" data-id="${p.id}" data-title="${escHtml(p.title)}" title="Eliminar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  // Imágenes rotas → placeholder (sin onerror inline)
  list.querySelectorAll('.project-row-thumb img').forEach(img => {
    img.addEventListener('error', () => {
      img.parentElement.innerHTML = THUMB_PLACEHOLDER;
    });
  });

  // Event delegation para editar / eliminar
  list.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'edit')   openEditProject(btn.dataset.id);
    if (btn.dataset.action === 'delete') confirmDeleteProject(btn.dataset.id, btn.dataset.title);
  });
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Convierte rutas relativas a absolutas para que funcionen desde /admin
function toAbsUrl(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')) return url;
  return '/' + url;
}

const THUMB_PLACEHOLDER = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;

function openNewProject() {
  state.editingId = null;
  state.thumbUrl  = null;
  state.mediaUrl  = null;
  $('#form-title').textContent = 'Nuevo Proyecto';
  resetProjectForm();
  showSection('project-form');
}

function openEditProject(id) {
  const p = state.projects.find(x => x.id === id);
  if (!p) return;
  state.editingId = id;
  state.thumbUrl  = p.thumbnail || null;
  state.mediaUrl  = p.media?.url || null;
  $('#form-title').textContent = 'Editar Proyecto';
  fillProjectForm(p);
  showSection('project-form');
}

function fillProjectForm(p) {
  $('#field-id').value           = p.id;
  $('#field-title').value        = p.title || '';
  $('#field-year').value         = p.year || new Date().getFullYear();
  $('#field-short-desc').value   = p.shortDescription || '';
  $('#field-desc').value         = p.description || '';
  $('#field-client').value       = p.client || '';
  $('#field-duration').value     = p.duration || '';
  $('#field-tools').value        = (p.tools || []).join(', ');
  $('#field-thumbnail').value    = p.thumbnail || '';
  $('#field-featured').checked   = !!p.featured;

  // Categorías
  $$('input[name="category"]').forEach(cb => {
    cb.checked = (p.category || []).includes(cb.value);
  });

  // Media
  const type = p.media?.type || 'video';
  $('#field-media-type').value = type;
  toggleMediaType(type);
  if (type === 'video') {
    $('#field-media-url').value = p.media?.url || '';
  } else {
    $('#field-media-image-url').value = p.media?.url || '';
  }

  // Preview del thumbnail
  if (p.thumbnail) {
    setThumbPreview(p.thumbnail);
  } else {
    clearThumbPreview();
  }
}

function resetProjectForm() {
  $('#project-form').reset();
  $('#field-id').value = '';
  clearThumbPreview();
  clearMediaPreview();
  toggleMediaType('video');
  $('#form-error').hidden = true;
}

function toggleMediaType(type) {
  $('#media-video-section').hidden  = (type !== 'video');
  $('#media-image-section').hidden  = (type !== 'image');
}

function setThumbPreview(url) {
  state.thumbUrl = url;
  $('#thumb-preview').src = toAbsUrl(url);
  $('#thumb-preview').hidden = false;
  $('#thumb-placeholder').hidden = true;
  $('#thumb-clear').hidden = false;
  $('#field-thumbnail').value = url;
}

function clearThumbPreview() {
  state.thumbUrl = null;
  $('#thumb-preview').hidden = true;
  $('#thumb-placeholder').hidden = false;
  $('#thumb-clear').hidden = true;
  $('#thumb-preview').src = '';
  $('#field-thumbnail').value = '';
}

function setMediaPreview(url) {
  state.mediaUrl = url;
  if (isImage(url)) {
    $('#media-preview').src = toAbsUrl(url);
    $('#media-preview').hidden = false;
    $('#media-placeholder').hidden = true;
    $('#media-clear').hidden = false;
  }
  $('#field-media-image-url').value = url;
}

function clearMediaPreview() {
  state.mediaUrl = null;
  $('#media-preview').hidden = true;
  $('#media-placeholder').hidden = false;
  $('#media-clear').hidden = true;
  $('#media-preview').src = '';
  $('#field-media-image-url').value = '';
}

async function handleProjectFormSubmit(e) {
  e.preventDefault();
  const errEl  = $('#form-error');
  const btn    = $('#btn-save-project');
  errEl.hidden = true;

  const categories = [...$$('input[name="category"]:checked')].map(c => c.value);
  if (!categories.length) {
    errEl.textContent = 'Selecciona al menos una categoría.';
    errEl.hidden = false;
    return;
  }

  const mediaType = $('#field-media-type').value;
  const mediaUrl  = mediaType === 'video'
    ? $('#field-media-url').value.trim()
    : ($('#field-media-image-url').value.trim() || state.mediaUrl || '');

  const thumbnail = $('#field-thumbnail').value.trim() || state.thumbUrl || '';

  const project = {
    title:            $('#field-title').value.trim(),
    year:             parseInt($('#field-year').value) || new Date().getFullYear(),
    shortDescription: $('#field-short-desc').value.trim(),
    description:      $('#field-desc').value.trim(),
    client:           $('#field-client').value.trim(),
    duration:         $('#field-duration').value.trim(),
    tools:            $('#field-tools').value.split(',').map(t => t.trim()).filter(Boolean),
    category:         categories,
    featured:         $('#field-featured').checked,
    thumbnail,
    media:            { type: mediaType, url: mediaUrl }
  };

  btn.disabled = true;
  btn.innerHTML = '<span>Guardando...</span>';

  let res;
  if (state.editingId) {
    res = await api.updateProject(state.editingId, project).catch(err => ({ error: err.message }));
  } else {
    res = await api.createProject(project).catch(err => ({ error: err.message }));
  }

  btn.disabled = false;
  btn.innerHTML = '<span>Guardar proyecto</span>';

  if (res.error) {
    errEl.textContent = res.error;
    errEl.hidden = false;
    return;
  }

  toast(state.editingId ? '✓ Proyecto actualizado' : '✓ Proyecto creado', 'success');
  showSection('projects');
  loadProjects();
}

async function confirmDeleteProject(id, title) {
  if (!confirm(`¿Eliminar el proyecto "${title}"?\n\nEsta acción no se puede deshacer.`)) return;
  const res = await api.deleteProject(id).catch(() => ({ error: 'Error al eliminar' }));
  if (res.error) { toast(res.error, 'error'); return; }
  toast('✓ Proyecto eliminado', 'success');
  loadProjects();
}

// ─── PERFIL ───────────────────────────────────────────────────────────────────
async function loadProfile() {
  const data = await api.getAnimator().catch(() => ({}));
  state.animator = data;

  $('#p-name').value      = data.name       || '';
  $('#p-title').value     = data.title      || '';
  $('#p-tagline').value   = data.tagline    || '';
  $('#p-bio').value       = data.bio        || '';
  $('#p-email').value     = data.email      || '';
  $('#p-location').value  = data.location   || '';
  $('#p-experience').value= data.experience_years || '';
  $('#p-available').value = String(data.available ?? true);

  const s = data.social || {};
  $('#p-linkedin').value   = s.linkedin   || '';
  $('#p-vimeo').value      = s.vimeo      || '';
  $('#p-instagram').value  = s.instagram  || '';
  $('#p-artstation').value = s.artstation || '';

  renderSkills(data.skills || []);
}

function renderSkills(skills) {
  const container = $('#skills-list');
  container.innerHTML = skills.map((sk, i) => `
    <div class="skill-row" data-skill="${i}">
      <input type="text" class="skill-category" value="${escHtml(sk.category)}" placeholder="Categoría (ej: Animación 2D)">
      <input type="text" class="skill-tools" value="${escHtml((sk.tools || []).join(', '))}" placeholder="Herramientas separadas por coma">
      <button type="button" class="btn-icon danger" onclick="removeSkill(${i})" title="Eliminar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `).join('');
}

function addSkill() {
  const rows = $$('.skill-row');
  const newIdx = rows.length;
  const container = $('#skills-list');
  const row = document.createElement('div');
  row.className = 'skill-row';
  row.dataset.skill = newIdx;
  row.innerHTML = `
    <input type="text" class="skill-category" placeholder="Categoría (ej: Animación 2D)">
    <input type="text" class="skill-tools" placeholder="Herramientas separadas por coma">
    <button type="button" class="btn-icon danger" onclick="removeSkill(${newIdx})" title="Eliminar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  container.appendChild(row);
}

function removeSkill(idx) {
  const row = $(`.skill-row[data-skill="${idx}"]`);
  if (row) row.remove();
}

function collectSkills() {
  return [...$$('.skill-row')].map(row => ({
    category: row.querySelector('.skill-category').value.trim(),
    tools:    row.querySelector('.skill-tools').value.split(',').map(t => t.trim()).filter(Boolean)
  })).filter(s => s.category);
}

async function handleProfileSubmit(e) {
  e.preventDefault();
  const btn    = $('#btn-save-profile');
  const msgEl  = $('#profile-msg');
  btn.disabled = true;
  btn.innerHTML = '<span>Guardando...</span>';
  msgEl.hidden = true;

  const payload = {
    name:             $('#p-name').value.trim(),
    title:            $('#p-title').value.trim(),
    tagline:          $('#p-tagline').value.trim(),
    bio:              $('#p-bio').value.trim(),
    email:            $('#p-email').value.trim(),
    location:         $('#p-location').value.trim(),
    experience_years: parseInt($('#p-experience').value) || 0,
    available:        $('#p-available').value === 'true',
    social: {
      linkedin:   $('#p-linkedin').value.trim(),
      vimeo:      $('#p-vimeo').value.trim(),
      instagram:  $('#p-instagram').value.trim(),
      artstation: $('#p-artstation').value.trim(),
    },
    skills: collectSkills()
  };

  const res = await api.saveAnimator(payload).catch(err => ({ error: err.message }));
  btn.disabled = false;
  btn.innerHTML = '<span>Guardar perfil</span>';

  if (res.error) { toast(res.error, 'error'); return; }
  msgEl.textContent = '✓ Perfil guardado correctamente';
  msgEl.hidden = false;
  toast('✓ Perfil actualizado', 'success');
  setTimeout(() => { msgEl.hidden = true; }, 4000);
}

// ─── ARCHIVOS ─────────────────────────────────────────────────────────────────
async function loadFiles() {
  const grid = $('#files-grid');
  grid.innerHTML = '<div class="loading">Cargando archivos...</div>';

  const files = await api.getFiles().catch(() => []);
  $('#files-count').textContent = `${files.length} archivo${files.length !== 1 ? 's' : ''}`;

  if (!files.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <h3>Sin archivos subidos</h3>
        <p>Sube imágenes o videos para usarlos en tus proyectos</p>
      </div>`;
    return;
  }

  grid.innerHTML = files.map(f => {
    const img = isImage(f.url);
    const vid = isVideo(f.url);
    return `
      <div class="file-card" data-filename="${escHtml(f.filename)}" data-url="${escHtml(f.url)}">
        <div class="file-card-thumb">
          ${img
            ? `<img src="${escHtml(toAbsUrl(f.url))}" alt="" loading="lazy">`
            : vid
              ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>`
              : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`
          }
        </div>
        <div class="file-card-info">
          <div class="file-card-name" title="${escHtml(f.filename)}">${escHtml(f.filename)}</div>
          <div class="file-card-meta">${formatSize(f.size)}</div>
          <div class="file-card-actions">
            <button data-action="copy-url">Copiar URL</button>
            <button data-action="delete-file">Eliminar</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Event delegation para archivos
  grid.addEventListener('click', e => {
    const btn  = e.target.closest('[data-action]');
    if (!btn) return;
    const card = btn.closest('[data-filename]');
    if (!card) return;
    if (btn.dataset.action === 'copy-url')    copyUrl(card.dataset.url);
    if (btn.dataset.action === 'delete-file') confirmDeleteFile(card.dataset.filename);
  });
}

async function handleGlobalUpload(e) {
  const files = [...e.target.files];
  if (!files.length) return;

  const progress  = $('#upload-progress');
  const fill      = $('#progress-fill');
  const text      = $('#progress-text');
  progress.hidden = false;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    text.textContent = `Subiendo ${i + 1}/${files.length}: ${file.name}`;
    await api.uploadFile(file, pct => { fill.style.width = pct + '%'; })
      .catch(err => toast(err.message, 'error'));
    fill.style.width = '100%';
  }

  e.target.value = '';
  setTimeout(() => {
    progress.hidden = true;
    fill.style.width = '0%';
  }, 500);

  toast(`✓ ${files.length} archivo${files.length > 1 ? 's' : ''} subido${files.length > 1 ? 's' : ''}`, 'success');
  loadFiles();
}

async function confirmDeleteFile(filename) {
  if (!confirm(`¿Eliminar el archivo "${filename}"?`)) return;
  const res = await api.deleteFile(filename).catch(() => ({ error: 'Error al eliminar' }));
  if (res.error) { toast(res.error, 'error'); return; }
  toast('✓ Archivo eliminado', 'success');
  loadFiles();
}

function copyUrl(url) {
  navigator.clipboard.writeText(url)
    .then(() => toast('✓ URL copiada al portapapeles', 'success'))
    .catch(() => toast('No se pudo copiar', 'error'));
}

// ─── Upload helpers para el formulario ───────────────────────────────────────
async function uploadFormFile(file, onSuccess) {
  try {
    const res = await api.uploadFile(file, () => {});
    onSuccess(res.url);
    toast('✓ Archivo subido', 'success');
  } catch (err) {
    toast('Error al subir: ' + err.message, 'error');
  }
}

// ─── Inicialización ───────────────────────────────────────────────────────────
function init() {
  $('#login-form').addEventListener('submit', handleLogin);

  // Logout
  $('#logout-btn').addEventListener('click', handleLogout);

  // Navegación del sidebar
  $$('.sidebar-link').forEach(btn => {
    btn.addEventListener('click', () => {
      showSection(btn.dataset.section);
      loadCurrentSection();
    });
  });

  // Botón nuevo proyecto
  $('#btn-new-project').addEventListener('click', openNewProject);

  // Cancelar formulario
  $('#btn-cancel-form').addEventListener('click', () => { showSection('projects'); loadProjects(); });
  $('#btn-cancel-form-2').addEventListener('click', () => { showSection('projects'); loadProjects(); });

  // Submit proyecto
  $('#project-form').addEventListener('submit', handleProjectFormSubmit);

  // Tipo de media
  $('#field-media-type').addEventListener('change', e => toggleMediaType(e.target.value));

  // Thumbnail — subir archivo
  $('#thumb-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setThumbPreview(preview);
    await uploadFormFile(file, url => setThumbPreview(url));
    e.target.value = '';
  });

  // Thumbnail — URL manual
  $('#field-thumbnail').addEventListener('input', e => {
    const url = e.target.value.trim();
    if (url) setThumbPreview(url);
    else clearThumbPreview();
  });

  // Thumbnail — quitar
  $('#thumb-clear').addEventListener('click', clearThumbPreview);

  // Media imagen — subir archivo
  $('#media-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setMediaPreview(preview);
    await uploadFormFile(file, url => setMediaPreview(url));
    e.target.value = '';
  });

  // Media imagen — URL manual
  $('#field-media-image-url').addEventListener('input', e => {
    const url = e.target.value.trim();
    if (url) setMediaPreview(url);
    else clearMediaPreview();
  });

  // Media — quitar
  $('#media-clear').addEventListener('click', clearMediaPreview);

  // Perfil
  $('#profile-form').addEventListener('submit', handleProfileSubmit);
  $('#btn-add-skill').addEventListener('click', addSkill);

  // Subida global de archivos
  $('#global-file-input').addEventListener('change', handleGlobalUpload);

  // ¿Ya hay sesión activa?
  if (state.token) {
    // Verificar que el token sigue siendo válido
    api.getAnimator().then(data => {
      if (data.error) {
        state.token = null;
        localStorage.removeItem('admin_token');
      } else {
        showApp();
      }
    }).catch(() => {
      // servidor no disponible
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Avisar si no están en el puerto correcto
  if (location.port !== '3000') {
    const w = document.getElementById('wrong-port-warning');
    if (w) w.hidden = false;
  }
  init();
});

// removeSkill sigue siendo llamada desde HTML del formulario de perfil
window.removeSkill = removeSkill;
