/**
 * HERO MODULE — Animation Portfolio
 * Project Conductor: Agente Código
 *
 * Populates the hero section with animator data from JSON.
 */

import DataLoader from './data.js';

const Hero = (() => {

  function init() {
    try {
      const animator = DataLoader.getAnimator();
      _render(animator);
    } catch (err) {
      console.warn('[Hero] Could not render hero data:', err);
    }
  }

  function _render(animator) {
    _setText('[data-hero-name]', animator.name);
    _setText('[data-hero-tagline]', animator.tagline);
    _setText('[data-hero-bio]', animator.bio);
    _setText('[data-hero-experience]', `${animator.experience_years}+`);
    _setText('[data-hero-projects]', `${DataLoader.getProjects().length}+`);

    // Availability badge
    const availEl = document.querySelector('[data-hero-available]');
    if (availEl) {
      availEl.textContent = animator.available ? 'Available for work' : 'Currently unavailable';
      availEl.style.color = animator.available
        ? 'var(--color-success)'
        : 'var(--color-text-muted)';
    }

    // Email CTA
    const emailBtn = document.querySelector('[data-hero-email]');
    if (emailBtn) {
      emailBtn.href = `mailto:${animator.email}`;
    }

    // Resume link
    const resumeBtn = document.querySelector('[data-hero-resume]');
    if (resumeBtn && animator.resume) {
      resumeBtn.href = animator.resume;
    }
  }

  function _setText(selector, text) {
    const el = document.querySelector(selector);
    if (el && text !== undefined) el.textContent = text;
  }

  return { init };
})();

export default Hero;
