/**
 * ABOUT MODULE — Animation Portfolio
 * Project Conductor: Agente Código
 *
 * Populates the about section with animator bio and skills from JSON.
 */

import DataLoader from './data.js';

const About = (() => {

  function init() {
    try {
      const animator = DataLoader.getAnimator();
      _renderBio(animator);
      _renderSkills(animator.skills);
      _renderBadge(animator);
    } catch (err) {
      console.warn('[About] Render failed:', err);
    }
  }

  function _renderBio(animator) {
    const bioEl = document.querySelector('[data-about-bio]');
    if (bioEl) bioEl.textContent = animator.bio;

    const nameEl = document.querySelector('[data-about-name]');
    if (nameEl) nameEl.textContent = animator.name;

    const titleEl = document.querySelector('[data-about-title]');
    if (titleEl) titleEl.textContent = animator.title;

    const locationEl = document.querySelector('[data-about-location]');
    if (locationEl) locationEl.textContent = animator.location;
  }

  function _renderBadge(animator) {
    const badgeValue = document.querySelector('[data-about-years]');
    if (badgeValue) badgeValue.textContent = `${animator.experience_years}+`;
  }

  function _renderSkills(skills) {
    const container = document.querySelector('[data-about-skills]');
    if (!container || !skills) return;

    container.innerHTML = '';

    skills.forEach(skillCat => {
      const catEl = document.createElement('div');
      catEl.className = 'skill-category reveal';

      catEl.innerHTML = `
        <div class="skill-category-name">${_escapeHtml(skillCat.category)}</div>
        <div class="skill-tools">
          ${skillCat.tools.map(tool => `
            <span class="skill-tool">${_escapeHtml(tool)}</span>
          `).join('')}
        </div>
      `;

      container.appendChild(catEl);
    });

    // Trigger reveal observer
    _observeReveals(container);
  }

  function _observeReveals(container) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    container.querySelectorAll('.reveal').forEach(el => observer.observe(el));
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

export default About;
