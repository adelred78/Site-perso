/**
 * Point d'entrée JavaScript.
 * Initialise les modules selon ce qui est présent sur la page.
 */

import { initHeader, highlightActiveNavLink } from './nav.js';
import { initFeaturedProjects, initProjectsPage, initProjectDetailPage } from './projects.js';
import { initContactForm } from './contact.js';
import { initTheme } from './theme.js';
import { initBgParticles } from './bg-particles.js';

function initLightbox() {
  const triggers = document.querySelectorAll('.lightbox-trigger, [data-cert-trigger]');
  if (!triggers.length) return;

  let lightbox = document.querySelector('[data-lightbox]');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.dataset.lightbox = '';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML = `
      <button class="lightbox__close" aria-label="Fermer">×</button>
      <img class="lightbox__img" alt="" />
      <div class="lightbox__error is-hidden">Certificat bientôt disponible.</div>
    `;
    document.body.appendChild(lightbox);
  }

  const img = lightbox.querySelector('.lightbox__img');
  const errorEl = lightbox.querySelector('.lightbox__error');
  const closeBtn = lightbox.querySelector('.lightbox__close');

  const open = (src, alt = '') => {
    img.classList.remove('is-hidden');
    errorEl.classList.add('is-hidden');
    img.alt = alt;
    img.onerror = () => {
      img.classList.add('is-hidden');
      errorEl.classList.remove('is-hidden');
    };
    img.src = src;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => {
      img.src = '';
    }, 250);
  };

  triggers.forEach((t) => {
    t.addEventListener('click', (e) => {
      e.preventDefault();
      const certSrc = t.dataset.certSrc;
      const certAlt = t.dataset.certAlt;
      if (certSrc) {
        open(certSrc, certAlt || '');
        return;
      }
      const targetImg = t.tagName === 'IMG' ? t : t.querySelector('img');
      if (targetImg) open(targetImg.src, targetImg.alt);
    });
  });

  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) close();
  });
}

function init() {
  initTheme();
  initHeader();
  highlightActiveNavLink();
  initFeaturedProjects();
  initProjectsPage();
  initProjectDetailPage();
  initContactForm();
  initLightbox();
  initBgParticles();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
