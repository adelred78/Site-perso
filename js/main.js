/**
 * Point d'entrée JavaScript.
 * Initialise les modules selon ce qui est présent sur la page.
 */

import { initHeader, highlightActiveNavLink } from './nav.js';
import { initFeaturedProjects, initProjectsPage, initProjectDetailPage } from './projects.js';
import { initContactForm } from './contact.js';

function initLightbox() {
  const triggers = document.querySelectorAll('.lightbox-trigger');
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
    `;
    document.body.appendChild(lightbox);
  }

  const img = lightbox.querySelector('.lightbox__img');
  const closeBtn = lightbox.querySelector('.lightbox__close');

  const open = (src, alt = '') => {
    img.src = src;
    img.alt = alt;
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
  initHeader();
  highlightActiveNavLink();
  initFeaturedProjects();
  initProjectsPage();
  initProjectDetailPage();
  initContactForm();
  initLightbox();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
