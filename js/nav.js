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
    const projectMatch = path.match(/^\/fr\/projets\/([^/]+?)(?:\.html)?$/);
    if (projectMatch && projectMatch[1] !== 'projets') return `/en/projects/${projectMatch[1]}`;

    return PATH_MAP_FR_EN[path] || PATH_MAP_FR_EN[`${path}/`] || '/en/';
  } else {
    const projectMatch = path.match(/^\/en\/projects\/([^/]+?)(?:\.html)?$/);
    if (projectMatch && projectMatch[1] !== 'projects') return `/fr/projets/${projectMatch[1]}`;

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

  // Burger menu mobile : full-screen overlay + body lock + ESC
  if (burger && nav) {
    const openMenu = () => {
      nav.classList.add('header__nav--open');
      burger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
    };
    const closeMenu = () => {
      nav.classList.remove('header__nav--open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    };
    const toggleMenu = () => {
      if (nav.classList.contains('header__nav--open')) {
        closeMenu();
      } else {
        openMenu();
      }
    };

    burger.addEventListener('click', toggleMenu);

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('header__nav--open')) {
        closeMenu();
        burger.focus();
      }
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
  const normalize = (p) => p.replace(/\.html$/, '').replace(/\/$/, '');
  const path = normalize(window.location.pathname);
  document.querySelectorAll('[data-nav] a').forEach((link) => {
    const href = normalize(link.getAttribute('href') ?? '');
    if (!href) return;

    // La home ('/fr' ou '/en' après normalisation) ne doit matcher qu'à
    // l'identique : sinon son préfixe '/fr/' la rend active sur TOUTES les
    // sous-pages, qui commencent toutes par '/fr/'.
    const isHome = /^\/(fr|en)$/.test(href);
    const isActive = isHome ? path === href : path === href || path.startsWith(`${href}/`);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}
