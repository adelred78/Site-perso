/**
 * Navigation : header sticky, burger menu mobile, switcher de langue.
 */

const PATH_MAP_FR_EN = {
  '/fr/': '/en/',
  '/fr/projets': '/en/projects',
  '/fr/a-propos': '/en/about',
  '/fr/contact': '/en/contact',
};

const PATH_MAP_EN_FR = {
  '/en/': '/fr/',
  '/en/projects': '/fr/projets',
  '/en/about': '/fr/a-propos',
  '/en/contact': '/fr/contact',
};

/**
 * Détermine la langue active depuis l'URL.
 * @returns {'fr' | 'en'}
 */
export function getCurrentLang() {
  return window.location.pathname.startsWith('/en') ? 'en' : 'fr';
}

/**
 * Construit l'URL équivalente dans l'autre langue.
 * @returns {string}
 */
export function getOtherLangUrl() {
  const path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  const lang = getCurrentLang();

  if (lang === 'fr') {
    // Détail projet : /fr/projets/:slug → /en/projects/:slug
    const projectMatch = path.match(/^\/fr\/projets\/([^/]+)$/);
    if (projectMatch) return `/en/projects/${projectMatch[1]}`;

    return PATH_MAP_FR_EN[path] || PATH_MAP_FR_EN[`${path}/`] || '/en/';
  } else {
    const projectMatch = path.match(/^\/en\/projects\/([^/]+)$/);
    if (projectMatch) return `/fr/projets/${projectMatch[1]}`;

    return PATH_MAP_EN_FR[path] || PATH_MAP_EN_FR[`${path}/`] || '/fr/';
  }
}

/**
 * Initialise le header : burger, scroll-shadow, switcher de langue.
 */
export function initHeader() {
  const header = document.querySelector('[data-header]');
  const burger = document.querySelector('[data-burger]');
  const nav = document.querySelector('[data-nav]');
  const langSwitch = document.querySelector('[data-lang-switch]');

  if (!header) return;

  // Scroll shadow
  let lastScroll = 0;
  const onScroll = () => {
    const scrolled = window.scrollY > 20;
    header.classList.toggle('header--scrolled', scrolled);
    lastScroll = window.scrollY;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Burger
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('header__nav--open');
      burger.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('header__nav--open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Switcher de langue
  if (langSwitch) {
    langSwitch.href = getOtherLangUrl();
  }
}

/**
 * Marque le lien de navigation actif (aria-current).
 */
export function highlightActiveNavLink() {
  const path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  document.querySelectorAll('[data-nav] a').forEach((link) => {
    const href = link.getAttribute('href')?.replace(/\.html$/, '').replace(/\/$/, '') ?? '';
    if (href && (path === href || path.startsWith(`${href}/`))) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}
