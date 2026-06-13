/**
 * Chargement et rendu des projets.
 * Utilisé par : page liste (filtres) et template de détail (slug depuis l'URL).
 */

import { getCurrentLang } from './nav.js';

let _projectsCache = null;

/**
 * Charge data/projects.json (avec cache).
 */
export async function loadProjects() {
  if (_projectsCache) return _projectsCache;
  const res = await fetch('/data/projects.json');
  if (!res.ok) throw new Error('Impossible de charger projects.json');
  const data = await res.json();
  _projectsCache = data.projects;
  return _projectsCache;
}

/**
 * Charge le JSON i18n de la langue active (pour les labels de filtres etc.).
 */
let _i18nCache = null;
export async function loadI18n() {
  if (_i18nCache) return _i18nCache;
  const lang = getCurrentLang();
  const res = await fetch(`/data/i18n/${lang}.json`);
  if (!res.ok) throw new Error(`Impossible de charger i18n/${lang}.json`);
  _i18nCache = await res.json();
  return _i18nCache;
}

/**
 * Extrait le slug depuis l'URL de détail.
 */
export function getSlugFromUrl() {
  const match = window.location.pathname.match(/\/(?:projets|projects)\/([^/]+?)(?:\.html)?\/?$/);
  return match ? match[1] : null;
}

/**
 * Construit l'URL de détail d'un projet (selon la langue).
 */
export function getProjectUrl(slug) {
  return getCurrentLang() === 'fr' ? `/fr/projets/${slug}` : `/en/projects/${slug}`;
}

/* ===========================
 * PAGE LISTE — rendu + filtres
 * =========================== */

const STATE = {
  type: 'all',
  category: 'all',
};

function getLang() {
  return getCurrentLang();
}

function localized(field) {
  const lang = getLang();
  if (typeof field === 'string') return field;
  return field?.[lang] ?? field?.fr ?? '';
}

function renderProjectCard(project, labels) {
  const url = getProjectUrl(project.slug);
  const badge = localized(project.badge);
  const title = localized(project.title);
  const pitch = localized(project.pitch);
  const tech = project.tech.slice(0, 4);
  const viewDetail = labels.projectsPage.card.viewDetail;
  const typeLabel = labels.projectsPage.filters.type[project.type] ?? project.type;
  // Effet doré pour le projet gagnant Rube Goldberg
  const goldClass = project.slug === 'snack-o-matic' ? ' card--gold' : '';

  return `
    <article class="card card--project${goldClass}" data-type="${project.type}" data-category="${project.category}" data-slug="${project.slug}">
      <a href="${url}" class="card__image-link" aria-label="${title}">
        <img src="${project.images.thumb}" alt="${title}" class="card__image" loading="lazy" />
        <span class="badge badge--${project.type}">${badge}</span>
        <span class="card__type card__type--${project.type}">${typeLabel}</span>
      </a>
      <div class="card__body">
        <span class="card__category">${labels.projectsPage.filters.category[project.category] ?? project.category}</span>
        <h3 class="card__title">${title}</h3>
        <p class="card__description">${pitch}</p>
        <div class="tags">${tech.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
        <a href="${url}" class="card__link">${viewDetail} <span aria-hidden="true">→</span></a>
      </div>
    </article>
  `;
}

function applyFilters(projects) {
  return projects.filter((p) => {
    const typeOk = STATE.type === 'all' || p.type === STATE.type;
    const catOk = STATE.category === 'all' || p.category === STATE.category;
    return typeOk && catOk;
  });
}

function updateGrid(projects, container, labels) {
  const filtered = applyFilters(projects);
  const noResults = container.parentElement.querySelector('[data-no-results]');

  if (filtered.length === 0) {
    container.innerHTML = '';
    if (noResults) noResults.classList.remove('is-hidden');
  } else {
    if (noResults) noResults.classList.add('is-hidden');
    container.innerHTML = filtered.map((p) => renderProjectCard(p, labels)).join('');
  }
}

export async function initProjectsPage() {
  const container = document.querySelector('[data-projects-grid]');
  if (!container) return;

  const [projects, labels] = await Promise.all([loadProjects(), loadI18n()]);
  projects.sort((a, b) => a.order - b.order);

  updateGrid(projects, container, labels);

  document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const { filter, value } = btn.dataset;
      STATE[filter] = value;

      document
        .querySelectorAll(`[data-filter="${filter}"]`)
        .forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));

      updateGrid(projects, container, labels);
    });
  });

  const resetBtn = document.querySelector('[data-filter-reset]');
  resetBtn?.addEventListener('click', () => {
    STATE.type = 'all';
    STATE.category = 'all';
    document.querySelectorAll('[data-filter]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.value === 'all'));
    });
    updateGrid(projects, container, labels);
  });
}

/* ===========================
 * PAGE FEATURED (accueil) — projet à la une + grille
 * =========================== */

/**
 * Carte « spotlight » pleine largeur pour le projet à la une (1er featured).
 * Format horizontal (image + contenu) sur desktop, empilé sur mobile.
 */
function renderSpotlightCard(project, labels) {
  const url = getProjectUrl(project.slug);
  const badge = localized(project.badge);
  const title = localized(project.title);
  const desc = localized(project.subtitle) || localized(project.pitch);
  const category = labels.projectsPage.filters.category[project.category] ?? project.category;
  const viewDetail = labels.projectsPage.card.viewDetail;
  const demoLabel = labels.projectDetail.sidebar.demo;
  const tech = project.tech.slice(0, 6);
  const typeLabel = labels.projectsPage.filters.type[project.type] ?? project.type;

  return `
    <article class="card card--spotlight" data-type="${project.type}" data-category="${project.category}" data-slug="${project.slug}">
      <a href="${url}" class="card--spotlight__media" aria-label="${title}">
        <img src="${project.images.cover}" alt="${title}" class="card--spotlight__image" loading="lazy" />
        <span class="badge badge--${project.type}">${badge}</span>
        <span class="card__type card__type--${project.type}">${typeLabel}</span>
      </a>
      <div class="card--spotlight__body">
        <span class="card__category">${category}</span>
        <h3 class="card--spotlight__title">${title}</h3>
        <p class="card--spotlight__desc">${desc}</p>
        <div class="tags">${tech.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
        <div class="card--spotlight__actions">
          <a href="${url}" class="button button--primary button--small">${viewDetail} <span aria-hidden="true">→</span></a>
          ${project.links?.demo ? `<a href="${project.links.demo}" target="_blank" rel="noopener" class="button button--outline button--small">${demoLabel} <span aria-hidden="true">↗</span></a>` : ''}
        </div>
      </div>
    </article>
  `;
}

export async function initFeaturedProjects() {
  const container = document.querySelector('[data-featured-grid]');
  if (!container) return;

  const [projects, labels] = await Promise.all([loadProjects(), loadI18n()]);
  const featured = projects.filter((p) => p.featured).sort((a, b) => a.order - b.order);

  const spotlightContainer = document.querySelector('[data-featured-spotlight]');
  if (spotlightContainer && featured.length) {
    // 1er projet featured → carte à la une ; les 3 suivants → grille classique.
    spotlightContainer.innerHTML = renderSpotlightCard(featured[0], labels);
    container.innerHTML = featured.slice(1, 4).map((p) => renderProjectCard(p, labels)).join('');
  } else {
    container.innerHTML = featured.slice(0, 3).map((p) => renderProjectCard(p, labels)).join('');
  }
}

/* ===========================
 * PAGE DÉTAIL — rendu depuis slug
 * =========================== */

export async function initProjectDetailPage() {
  const root = document.querySelector('[data-project-detail]');
  if (!root) return;

  const slug = getSlugFromUrl();
  const [projects, labels] = await Promise.all([loadProjects(), loadI18n()]);
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    renderNotFound(root, labels);
    return;
  }

  renderDetail(root, project, projects, labels);
}

function renderNotFound(root, labels) {
  const t = labels.projectDetail.notFound;
  document.title = `${t.title} — Adel Redjemi`;
  root.innerHTML = `
    <section class="container section">
      <h1>${t.title}</h1>
      <p>${t.body}</p>
      <a href="${getCurrentLang() === 'fr' ? '/fr/projets' : '/en/projects'}" class="button button--primary">${t.back}</a>
    </section>
  `;
}

function renderDetail(root, project, allProjects, labels) {
  const lang = getLang();
  const t = labels.projectDetail;
  const title = localized(project.title);
  const subtitle = localized(project.subtitle);

  // <title> + meta
  document.title = `${title} — Adel Redjemi`;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', subtitle);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', subtitle);
  document.querySelector('meta[property="og:image"]')?.setAttribute('content', project.images.og);

  const meta = project.meta;
  const c = project.content;

  // Prev / next
  const sorted = [...allProjects].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((p) => p.slug === project.slug);
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;

  root.innerHTML = `
    <nav class="container" aria-label="Breadcrumb" style="padding-top: var(--space-6);">
      <a href="${lang === 'fr' ? '/fr/projets' : '/en/projects'}" class="button button--ghost button--small">${t.back}</a>
    </nav>

    <header class="project-detail__hero container section">
      <span class="badge badge--${project.type}">${localized(project.badge)}</span>
      <h1 class="project-detail__title">${title}</h1>
      <p class="project-detail__subtitle">${subtitle}</p>
      <div class="project-detail__cover">
        <img src="${project.images.cover}" alt="${title}" loading="eager" />
      </div>
    </header>

    <section class="container">
      <div class="project-detail__meta grid grid--4">
        <div class="meta-item"><span class="meta-item__label">${t.meta.team}</span><span class="meta-item__value">${localized(meta.team)}</span></div>
        <div class="meta-item"><span class="meta-item__label">${t.meta.duration}</span><span class="meta-item__value">${localized(meta.duration)}</span></div>
        <div class="meta-item"><span class="meta-item__label">${t.meta.role}</span><span class="meta-item__value">${localized(meta.role)}</span></div>
        <div class="meta-item"><span class="meta-item__label">${t.meta.result}</span><span class="meta-item__value">${localized(meta.result)}</span></div>
      </div>
    </section>

    <section class="container section project-detail__body">
      <div class="project-detail__content">
        <h2>${t.sections.context}</h2>
        <p>${localized(c.context)}</p>

        <h2>${t.sections.problem}</h2>
        <p>${localized(c.problem)}</p>

        <h2>${t.sections.solution}</h2>
        <p>${localized(c.solution)}</p>

        <h2>${t.sections.myWork}</h2>
        <ul>${localized(c.myWork).map((b) => `<li>${b}</li>`).join('')}</ul>

        <h2>${t.sections.takeaways}</h2>
        <ul class="takeaways">
          ${c.takeaways
            .map(
              (tk) => `
            <li class="takeaway">
              <span class="takeaway__icon" aria-hidden="true">${tk.icon}</span>
              <div>
                <strong>${localized(tk.title)}</strong>
                <p>${localized(tk.body)}</p>
              </div>
            </li>`,
            )
            .join('')}
        </ul>

        ${
          project.images.gallery?.length
            ? `
          <h2>${t.sections.gallery}</h2>
          <div class="grid grid--2 gallery">
            ${project.images.gallery
              .map(
                (g) => `<img src="${g.src}" alt="${localized(g.alt)}" loading="lazy" class="gallery__img lightbox-trigger" />`,
              )
              .join('')}
          </div>`
            : ''
        }
      </div>

      <aside class="project-detail__sidebar">
        <div class="sidebar-box">
          <h3>${t.sidebar.linksHeading}</h3>
          ${project.links.github ? `<a href="${project.links.github}" target="_blank" rel="noopener" class="button button--outline button--small">${t.sidebar.github}</a>` : ''}
          ${project.links.demo ? `<a href="${project.links.demo}" target="_blank" rel="noopener" class="button button--outline button--small">${t.sidebar.demo}</a>` : ''}
          ${project.links.certificate ? `<a href="${project.links.certificate}" target="_blank" rel="noopener" class="button button--outline button--small">${t.sidebar.certificate}</a>` : ''}
        </div>
        <div class="sidebar-box">
          <h3>${t.sidebar.techHeading}</h3>
          <div class="tags">${project.tech.map((tg) => `<span class="tag">${tg}</span>`).join('')}</div>
        </div>
      </aside>
    </section>

    <nav class="container section project-detail__nav" aria-label="Project navigation">
      ${prev ? `<a href="${getProjectUrl(prev.slug)}" class="button button--ghost">${t.nav.previous} <small>${localized(prev.title)}</small></a>` : '<span></span>'}
      ${next ? `<a href="${getProjectUrl(next.slug)}" class="button button--ghost">${t.nav.next} <small>${localized(next.title)}</small></a>` : '<span></span>'}
    </nav>
  `;
}
