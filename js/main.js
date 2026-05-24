/**
 * Point d'entrée JavaScript.
 * Initialise les modules selon ce qui est présent sur la page.
 */

import { initHeader, highlightActiveNavLink } from './nav.js';
import { initFeaturedProjects, initProjectsPage, initProjectDetailPage } from './projects.js';
import { initContactForm, initEmailCopy } from './contact.js';
import { initTheme } from './theme.js';
import { initBgParticles } from './bg-particles.js';
import { initFeaturedCertifications, initCertificationsPage } from './certifications.js';

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

function initReveal() {
  const targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-revealed'));
    return;
  }

  // Stagger delay per sibling group so each section animates as a cascade
  const groupCounters = new Map();
  targets.forEach((el) => {
    const parent = el.parentElement;
    const count = groupCounters.get(parent) || 0;
    el.dataset.revealDelay = String(count * 90);
    groupCounters.set(parent, count + 1);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = parseInt(el.dataset.revealDelay || '0', 10);
        el.style.transitionDelay = `${delay}ms`;
        el.classList.add('is-revealed');
        observer.unobserve(el);
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

function initJourneyGlow() {
  const cards = document.querySelectorAll('.journey__card');
  cards.forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', `${mx}%`);
      card.style.setProperty('--my', `${my}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    });
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
  initEmailCopy();
  initLightbox();
  initBgParticles();
  initFeaturedCertifications();
  initCertificationsPage();
  initReveal();
  initJourneyGlow();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
