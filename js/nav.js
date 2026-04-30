/**
 * NAVIGATION MODULE — Animation Portfolio
 * Project Conductor: Agente Código
 *
 * Handles: scroll-aware nav styling, mobile menu, active link tracking.
 */

import DataLoader from './data.js';

const Nav = (() => {
  const selectors = {
    nav:         '.nav',
    hamburger:   '.nav-hamburger',
    links:       '.nav-links',
    navLinks:    '.nav-link',
    logo:        '.nav-logo',
  };

  let elements = {};
  let scrollThreshold = 40;

  function init() {
    elements.nav       = document.querySelector(selectors.nav);
    elements.hamburger = document.querySelector(selectors.hamburger);
    elements.links     = document.querySelector(selectors.links);

    if (!elements.nav) return;

    _populateLogo();
    _setupScrollListener();
    _setupMobileMenu();
    _setupActiveLinkTracking();
  }

  function _populateLogo() {
    try {
      const animator = DataLoader.getAnimator();
      const nameParts = animator.name.split(' ');
      const logo = document.querySelector(selectors.logo);
      if (logo && nameParts.length >= 2) {
        logo.innerHTML = `${nameParts[0]} <span>${nameParts.slice(1).join(' ')}</span>`;
      }
    } catch (_) { /* Data may not be loaded yet */ }
  }

  function _setupScrollListener() {
    const onScroll = () => {
      const scrolled = window.scrollY > scrollThreshold;
      elements.nav.classList.toggle('scrolled', scrolled);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Run once on init
  }

  function _setupMobileMenu() {
    if (!elements.hamburger || !elements.links) return;

    elements.hamburger.addEventListener('click', () => {
      const isOpen = elements.hamburger.classList.toggle('open');
      elements.links.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on nav link click (mobile)
    elements.links.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', _closeMobileMenu);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!elements.nav.contains(e.target)) _closeMobileMenu();
    });
  }

  function _closeMobileMenu() {
    elements.hamburger?.classList.remove('open');
    elements.links?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function _setupActiveLinkTracking() {
    const navLinks = document.querySelectorAll(selectors.navLinks);
    if (!navLinks.length) return;

    // Gather all tracked sections
    const sections = [];
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href?.startsWith('#')) {
        const section = document.querySelector(href);
        if (section) sections.push({ link, section });
      }
    });

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            navLinks.forEach(l => l.classList.remove('active'));
            const match = sections.find(s => s.section === entry.target);
            match?.link.classList.add('active');
          }
        });
      },
      { rootMargin: `-${Math.floor(window.innerHeight * 0.4)}px 0px -50% 0px` }
    );

    sections.forEach(({ section }) => observer.observe(section));
  }

  return { init };
})();

export default Nav;
