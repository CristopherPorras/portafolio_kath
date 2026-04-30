/**
 * MAIN ENTRY POINT — Animation Portfolio
 * Project Conductor: Agente Código
 *
 * Bootstraps all modules in the correct dependency order.
 * Dependency graph:
 *   DataLoader → [Hero, Projects, About, Contact, Nav, Modal, Animations]
 */

import DataLoader  from './data.js';
import Nav         from './nav.js';
import Hero        from './hero.js';
import Projects    from './projects.js';
import Modal       from './modal.js';
import About       from './about.js';
import Contact     from './contact.js';
import Animations  from './animations.js';

async function bootstrap() {
  try {
    // 1. Load all data first — everything depends on this
    await DataLoader.load();

    // 2. Initialize modules that depend on data
    // Order matters: Modal must init before Projects (Projects triggers Modal.open)
    Modal.init();
    Nav.init();
    Hero.init();
    Projects.init();
    About.init();
    Contact.init();
    Animations.init();

    // 3. Remove loading state if present
    document.body.classList.add('loaded');
    document.querySelector('#app-loader')?.remove();

    console.log('[Portfolio] All modules initialized successfully.');
  } catch (err) {
    console.error('[Portfolio] Bootstrap failed:', err);
    _showFatalError(err);
  }
}

function _showFatalError(err) {
  const main = document.querySelector('main');
  if (!main) return;
  const notice = document.createElement('div');
  notice.style.cssText = 'padding:2rem;text-align:center;color:var(--color-text-muted)';
  notice.textContent = 'Failed to load portfolio data. Please refresh the page.';
  main.prepend(notice);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
