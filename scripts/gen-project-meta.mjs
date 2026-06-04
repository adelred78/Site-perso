/**
 * Renseigne les métadonnées <head> des pages détail projet (FR + EN) à partir de
 * data/projects.json : <title>, description, Open Graph, canonical, hreflang, og:url,
 * plus un href de repli sur le switch de langue (au cas où le JS ne charge pas).
 *
 * Les pages détail rendent leur contenu en JS ; sans ces métadonnées statiques, les
 * crawlers et aperçus sociaux (LinkedIn, WhatsApp, Slack…) voient une page vide.
 *
 * Idempotent : relançable à chaque ajout/modif de projet.
 *   node scripts/gen-project-meta.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://adelredjemi.vercel.app';
const SUFFIX = 'Adel Redjemi';

const escAttr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escText = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const loc = (field, lang) =>
  field == null ? '' : typeof field === 'string' ? field : field[lang] ?? field.fr ?? '';

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/projects.json'), 'utf8'));

const LANGS = [
  { lang: 'fr', dir: 'fr/projets', base: (s) => `/fr/projets/${s}`, other: (s) => `/en/projects/${s}` },
  { lang: 'en', dir: 'en/projects', base: (s) => `/en/projects/${s}`, other: (s) => `/fr/projets/${s}` },
];

let patched = 0;
const missing = [];

for (const p of data.projects) {
  const urlFr = `${SITE}/fr/projets/${p.slug}`;
  const urlEn = `${SITE}/en/projects/${p.slug}`;

  for (const { lang, dir, base, other } of LANGS) {
    const file = path.join(ROOT, dir, `${p.slug}.html`);
    if (!fs.existsSync(file)) {
      missing.push(`${dir}/${p.slug}.html`);
      continue;
    }

    const title = `${loc(p.title, lang)} — ${SUFFIX}`;
    const desc = (loc(p.pitch, lang) || loc(p.subtitle, lang)).replace(/\s+/g, ' ').trim();
    const ogImg = p.images?.og ? SITE + p.images.og : '';
    const canonical = SITE + base(p.slug);

    let html = fs.readFileSync(file, 'utf8');

    // 1. Remplacements simples (toujours écrasés → idempotents)
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escText(title)}</title>`);
    html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escAttr(desc)}" />`);
    html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escAttr(title)}" />`);
    html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${escAttr(desc)}" />`);
    html = html.replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${escAttr(ogImg)}" />`);
    html = html.replace(/<link rel="alternate" hreflang="fr"[^>]*>/, `<link rel="alternate" hreflang="fr" href="${urlFr}" />`);
    html = html.replace(/<link rel="alternate" hreflang="en"[^>]*>/, `<link rel="alternate" hreflang="en" href="${urlEn}" />`);

    // 2. Lignes insérées : on purge l'ancienne version avant de réinsérer
    html = html.replace(/\n[ \t]*<link rel="alternate" hreflang="x-default"[^>]*>/g, '');
    html = html.replace(/\n[ \t]*<link rel="canonical"[^>]*>/g, '');
    html = html.replace(/\n[ \t]*<meta property="og:url"[^>]*>/g, '');

    html = html.replace(
      /([ \t]*)(<link rel="alternate" hreflang="en" href="[^"]*" \/>)/,
      `$1$2\n$1<link rel="alternate" hreflang="x-default" href="${urlFr}" />\n$1<link rel="canonical" href="${canonical}" />`
    );
    html = html.replace(
      /([ \t]*)(<meta property="og:image"[^>]*>)/,
      `$1$2\n$1<meta property="og:url" content="${canonical}" />`
    );

    // 3. Repli du switch de langue (le JS l'écrase ensuite via getOtherLangUrl)
    html = html.replace(
      /<a href="#"( class="header__lang" data-lang-switch)/,
      `<a href="${other(p.slug)}"$1`
    );

    fs.writeFileSync(file, html);
    patched++;
  }
}

console.log(`✅ pages détail mises à jour : ${patched}/${data.projects.length * 2}`);
if (missing.length) console.warn('⚠️  fichiers manquants :', missing.join(', '));
