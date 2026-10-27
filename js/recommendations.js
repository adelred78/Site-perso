/**
 * recommendations.js
 * Section « Recommandations » de l'accueil :
 *  - synthèse des qualités citées, comptées dans le texte original de chaque recommandation ;
 *  - vitrine à onglets (un onglet par auteur) avec défilement automatique pausable ;
 *  - liseuse <dialog> qui affiche la recommandation complète, telle que publiée sur LinkedIn.
 *
 * Langue : <html lang="fr|en">. Les originaux sont en français ; la page anglaise
 * affiche la traduction et permet de basculer sur l'original.
 * Données : /data/recommendations.json
 *
 * Hook HTML : <section data-recommendations> contenant [data-reco-insight],
 * [data-reco-stage] et <dialog data-reco-reader>.
 */

const DATA_URL = '/data/recommendations.json';
const TONES = 5; // dégradés d'avatar définis en CSS (.reco-avatar[data-tone])
const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@';

const UI = {
  fr: {
    locale: 'fr-FR',
    colon: ' : ',
    tablist: 'Auteurs des recommandations',
    read: 'Lire la recommandation complète',
    readShort: 'Lire en entier',
    minutes: (n) => `${n} min`,
    readTime: (n) => `${n} min de lecture`,
    prev: 'Recommandation précédente',
    next: 'Recommandation suivante',
    pause: 'Mettre en pause le défilement automatique',
    play: 'Reprendre le défilement automatique',
    close: 'Fermer',
    source: 'Recommandation LinkedIn',
    viewOriginal: 'Voir l’original sur LinkedIn',
    readerText: 'Texte de la recommandation',
    traits: 'Qualités les plus citées. Sélectionnez-en une pour la surligner.',
    traitCount: (n, total) => `, ${n} recommandation${n > 1 ? 's' : ''} sur ${total}`,
    claimLead: (n) => (n > 1 ? 'recommandations mentionnent' : 'recommandation mentionne'),
    claimSr: (n, total, claim) =>
      `${n} recommandation${n > 1 ? 's' : ''} sur ${total} mentionne${n > 1 ? 'nt' : ''} ${claim}.`,
  },
  en: {
    locale: 'en-GB',
    colon: ': ',
    tablist: 'Recommendation authors',
    read: 'Read the full recommendation',
    readShort: 'Read in full',
    minutes: (n) => `${n} min`,
    readTime: (n) => `${n} min read`,
    prev: 'Previous recommendation',
    next: 'Next recommendation',
    pause: 'Pause automatic rotation',
    play: 'Resume automatic rotation',
    close: 'Close',
    source: 'LinkedIn recommendation',
    viewOriginal: 'View the original on LinkedIn',
    readerText: 'Recommendation text',
    traits: 'Most cited qualities. Select one to highlight it.',
    traitCount: (n, total) => `, ${n} of ${total} recommendations`,
    claimLead: (n) => (n > 1 ? 'recommendations mention' : 'recommendation mentions'),
    claimSr: (n, total, claim) => `${n} out of ${total} recommendations mention ${claim}.`,
    translated: 'Translated from French',
    langGroup: 'Reading language',
    showTranslation: 'English',
    showOriginal: 'Original (French)',
    translationNote:
      'Translated from French. Switch to “Original (French)” above to read the recommendation exactly as published on LinkedIn.',
  },
};

const ICONS = {
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
  pause: '<svg class="reco-ico-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  play: '<svg class="reco-ico-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  arrow: '<svg class="reco-ico-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  linkedin: '<svg class="reco-ico-in" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>',
};

/** Return the page language: "fr" | "en" */
function getLang() {
  const lang = document.documentElement.lang || 'fr';
  return lang.startsWith('en') ? 'en' : 'fr';
}

/** Escape HTML special characters */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const escRe = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Apostrophes typographiques à l'affichage (les données restent telles que publiées) */
const typo = (str) => str.replace(/'/g, '’');

const pad = (n) => String(n).padStart(2, '0');

const wordCount = (str) => str.trim().split(/\s+/).length;

const readingMinutes = (str) => Math.max(1, Math.ceil(wordCount(str) / 200));

const roleLine = (p, lang) =>
  [lang === 'en' ? p.role_en : p.role_fr, p.organization].filter(Boolean).join(' · ');

const relation = (p, lang) => (lang === 'en' ? p.relationship_en : p.relationship_fr) || '';

/** Texte d'un bloc { lang, original, en } dans la langue voulue, avec la langue réellement affichée */
function pick(block, lang) {
  if (lang === 'en' && block.lang !== 'en' && block.en) return { text: block.en, lang: 'en' };
  return { text: block.original, lang: block.lang };
}

function formatDate(iso, locale) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function initials(name) {
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Avatar : photo si fournie, sinon monogramme sur dégradé (décoratif, le nom est toujours affiché à côté) */
function avatar(person, size, attrs = '') {
  const src = person.photo && (/^(https?:)?\//.test(person.photo) ? person.photo : `/${person.photo}`);
  const inner = src
    ? `<img src="${esc(src)}" alt="" loading="lazy" decoding="async">`
    : esc(initials(person.name));
  return `<span class="reco-avatar reco-avatar--${size}" data-tone="${person.tone}" aria-hidden="true"${attrs}>${inner}</span>`;
}

/* ── Repérage des qualités dans le texte ─────────────────────────── */

/** Une alternative par qualité (un groupe capturant chacune) : mots commençant par l'une des racines */
function buildMatcher(traits, lang) {
  const usable = traits.filter((trait) => trait.stems?.[lang]?.length);
  if (!usable.length) return null;
  const source = usable
    .map((trait) => `(?<!\\p{L})((?:${trait.stems[lang].map(escRe).join('|')})\\p{L}*)`)
    .join('|');
  return { re: new RegExp(source, 'giu'), ids: usable.map((trait) => trait.id) };
}

/** Découpe un texte en segments, en étiquetant ceux qui expriment une qualité */
function segments(text, matcher) {
  if (!matcher) return [{ text }];
  const out = [];
  let last = 0;
  for (const m of text.matchAll(matcher.re)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: m[0], trait: matcher.ids[m.slice(1).findIndex((group) => group !== undefined)] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

const markOpen = (trait, attrs = '') => `<mark class="reco-mark" data-trait="${trait}"${attrs}>`;

/** Citation découpée en mots animables (--i = rang du mot), qualités surlignées */
function animatedHTML(text, matcher) {
  let i = 0;
  const words = (str) =>
    str
      .split(/(\s+)/)
      .map((token) => (token.trim() ? `<span class="reco-w" style="--i:${i++}">${esc(token)}</span>` : token))
      .join('');
  return segments(text, matcher)
    .map((seg) => (seg.trait ? `${markOpen(seg.trait, ` style="--i:${i}"`)}${words(seg.text)}</mark>` : words(seg.text)))
    .join('');
}

/** Texte complet en paragraphes, qualités surlignées */
function paragraphsHTML(text, matcher) {
  return text
    .split(/\n{2,}/)
    .map((para) => {
      const html = segments(para.trim(), matcher)
        .map((seg) => (seg.trait ? `${markOpen(seg.trait)}${esc(seg.text)}</mark>` : esc(seg.text)))
        .join('');
      return `<p>${html.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');
}

function countUp(el, to, duration = 900) {
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    el.textContent = String(Math.round(to * (1 - (1 - progress) ** 3)));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Main init function — called from main.js */
export function initRecommendations() {
  const section = document.querySelector('[data-recommendations]');
  if (!section) return;

  fetch(DATA_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load recommendations: ${r.status}`);
      return r.json();
    })
    .then((data) => {
      if (!data.recommendations?.length) throw new Error('No recommendations');
      render(section, data, getLang());
    })
    .catch((err) => {
      console.warn('[recommendations]', err);
      section.hidden = true;
    });
}

function render(section, data, lang) {
  const traits = data.traits || [];
  const matchers = { fr: buildMatcher(traits, 'fr'), en: buildMatcher(traits, 'en') };

  // Les qualités sont comptées dans le texte original complet, jamais dans une traduction
  const items = data.recommendations.map((p, i) => {
    const found = segments(p.quote_full.original, matchers[p.quote_full.lang]).map((seg) => seg.trait);
    return { ...p, tone: i % TONES, traits: new Set(found.filter(Boolean)) };
  });

  const ctx = {
    section,
    lang,
    t: UI[lang],
    items,
    traits,
    matchers,
    sourceUrl: data.source_url || '',
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };

  const stage = createStage(ctx);
  renderInsight(ctx, stage);
  const reader = createReader(ctx, stage);

  stage.root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-reco-read]');
    if (btn && reader) reader.open(Number(btn.dataset.recoRead), btn);
  });
  if (!reader) stage.root.querySelectorAll('[data-reco-read]').forEach((btn) => (btn.hidden = true));
}

/* ── Synthèse : « 5/5 recommandations mentionnent mon sérieux » + jauges ── */

function renderInsight(ctx, stage) {
  const { section, lang, t, items, traits, reduceMotion } = ctx;
  const root = section.querySelector('[data-reco-insight]');
  if (!root) return;

  const total = items.length;
  const ranked = traits
    .map((trait) => ({ trait, count: items.filter((p) => p.traits.has(trait.id)).length }))
    .filter((entry) => entry.count >= 2)
    .sort((a, b) => b.count - a.count);
  if (!ranked.length) {
    root.hidden = true;
    return;
  }

  const top = ranked[0];
  const claim = top.trait[`claim_${lang}`];
  const meter = (count) =>
    Array.from({ length: total }, (_, k) => `<i${k < count ? ' class="is-on"' : ''} style="--k:${k}"></i>`).join('');

  root.innerHTML = `
    <div class="reco-insight__lead">
      <span class="reco-stack" aria-hidden="true">
        ${items.map((p, k) => avatar(p, 'xs', ` style="--k:${k}"`)).join('')}
      </span>
      <p class="reco-insight__claim">
        <span class="reco-insight__figure" aria-hidden="true"><span data-reco-figure>${reduceMotion ? top.count : 0}</span><span class="reco-insight__total">/${total}</span></span>
        <span class="reco-insight__text" aria-hidden="true">${esc(t.claimLead(top.count))} ${markOpen(top.trait.id)}${esc(claim)}</mark></span>
        <span class="sr-only">${esc(t.claimSr(top.count, total, claim))}</span>
      </p>
    </div>
    <div class="reco-traits" role="group" aria-label="${esc(t.traits)}">
      ${ranked
        .map(
          ({ trait, count }) => `
        <button type="button" class="reco-trait" data-trait="${trait.id}" aria-pressed="false">
          <span class="reco-trait__label">${esc(trait[`label_${lang}`])}</span>
          <span class="reco-trait__meter" aria-hidden="true">${meter(count)}</span>
          <span class="reco-trait__count" aria-hidden="true">${count}/${total}</span>
          <span class="sr-only">${esc(t.traitCount(count, total))}</span>
        </button>`
        )
        .join('')}
    </div>`;

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.reco-trait');
    if (!btn) return;
    const id = btn.getAttribute('aria-pressed') === 'true' ? null : btn.dataset.trait;
    root.querySelectorAll('.reco-trait').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.trait === id)));
    stage.setTrait(id);
  });

  const figure = root.querySelector('[data-reco-figure]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    figure.textContent = String(top.count);
    section.classList.add('is-seen');
    return;
  }
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      section.classList.add('is-seen');
      countUp(figure, top.count);
    },
    { threshold: 0.4 }
  );
  io.observe(root);
}

/* ── Vitrine : onglets auteurs + citation à la une + défilement automatique ── */

function panelHTML(p, i, { lang, t, matchers }) {
  const quote = pick(p.quote_short, lang);
  const text = typo(quote.text);
  const translated = quote.lang !== p.quote_short.lang;
  return `
    <article class="reco-panel" role="tabpanel" id="reco-panel-${p.id}" aria-labelledby="reco-tab-${p.id}">
      <p class="reco-meta">
        ${ICONS.linkedin}<span>${esc(t.source)}</span>
        <span aria-hidden="true">·</span><time datetime="${esc(p.date)}">${esc(formatDate(p.date, t.locale))}</time>
        ${translated ? `<span aria-hidden="true">·</span><span>${esc(t.translated)}</span>` : ''}
      </p>
      <blockquote class="reco-panel__quote" lang="${quote.lang}">
        <p class="sr-only">${esc(text)}</p>
        <p class="reco-panel__text" aria-hidden="true">${animatedHTML(text, matchers[quote.lang])}</p>
      </blockquote>
      <div class="reco-panel__author">
        ${avatar(p, 'lg')}
        <p class="reco-panel__who">
          <strong class="reco-panel__name"><span class="sr-only">${esc(p.name)}</span><span aria-hidden="true" data-scramble="${esc(p.name)}">${esc(p.name)}</span></strong>
          <span class="reco-panel__role">${esc(roleLine(p, lang))}</span>
          <span class="reco-panel__rel">${esc(relation(p, lang))}</span>
        </p>
      </div>
      <button type="button" class="reco-panel__read" data-reco-read="${i}">
        <span class="reco-panel__label">${esc(t.read)}</span><span class="reco-panel__label reco-panel__label--short">${esc(t.readShort)}</span><span class="reco-panel__time">${esc(t.minutes(readingMinutes(pick(p.quote_full, lang).text)))}</span>${ICONS.arrow}
      </button>
    </article>`;
}

function createStage(ctx) {
  const { section, lang, t, items, reduceMotion } = ctx;
  const root = section.querySelector('[data-reco-stage]');
  const n = items.length;

  root.innerHTML = `
    <div class="reco-tabs" role="tablist" aria-label="${esc(t.tablist)}" aria-orientation="vertical">
      ${items
        .map(
          (p, i) => `
        <button type="button" class="reco-tab" role="tab" id="reco-tab-${p.id}" aria-controls="reco-panel-${p.id}" aria-selected="false" tabindex="-1" data-index="${i}">
          ${avatar(p, 'sm')}
          <span class="reco-tab__id">
            <span class="reco-tab__name">${esc(p.name)}</span>
            <span class="reco-tab__role">${esc(roleLine(p, lang))}</span>
          </span>
        </button>`
        )
        .join('')}
    </div>
    <div class="reco-spot">
      <span class="reco-spot__glyph" aria-hidden="true">“</span>
      <div class="reco-spot__stories" aria-hidden="true">
        ${items.map(() => '<span class="reco-story"><i></i></span>').join('')}
      </div>
      <div class="reco-panels" aria-live="off">
        ${items.map((p, i) => panelHTML(p, i, ctx)).join('')}
      </div>
      <div class="reco-controls">
        <button type="button" class="reco-ctrl" data-reco-step="-1" aria-label="${esc(t.prev)}">${ICONS.prev}</button>
        <span class="reco-controls__count" aria-hidden="true"><b data-reco-count>01</b> / ${pad(n)}</span>
        <button type="button" class="reco-ctrl" data-reco-step="1" aria-label="${esc(t.next)}">${ICONS.next}</button>
        <button type="button" class="reco-ctrl reco-ctrl--play" data-reco-play aria-label="${esc(t.pause)}">${ICONS.pause}${ICONS.play}</button>
      </div>
    </div>`;
  root.classList.toggle('is-single', n < 2);

  const tablist = root.querySelector('[role="tablist"]');
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  const stories = [...root.querySelectorAll('.reco-story')];
  const panelsBox = root.querySelector('.reco-panels');
  const spot = root.querySelector('.reco-spot');
  const counter = root.querySelector('[data-reco-count]');
  const playBtn = root.querySelector('[data-reco-play]');

  // Temps d'affichage proportionnel à la longueur de la citation
  const durations = items.map((p) =>
    Math.min(12000, Math.max(6000, 2400 + wordCount(pick(p.quote_short, lang).text) * 280))
  );

  const state = { index: -1, autoplay: false, trait: null, visible: false };
  const holds = new Set(); // pauses temporaires : survol, focus clavier, hors écran, onglet masqué
  const scrambles = new WeakMap();

  function hold(reason, on) {
    if (on) holds.add(reason);
    else holds.delete(reason);
    section.toggleAttribute('data-held', holds.size > 0);
  }

  function restartStory() {
    const bar = stories[state.index]?.firstElementChild;
    if (!bar) return;
    bar.style.setProperty('--dur', `${durations[state.index]}ms`);
    bar.style.animation = 'none';
    void bar.offsetWidth; // relance l'animation CSS depuis le début
    bar.style.animation = '';
  }

  function setAutoplay(on) {
    state.autoplay = on && n > 1;
    section.dataset.autoplay = state.autoplay ? 'on' : 'off';
    playBtn.classList.toggle('is-paused', !state.autoplay);
    playBtn.setAttribute('aria-label', state.autoplay ? t.pause : t.play);
    panelsBox.setAttribute('aria-live', state.autoplay ? 'off' : 'polite');
    if (state.autoplay) restartStory();
  }

  const matches = (i) => !state.trait || items[i].traits.has(state.trait);

  /** Index suivant dans une direction, en sautant les recommandations hors du filtre actif */
  function step(dir) {
    for (let k = 1; k <= n; k += 1) {
      const i = (state.index + dir * k + n * n) % n;
      if (matches(i)) return i;
    }
    return state.index;
  }

  /** Effet « déchiffrement » du nom (calque décoratif, le vrai nom reste lisible par les lecteurs d'écran) */
  function scramble(el) {
    if (!el || reduceMotion) return;
    const final = el.dataset.scramble;
    cancelAnimationFrame(scrambles.get(el));
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / 520);
      const revealed = Math.floor(progress * final.length);
      el.textContent = [...final]
        .map((ch, k) =>
          k < revealed || !ch.trim() ? ch : SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)]
        )
        .join('');
      if (progress < 1) scrambles.set(el, requestAnimationFrame(tick));
      else el.textContent = final;
    };
    scrambles.set(el, requestAnimationFrame(tick));
  }

  function enter(panel) {
    void panel.offsetWidth; // repart de l'état masqué pour rejouer l'apparition des mots
    panel.classList.add('is-in');
    scramble(panel.querySelector('[data-scramble]'));
  }

  /** Fait défiler la rangée d'onglets (mobile) sans toucher au scroll de la page */
  function revealTab(tab) {
    if (tablist.scrollWidth <= tablist.clientWidth) return;
    const left = tab.offsetLeft - (tablist.clientWidth - tab.offsetWidth) / 2;
    tablist.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function show(index, { user = false, focus = false } = {}) {
    if (user) setAutoplay(false);
    const i = ((index % n) + n) % n;
    const changed = i !== state.index;
    state.index = i;

    tabs.forEach((tab, k) => {
      tab.setAttribute('aria-selected', String(k === i));
      tab.tabIndex = k === i ? 0 : -1;
    });
    panels.forEach((panel, k) => {
      panel.classList.toggle('is-active', k === i);
      panel.inert = k !== i;
      if (k !== i) panel.classList.remove('is-in');
    });
    stories.forEach((story, k) => {
      story.classList.toggle('is-past', k < i);
      story.classList.toggle('is-current', k === i);
    });
    counter.textContent = pad(i + 1);

    if (changed) {
      if (state.visible) enter(panels[i]);
      restartStory();
      revealTab(tabs[i]);
    }
    if (focus) tabs[i].focus();
  }

  function paintMarks(scope) {
    scope.querySelectorAll('.reco-mark[data-trait]').forEach((mark) => {
      mark.classList.toggle('is-hot', mark.dataset.trait === state.trait);
    });
  }

  function setTrait(id) {
    state.trait = id;
    section.classList.toggle('has-trait', Boolean(id));
    tabs.forEach((tab, k) => tab.classList.toggle('is-dim', !matches(k)));
    paintMarks(section);
    if (id && !matches(state.index)) show(step(1), { user: true });
  }

  /* Interactions */
  tablist.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) show(Number(tab.dataset.index), { user: true });
  });

  tablist.addEventListener('keydown', (e) => {
    const moves = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let target = null;
    if (e.key in moves) target = state.index + moves[e.key];
    else if (e.key === 'Home') target = 0;
    else if (e.key === 'End') target = n - 1;
    if (target === null) return;
    e.preventDefault();
    show(target, { user: true, focus: true });
  });

  spot.addEventListener('click', (e) => {
    const stepBtn = e.target.closest('[data-reco-step]');
    if (stepBtn) show(step(Number(stepBtn.dataset.recoStep)), { user: true });
    else if (e.target.closest('[data-reco-play]')) setAutoplay(!state.autoplay);
  });

  root.querySelector('.reco-spot__stories').addEventListener('animationend', (e) => {
    if (state.autoplay && e.target.parentElement === stories[state.index]) show(step(1));
  });

  // Halo qui suit le curseur
  spot.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const rect = spot.getBoundingClientRect();
    spot.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    spot.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`);
  });

  // Balayage horizontal au doigt ; le clic qui suit un balayage est ignoré
  let swipe = null;
  let swallowClick = false;
  spot.addEventListener('pointerdown', (e) => {
    swallowClick = false;
    swipe = e.pointerType === 'mouse' ? null : { x: e.clientX, y: e.clientY };
  });
  spot.addEventListener('pointerup', (e) => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x;
    const dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swallowClick = true;
      show(step(dx < 0 ? 1 : -1), { user: true });
    }
  });
  spot.addEventListener('pointercancel', () => (swipe = null));
  spot.addEventListener(
    'click',
    (e) => {
      if (!swallowClick) return;
      swallowClick = false;
      e.stopPropagation();
      e.preventDefault();
    },
    true
  );

  // Pauses temporaires (le défilement reprend tout seul quand la raison disparaît)
  root.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && hold('hover', true));
  root.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && hold('hover', false));
  root.addEventListener('focusin', (e) => {
    hold('focus', e.target.matches(':focus-visible') && !e.target.closest('.reco-controls'));
  });
  root.addEventListener('focusout', (e) => {
    if (!root.contains(e.relatedTarget)) hold('focus', false);
  });
  document.addEventListener('visibilitychange', () => hold('hidden', document.hidden));

  const wide = window.matchMedia('(min-width: 960px)');
  const syncOrientation = () => tablist.setAttribute('aria-orientation', wide.matches ? 'vertical' : 'horizontal');
  syncOrientation();
  wide.addEventListener('change', syncOrientation);

  setAutoplay(!reduceMotion);
  show(0);

  // La première citation s'écrit quand la section arrive à l'écran ; hors écran, le défilement s'arrête
  if ('IntersectionObserver' in window) {
    hold('offscreen', true);
    new IntersectionObserver(
      ([entry]) => {
        hold('offscreen', !entry.isIntersecting);
        if (entry.isIntersecting && !state.visible) {
          state.visible = true;
          enter(panels[state.index]);
          restartStory();
        }
      },
      { threshold: 0.35 }
    ).observe(root);
  } else {
    state.visible = true;
    enter(panels[state.index]);
  }

  return {
    root,
    panels,
    show,
    setAutoplay,
    setTrait,
    paintMarks,
    get index() {
      return state.index;
    },
  };
}

/* ── Liseuse : recommandation complète ───────────────────────────── */

function createReader(ctx, stage) {
  const { section, lang, t, items, matchers, reduceMotion, sourceUrl } = ctx;
  const dialog = section.querySelector('[data-reco-reader]');
  if (!dialog || typeof dialog.showModal !== 'function') return null;
  const n = items.length;

  dialog.setAttribute('aria-labelledby', 'reco-reader-name');
  dialog.innerHTML = `
    <div class="reco-reader__sheet">
      <div class="reco-reader__progress" aria-hidden="true"><span></span></div>
      <header class="reco-reader__head">
        <div class="reco-reader__who" data-reader-who></div>
        <button type="button" class="reco-ctrl" data-reader-close aria-label="${esc(t.close)}">${ICONS.close}</button>
      </header>
      <div class="reco-reader__scroll" tabindex="0" role="region" aria-label="${esc(t.readerText)}">
        <p class="reco-meta" data-reader-meta></p>
        ${
          lang === 'en'
            ? `<div class="reco-reader__lang" role="group" aria-label="${esc(t.langGroup)}">
          <button type="button" data-reader-lang="en" aria-pressed="true">${esc(t.showTranslation)}</button>
          <button type="button" data-reader-lang="fr" aria-pressed="false">${esc(t.showOriginal)}</button>
        </div>`
            : ''
        }
        <div class="reco-reader__text" data-reader-text></div>
      </div>
      <footer class="reco-reader__foot">
        ${
          sourceUrl
            ? `<a class="reco-reader__source" href="${esc(sourceUrl)}" target="_blank" rel="noopener">${ICONS.linkedin}<span>${esc(t.viewOriginal)}</span><span aria-hidden="true">↗</span></a>`
            : '<span></span>'
        }
        <div class="reco-reader__nav">
          <button type="button" class="reco-ctrl" data-reader-step="-1">${ICONS.prev}</button>
          <span class="reco-reader__count" data-reader-count aria-hidden="true"></span>
          <button type="button" class="reco-ctrl" data-reader-step="1">${ICONS.next}</button>
        </div>
      </footer>
    </div>`;

  const sheet = dialog.querySelector('.reco-reader__sheet');
  const progressEl = dialog.querySelector('.reco-reader__progress span');
  const whoEl = dialog.querySelector('[data-reader-who]');
  const scrollEl = dialog.querySelector('.reco-reader__scroll');
  const metaEl = dialog.querySelector('[data-reader-meta]');
  const textEl = dialog.querySelector('[data-reader-text]');
  const countEl = dialog.querySelector('[data-reader-count]');
  const prevBtn = dialog.querySelector('[data-reader-step="-1"]');
  const nextBtn = dialog.querySelector('[data-reader-step="1"]');
  const langBtns = [...dialog.querySelectorAll('[data-reader-lang]')];

  const state = { index: 0, lang, trigger: null };

  function updateProgress() {
    const max = scrollEl.scrollHeight - scrollEl.clientHeight;
    progressEl.style.setProperty('--p', max > 0 ? String(scrollEl.scrollTop / max) : '1');
  }

  function renderText() {
    const p = items[state.index];
    const shown = pick(p.quote_full, state.lang);
    textEl.lang = shown.lang;
    textEl.innerHTML =
      paragraphsHTML(typo(shown.text), matchers[shown.lang]) +
      (shown.lang !== p.quote_full.lang ? `<p class="reco-reader__note">${esc(t.translationNote)}</p>` : '');
    stage.paintMarks(textEl);
    langBtns.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.readerLang === shown.lang)));
  }

  function fill(index) {
    state.index = ((index % n) + n) % n;
    const p = items[state.index];
    const prev = items[(state.index - 1 + n) % n];
    const next = items[(state.index + 1) % n];

    whoEl.innerHTML = `
      ${avatar(p, 'lg')}
      <p class="reco-reader__id">
        <strong id="reco-reader-name">${esc(p.name)}</strong>
        <span>${esc(roleLine(p, lang))}</span>
        <span>${esc(relation(p, lang))}</span>
      </p>`;
    metaEl.innerHTML = `${ICONS.linkedin}<span>${esc(t.source)}</span><span aria-hidden="true">·</span><time datetime="${esc(p.date)}">${esc(formatDate(p.date, t.locale))}</time><span aria-hidden="true">·</span><span>${esc(t.readTime(readingMinutes(pick(p.quote_full, state.lang).text)))}</span>`;
    renderText();

    countEl.textContent = `${pad(state.index + 1)} / ${pad(n)}`;
    prevBtn.setAttribute('aria-label', `${t.prev}${t.colon}${prev.name}`);
    nextBtn.setAttribute('aria-label', `${t.next}${t.colon}${next.name}`);
    prevBtn.title = prev.name;
    nextBtn.title = next.name;

    scrollEl.scrollTop = 0;
    updateProgress();
  }

  function go(dir) {
    if (reduceMotion) {
      fill(state.index + dir);
      return;
    }
    sheet.classList.add('is-swapping');
    window.setTimeout(() => {
      fill(state.index + dir);
      sheet.classList.remove('is-swapping');
    }, 140);
  }

  function open(index, trigger) {
    state.trigger = trigger || null;
    stage.setAutoplay(false);
    fill(index);
    dialog.classList.remove('is-closing');
    document.documentElement.classList.add('reco-lock');
    dialog.showModal();
    requestAnimationFrame(updateProgress);
  }

  function close() {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    if (reduceMotion) {
      dialog.close();
      return;
    }
    dialog.classList.add('is-closing');
    window.setTimeout(() => dialog.close(), 180);
  }

  dialog.addEventListener('close', () => {
    dialog.classList.remove('is-closing');
    document.documentElement.classList.remove('reco-lock');
    // La vitrine se cale sur la dernière recommandation lue
    if (state.index !== stage.index) stage.show(state.index);
    const trigger = state.trigger;
    const target =
      trigger && trigger.isConnected && !trigger.closest('[inert]')
        ? trigger
        : stage.panels[stage.index].querySelector('[data-reco-read]');
    target?.focus();
  });

  // Échap : fermeture animée plutôt que la fermeture sèche par défaut
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });

  // Clic sur le fond (on ignore une sélection de texte qui déborderait de la feuille)
  let downOnBackdrop = false;
  dialog.addEventListener('pointerdown', (e) => (downOnBackdrop = e.target === dialog));

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      if (downOnBackdrop) close();
      return;
    }
    if (e.target.closest('[data-reader-close]')) {
      close();
      return;
    }
    const stepBtn = e.target.closest('[data-reader-step]');
    if (stepBtn) {
      go(Number(stepBtn.dataset.readerStep));
      return;
    }
    const langBtn = e.target.closest('[data-reader-lang]');
    if (langBtn) {
      state.lang = langBtn.dataset.readerLang;
      renderText();
      scrollEl.scrollTop = 0;
      updateProgress();
    }
  });

  dialog.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      go(e.key === 'ArrowRight' ? 1 : -1);
    }
  });

  scrollEl.addEventListener('scroll', updateProgress, { passive: true });

  return { open };
}
