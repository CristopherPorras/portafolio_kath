/**
 * CONTACT MODULE — Animation Portfolio
 * Project Conductor: Agente Código
 *
 * Populates contact section links from JSON data.
 * Handles contact form with mailto fallback (no server required).
 */

import DataLoader from './data.js';

const Contact = (() => {

  function init() {
    try {
      const animator = DataLoader.getAnimator();
      _renderLinks(animator);
      _setupForm(animator);
    } catch (err) {
      console.warn('[Contact] Render failed:', err);
    }
  }

  function _renderLinks(animator) {
    // Email link
    const emailLinks = document.querySelectorAll('[data-contact-email]');
    emailLinks.forEach(el => {
      el.href = `mailto:${animator.email}`;
      el.querySelector('.contact-link-value') && (el.querySelector('.contact-link-value').textContent = animator.email);
    });

    // Social links
    const social = animator.social || {};
    Object.keys(social).forEach(platform => {
      const el = document.querySelector(`[data-contact-${platform}]`);
      if (el && social[platform]) {
        el.href = social[platform];
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
      }
    });

    // Location
    const locationEl = document.querySelector('[data-contact-location]');
    if (locationEl) locationEl.textContent = animator.location;

    // Availability
    const availEl = document.querySelector('[data-contact-available]');
    if (availEl) {
      availEl.textContent = animator.available ? 'Available for new opportunities' : 'Not currently available';
    }
  }

  function _setupForm(animator) {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput    = form.querySelector('[name="name"]');
      const emailInput   = form.querySelector('[name="email"]');
      const subjectInput = form.querySelector('[name="subject"]');
      const messageInput = form.querySelector('[name="message"]');
      const statusEl     = form.querySelector('.form-status');
      const submitBtn    = form.querySelector('[type="submit"]');

      // Basic validation
      if (!nameInput?.value.trim() || !emailInput?.value.trim() || !messageInput?.value.trim()) {
        _showStatus(statusEl, 'error', 'Please fill in all required fields.');
        return;
      }

      if (!_isValidEmail(emailInput.value)) {
        _showStatus(statusEl, 'error', 'Please enter a valid email address.');
        return;
      }

      // Build mailto link (fallback — works without a server)
      const subject = subjectInput?.value.trim() || 'Portfolio Inquiry';
      const body = `Name: ${nameInput.value}\nEmail: ${emailInput.value}\n\n${messageInput.value}`;
      const mailtoUrl = `mailto:${animator.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      // Open mail client
      window.location.href = mailtoUrl;

      _showStatus(statusEl, 'success', 'Opening your mail client... If it doesn\'t open, please email me directly.');
      form.reset();

      // Disable submit temporarily
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sent!';
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        }, 4000);
      }
    });
  }

  function _showStatus(el, type, message) {
    if (!el) return;
    el.className = `form-status ${type}`;
    el.textContent = message;

    setTimeout(() => {
      el.className = 'form-status';
    }, 6000);
  }

  function _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  return { init };
})();

export default Contact;
