/**
 * MODAL MODULE — Animation Portfolio
 * Project Conductor: Agente Código
 *
 * Full-screen project detail modal.
 * Supports: Vimeo/YouTube iframes, image fallback, keyboard close, focus trap.
 */

import DataLoader from './data.js';

const Modal = (() => {
  let overlay    = null;
  let modal      = null;
  let closeBtn   = null;
  let lastFocused = null;

  function init() {
    overlay  = document.querySelector('.modal-overlay');
    modal    = document.querySelector('.modal');
    closeBtn = document.querySelector('.modal-close');

    if (!overlay) return;

    closeBtn?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
  }

  function open(projectId) {
    const project = DataLoader.getProjectById(projectId);
    if (!project || !overlay) return;

    lastFocused = document.activeElement;
    _renderContent(project);
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Focus the close button after animation
    setTimeout(() => closeBtn?.focus(), 300);
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';

    // Stop any playing video by clearing the media area
    const mediaContainer = overlay.querySelector('.modal-media');
    if (mediaContainer) {
      setTimeout(() => { mediaContainer.innerHTML = ''; }, 300);
    }

    lastFocused?.focus();
  }

  function _renderContent(project) {
    // Title & subtitle
    _setText('.modal-title', project.title);
    _setText('.modal-subtitle', `${project.year} · ${project.client || 'Personal Project'} · ${project.duration || ''}`);
    _setText('.modal-description', project.description);

    // Media
    const mediaContainer = overlay.querySelector('.modal-media');
    if (mediaContainer) {
      mediaContainer.innerHTML = _buildMedia(project);
    }

    // Details
    _setText('[data-modal-client]', project.client || 'Personal Project');
    _setText('[data-modal-year]', project.year);
    _setText('[data-modal-duration]', project.duration || 'N/A');
    _setText('[data-modal-tools]', project.tools?.join(', ') || 'N/A');

    // Categories
    const catEl = overlay.querySelector('[data-modal-categories]');
    if (catEl) {
      catEl.textContent = project.category?.map(c => _formatCategory(c)).join(', ') || '';
    }
  }

  function _buildMedia(project) {
    if (!project.media) {
      return project.thumbnail
        ? `<img src="${_escapeHtml(project.thumbnail)}" alt="${_escapeHtml(project.title)}" style="width:100%;height:100%;object-fit:cover">`
        : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--color-text-subtle)">No media available</div>';
    }

    const { type, url } = project.media;

    if (type === 'video') {
      // Support Vimeo — convert any vimeo.com URL to embed URL
      if (url.includes('vimeo')) {
        const vimeoId = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
        if (vimeoId) {
          return `<iframe
            src="https://player.vimeo.com/video/${vimeoId}?autoplay=1&color=b07280&title=0&byline=0&portrait=0"
            frameborder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen
            title="${_escapeHtml(project.title)}"
          ></iframe>`;
        }
      }
      // Support YouTube embed URLs
      if (url.includes('youtube') || url.includes('youtu.be')) {
        const videoId = _extractYouTubeId(url);
        if (videoId) {
          return `<iframe
            src="https://www.youtube.com/embed/${videoId}?autoplay=1"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            title="${_escapeHtml(project.title)}"
          ></iframe>`;
        }
      }
      // Generic video file
      return `<video controls autoplay style="width:100%;height:100%;object-fit:contain">
        <source src="${_escapeHtml(url)}">
        Your browser does not support the video tag.
      </video>`;
    }

    if (type === 'image') {
      return `<img src="${_escapeHtml(url)}" alt="${_escapeHtml(project.title)}" style="width:100%;height:100%;object-fit:contain">`;
    }

    return '';
  }

  function _extractYouTubeId(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^?&\s]{11})/);
    return match ? match[1] : null;
  }

  function _setText(selector, text) {
    const el = overlay?.querySelector(selector);
    if (el && text !== undefined && text !== null) el.textContent = text;
  }

  function _escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _formatCategory(id) {
    const map = { character: 'Character Animation', motion: 'Motion Graphics', '2d': '2D Animation', '3d': '3D Animation', experimental: 'Experimental' };
    return map[id] || id;
  }

  return { init, open, close };
})();

export default Modal;
