# Adel Redjemi — Portfolio v2.0

Portfolio personnel bilingue (FR / EN) d'Adel Redjemi, étudiant en Bachelor Informatique à l'EPSI Paris.

🌐 **Live** : [adelredjemi.vercel.app](https://adelredjemi.vercel.app)

---

## 🧱 Stack

- **HTML5 / CSS3 / JavaScript** vanilla — aucun framework
- **JSON** comme source unique pour les projets et les traductions
- **Vercel** pour l'hébergement (rewrites + clean URLs)
- **Formspree** pour le formulaire de contact (config à compléter)

---

## 📂 Structure

```
/
├── index.html              → Redirection vers la langue navigateur
├── fr/                     → Site français
│   ├── index.html          → Accueil
│   ├── projets.html        → Liste des projets (filtres)
│   ├── a-propos.html       → À propos / Parcours
│   ├── contact.html        → Formulaire de contact
│   └── projets/
│       └── _template.html  → Template détail projet (rendu via JS)
├── en/                     → Site anglais (miroir)
│   ├── index.html
│   ├── projects.html
│   ├── about.html
│   ├── contact.html
│   └── projects/
│       └── _template.html
├── assets/
│   ├── img/
│   │   ├── me/             → Photos pro
│   │   ├── projects/       → Captures projets (par slug)
│   │   └── og/             → Images Open Graph (1200x630)
│   ├── icons/              → SVG icônes tech (sprite)
│   ├── cv/                 → CVs PDF (FR + EN)
│   └── certificates/       → Certificats des awards
├── css/
│   ├── tokens.css          → Variables CSS (à customiser par Gemini)
│   ├── base.css            → Reset + typo + accessibilité
│   └── components.css      → Composants (header, card, button, form...)
├── js/
│   ├── main.js             → Point d'entrée
│   ├── nav.js              → Header + i18n switch
│   ├── projects.js         → Chargement & rendu des projets
│   └── contact.js          → Soumission du formulaire
├── data/
│   ├── projects.json       → Source unique des 10 projets (bilingue)
│   └── i18n/
│       ├── fr.json         → Strings d'interface FR
│       └── en.json         → Strings d'interface EN
├── vercel.json             → Rewrites pour les détails projet + headers
├── sitemap.xml             → Sitemap bilingue
├── robots.txt
└── favicon.ico
```

---

## 🚀 Développement local

```bash
# Avec n'importe quel serveur statique (le projet n'a pas de build step) :
npx serve .

# Ou avec Python :
python3 -m http.server 3000

# Ou avec Vercel CLI (recommandé — respecte vercel.json) :
npx vercel dev
```

> ⚠️ Les URLs propres (`/fr/projets/smartbike`) ne fonctionnent qu'avec `vercel dev` ou en production sur Vercel — le serveur statique simple servira `/fr/projets/_template.html` directement.

---

## 🌍 i18n

### URLs

| FR | EN |
|----|-----|
| `/fr/` | `/en/` |
| `/fr/projets` | `/en/projects` |
| `/fr/projets/[slug]` | `/en/projects/[slug]` |
| `/fr/a-propos` | `/en/about` |
| `/fr/contact` | `/en/contact` |

### Switcher

Géré par `js/nav.js`. Le lien dans le header pointe automatiquement vers l'URL équivalente dans l'autre langue.

### Contenu

- **Pages statiques** (home, projets, about, contact) : texte directement dans le HTML, **dupliqué par langue**.
- **Détail projet** : un seul template par langue (`_template.html`) qui lit `projects.json` et rend le contenu selon le slug dans l'URL et la langue.
- **Strings d'UI dynamiques** (filtres, labels) : `data/i18n/{lang}.json`.

---

## ➕ Ajouter un projet

1. Ouvre `data/projects.json`.
2. Ajoute une entrée dans le tableau `projects` en suivant le schéma des projets existants.
3. Pose les images du projet dans `assets/img/projects/[slug]/`.
4. Crée les pages détail `fr/projets/[slug].html` et `en/projects/[slug].html` (copie d'un fichier existant).
5. Ajoute les URLs FR + EN dans `sitemap.xml`.
6. Lance `node scripts/gen-project-meta.mjs` pour renseigner les métadonnées SEO (`<title>`, description, Open Graph, canonical, hreflang) des pages détail à partir du JSON. Sans ça, les aperçus de partage (LinkedIn, WhatsApp…) sont vides car le contenu est rendu en JS.
7. Commit + push → Vercel redéploie tout seul.

---

## 🎨 UI (workflow avec Gemini)

- Les classes CSS sont déjà en place dans le HTML.
- Gemini customise `css/tokens.css` (variables) et peut enrichir `css/components.css`.
- Pas besoin de toucher au HTML ni au JS pour changer l'apparence.

Voir le brief UI complet : [brief Gemini ci-dessous](#brief-ui-pour-gemini).

---

## 📬 Configuration du formulaire de contact

1. Créer un compte sur [formspree.io](https://formspree.io) avec `redjemitechkraft@gmail.com`.
2. Créer un nouveau formulaire et récupérer l'endpoint (`https://formspree.io/f/xxxxxxxx`).
3. Coller l'endpoint dans l'attribut `data-formspree-endpoint` du `<form>` sur :
   - `fr/contact.html`
   - `en/contact.html`

---

## 🚢 Déploiement

Connecté à Vercel :

1. Push sur la branche `main` → déploiement automatique.
2. URLs propres et rewrites configurés dans `vercel.json`.
3. Domaine personnalisé : à configurer plus tard dans le dashboard Vercel.

---

## ♿ Accessibilité

- Skip link "Aller au contenu" pour la navigation clavier
- Focus visible sur tous les éléments interactifs
- `aria-*` pour le burger, le formulaire, le switcher de langue
- Respect de `prefers-reduced-motion`
- Contraste WCAG AA (à finaliser avec Gemini sur la palette)

---

## 📜 Licence

© 2026 Adel Redjemi. Code et contenu personnels, tous droits réservés.
