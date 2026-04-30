/**
 * PROJECTS MODULE — Animation Portfolio
 * Project Conductor: Agente Código
 *
 * Handles: rendering project grid, filter system, modal viewer.
 * Architecture: reads from DataLoader, renders to DOM, opens modal on click.
 */

import DataLoader from './data.js';
import Modal from './modal.js';

const Projects = (() => {
  const selectors = {
    filtersContainer: '.work-filters',
    grid:             '.projects-grid',
  };

  let currentFilter = 'all';

  function init() {
    const grid = document.querySelector(selectors.grid);
    const filtersContainer = document.querySelector(selectors.filtersContainer);
    if (!grid) return;

    try {
      const categories = DataLoader.getCategories();
      const projects   = DataLoader.getProjects();

      _renderFilters(filtersContainer, categories);
      _renderProjects(grid, projects);
      _setupObserver(grid);
    } catch (err) {
      console.error('[Projects] Render failed:', err);
    }
  }

  /* ---------- FILTERS ---------- */

  function _renderFilters(container, categories) {
    if (!container) return;
    container.innerHTML = '';

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn' + (cat.id === 'all' ? ' active' : '');
      btn.textContent = cat.label;
      btn.dataset.filter = cat.id;
      btn.addEventListener('click', () => _applyFilter(cat.id));
      container.appendChild(btn);
    });
  }

  function _applyFilter(categoryId) {
    if (categoryId === currentFilter) return;
    currentFilter = categoryId;

    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === categoryId);
    });

    // Show/hide cards
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
      const categories = (card.dataset.categories || '').split(',');
      const visible = categoryId === 'all' || categories.includes(categoryId);

      if (visible) {
        card.classList.remove('hidden');
        card.classList.add('fade-in');
        setTimeout(() => card.classList.remove('fade-in'), 350);
      } else {
        card.classList.add('hidden');
      }
    });

    // Check if no results
    _checkNoResults();
  }

  function _checkNoResults() {
    const grid = document.querySelector(selectors.grid);
    let noResults = grid.querySelector('.no-results');

    const visible = [...grid.querySelectorAll('.project-card')].filter(
      c => !c.classList.contains('hidden')
    );

    if (visible.length === 0) {
      if (!noResults) {
        noResults = document.createElement('p');
        noResults.className = 'no-results';
        noResults.textContent = 'No projects in this category yet.';
        grid.appendChild(noResults);
      }
    } else if (noResults) {
      noResults.remove();
    }
  }

  /* ---------- GRID RENDER ---------- */

  function _renderProjects(grid, projects) {
    grid.innerHTML = '';

    projects.forEach(project => {
      const card = _buildCard(project);
      grid.appendChild(card);
    });
  }

  function _buildCard(project) {
    const card = document.createElement('article');
    card.className = 'project-card reveal' + (project.featured ? ' featured' : '');
    card.dataset.id = project.id;
    card.dataset.categories = project.category.join(',');
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View project: ${project.title}`);

    const primaryTag = project.category[0];
    const additionalTags = project.category.slice(1);

    card.innerHTML = `
      <div class="project-card-media">
        ${_buildMediaElement(project)}
        <div class="project-play-btn" aria-hidden="true">
          <div class="play-circle">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
      <div class="project-card-body">
        <div class="project-meta">
          <span class="project-year">${project.year}</span>
          <div class="project-tags">
            <span class="project-tag">${_formatCategory(primaryTag)}</span>
            ${additionalTags.map(t => `<span class="project-tag">${_formatCategory(t)}</span>`).join('')}
          </div>
        </div>
        <h3 class="project-title">${_escapeHtml(project.title)}</h3>
        <p class="project-description">${_escapeHtml(project.shortDescription)}</p>
      </div>
      <div class="project-card-footer">
        <div class="project-tools">
          ${project.tools.map(t => `<span class="project-tool">${_escapeHtml(t)}</span>`).join(' · ')}
        </div>
        ${project.duration ? `<span class="project-duration">${_escapeHtml(project.duration)}</span>` : ''}
      </div>
    `;

    // Open modal on click or Enter key
    const open = () => Modal.open(project.id);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });

    return card;
  }

  function _buildMediaElement(project) {
    if (project.thumbnail) {
      return `<img
        class="project-card-img"
        src="${_escapeHtml(project.thumbnail)}"
        alt="${_escapeHtml(project.title)}"
        loading="lazy"
        onerror="this.parentElement.innerHTML='<div class=\\'project-card-placeholder\\'>No preview available</div>'"
      >`;
    }
    // Gradient placeholder when no thumbnail
    const colors = [
      ['#7c6af7', '#f26a4a'],
      ['#4ade80', '#7c6af7'],
      ['#f26a4a', '#facc15'],
    ];
    const [c1, c2] = colors[Math.floor(Math.random() * colors.length)];
    return `<div class="project-card-placeholder" style="background: linear-gradient(135deg, ${c1}22, ${c2}22);">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
      <span style="margin-top:8px;font-size:12px">Preview not available</span>
    </div>`;
  }

  /* ---------- INTERSECTION OBSERVER (scroll reveal) ---------- */

  function _setupObserver(grid) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    grid.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  /* ---------- HELPERS ---------- */

  function _formatCategory(id) {
    const map = {
      character:    'Character',
      motion:       'Motion',
      '2d':         '2D',
      '3d':         '3D',
      experimental: 'Experimental',
    };
    return map[id] || id;
  }

  function _escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { init };
})();

export default Projects;
