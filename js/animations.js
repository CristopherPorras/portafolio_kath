/**
 * ANIMATIONS MODULE — Animation Portfolio
 * Project Conductor: Agente Código
 *
 * Global scroll-reveal observer and section entrance animations.
 * Lightweight — uses IntersectionObserver, no external dependencies.
 */

const Animations = (() => {

  function init() {
    _setupRevealObserver();
    _setupParallaxOrbs();
  }

  /**
   * Attach IntersectionObserver to all .reveal elements
   * that aren't already handled by individual modules.
   */
  function _setupRevealObserver() {
    const revealEls = document.querySelectorAll('.reveal:not([data-observed])');

    if (!revealEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            // Stagger delay based on element position in its parent
            const siblings = [...entry.target.parentElement.children];
            const index = siblings.indexOf(entry.target);
            const delay = Math.min(index * 80, 400);

            setTimeout(() => {
              entry.target.classList.add('visible');
            }, delay);

            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealEls.forEach(el => {
      el.dataset.observed = 'true';
      observer.observe(el);
    });
  }

  /**
   * Subtle mouse parallax for hero orbs.
   * Only runs if the device has a pointer and prefers no reduced motion.
   */
  function _setupParallaxOrbs() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const orbs = document.querySelectorAll('.hero-orb');
    if (!orbs.length) return;

    let ticking = false;

    document.addEventListener('mousemove', (e) => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = (e.clientX - cx) / cx; // -1 to 1
        const dy = (e.clientY - cy) / cy; // -1 to 1

        orbs.forEach((orb, i) => {
          const depth = (i + 1) * 8; // px max movement
          orb.style.transform = `translate(${dx * depth}px, ${dy * depth}px)`;
        });

        ticking = false;
      });
    });
  }

  return { init };
})();

export default Animations;
