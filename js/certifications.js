/**
 * Chargement et rendu des certifications.
 * Utilisé par : section accueil (3 featured) et page /certifications (toutes).
 */

import { getCurrentLang } from './nav.js';

let _cache = null;
async function loadCerts() {
  if (_cache) return _cache;
  const res = await fetch('/data/certifications.json');
  if (!res.ok) throw new Error('Impossible de charger certifications.json');
  const data = await res.json();
  _cache = data.certifications;
  return _cache;
}

const I18N = {
  fr: {
    obtained: 'Obtenue',
    planned: 'En préparation',
    verify: 'Vérifier la certification',
    targetDate: 'Objectif',
    issued: 'Délivrée par',
    skills: 'Compétences',
    progress: 'Progression',
    viewAll: 'Voir toutes les certifications →',
    sectionTitle: 'Certifications',
    sectionSubtitle: 'Validations officielles et objectifs à venir',
  },
  en: {
    obtained: 'Earned',
    planned: 'In progress',
    verify: 'Verify certificate',
    targetDate: 'Target',
    issued: 'Issued by',
    skills: 'Skills',
    progress: 'Progress',
    viewAll: 'See all certifications →',
    sectionTitle: 'Certifications',
    sectionSubtitle: 'Official validations and upcoming goals',
  },
};

function localized(field, lang) {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  return field[lang] ?? field.fr ?? '';
}

function renderCertCard(cert, lang) {
  const t = I18N[lang];
  const title = localized(cert.title, lang);
  const issuer = localized(cert.issuer, lang);
  const description = localized(cert.description, lang);
  const targetDate = localized(cert.targetDate, lang);

  const isObtained = cert.status === 'obtained';
  const statusLabel = isObtained ? t.obtained : t.planned;
  const statusIcon = isObtained
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

  const progressHtml = !isObtained && typeof cert.progress === 'number'
    ? `<div class="cert-card__progress" aria-label="${t.progress} ${cert.progress}%">
         <div class="cert-card__progress-bar"><div class="cert-card__progress-fill" style="width: ${cert.progress}%"></div></div>
         <span class="cert-card__progress-value">${cert.progress}%</span>
       </div>`
    : '';

  const dateHtml = isObtained
    ? `<span class="cert-card__date">${cert.date ?? ''}</span>`
    : targetDate
      ? `<span class="cert-card__date">${targetDate}</span>`
      : '';

  const verifyHtml = isObtained
    ? cert.verifyUrl
      ? `<a href="${cert.verifyUrl}" target="_blank" rel="noopener" class="button button--outline button--small cert-card__verify">${t.verify} ↗</a>`
      : `<button type="button" class="button button--outline button--small cert-card__verify" disabled aria-disabled="true">${t.verify}</button>`
    : '';

  return `
    <article class="cert-card cert-card--${cert.status}" data-status="${cert.status}" data-category="${cert.category}">
      <div class="cert-card__head">
        <div class="cert-card__icon" aria-hidden="true">${statusIcon}</div>
        <div class="cert-card__head-meta">
          ${dateHtml}
          <span class="cert-card__status">${statusLabel}</span>
        </div>
      </div>
      <h3 class="cert-card__title">${title}</h3>
      <p class="cert-card__issuer">${issuer}</p>
      ${description ? `<p class="cert-card__description">${description}</p>` : ''}
      ${progressHtml}
      ${verifyHtml}
    </article>
  `;
}

/** Section accueil : 3 cards (2 obtenu + 1 prévu) */
export async function initFeaturedCertifications() {
  const grid = document.querySelector('[data-certs-featured]');
  if (!grid) return;
  const lang = getCurrentLang();
  const certs = await loadCerts();

  const obtained = certs
    .filter((c) => c.status === 'obtained' && c.featured)
    .sort((a, b) => a.order - b.order)
    .slice(0, 2);
  const planned = certs
    .filter((c) => c.status === 'planned' && c.featured)
    .sort((a, b) => a.order - b.order)
    .slice(0, 1);

  const featured = [...obtained, ...planned];
  grid.innerHTML = featured.map((c) => renderCertCard(c, lang)).join('');
}

/** Page complète /certifications */
export async function initCertificationsPage() {
  const grid = document.querySelector('[data-certs-grid]');
  if (!grid) return;
  const lang = getCurrentLang();
  const certs = await loadCerts();
  certs.sort((a, b) => {
    // obtained first, then planned, then by order
    if (a.status !== b.status) return a.status === 'obtained' ? -1 : 1;
    return a.order - b.order;
  });
  grid.innerHTML = certs.map((c) => renderCertCard(c, lang)).join('');
}
