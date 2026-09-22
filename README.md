# AURELIA // 21·09

A cinematic single-page experience — dark theme, gold accents, Cormorant Garamond + Inter. Built as a multi-file, zero-build static site: no bundler, no framework, no server-side code.

Live: **https://dreamcoder08.github.io/aurelia21/**

## Architecture

**Zero build.** GitHub Pages serves `index.html` and `assets/` from the root of `main` exactly as committed — there is no compile, bundle, or transpile step in production. `npm install` and the dev server exist only to run the automated test suite.

```
index.html              # markup, plus a <noscript> fallback so content is readable without JS
assets/
  css/
    tokens.css          # design tokens: colors, type, spacing — the only file allowed raw hex/font-family literals
    base.css            # resets, global elements, reduced-motion + focus-visible rules
    layout.css          # structural/grid rules
    components.css      # reusable UI pieces (chapter-nav, gate, etc.)
    sections.css        # per-section styling
  js/
    main.js             # single entry point, loaded as <script type="module">
    gate.js             # entry gate / unlock interaction
    reveal.js           # scroll-triggered reveal animations (IntersectionObserver)
    nav.js              # chapter navigation, scroll progress, active-section tracking
    secret.js           # hidden/secret section behavior
    ambient.js           # ambient/background effects
  img/
    aurelia-hero.jpg, aurelia-record.jpg, favicon.svg
tests/
  serve.mjs             # zero-dependency static file server used only for tests
  playwright.config.js  # 4 viewport projects: phone, tablet, laptop, desktop
  e2e/                  # Playwright + axe-core specs (see below)
docs/superpowers/specs/2026-09-21-aurelia21-professional-design.md   # design/behavior spec for this redesign
```

## Dev setup

```bash
npm install
npx playwright install chromium
```

## Running tests

Tests spin up `tests/serve.mjs` (plain Node `http` server) and drive real Chromium via Playwright across four viewports (phone 390×844, tablet 768×1024, laptop 1280×800, desktop 1440×900).

```bash
npm test          # headless, all specs × all viewports
npm run test:headed
```

Suites covered: smoke, image extraction/attributes, entry gate, chapter navigation, secret section, no-JS fallback, social/meta tags, responsive layout (touch targets, no horizontal scroll, safe-area, reduced motion), and accessibility (axe-core, zero serious/critical violations in both locked and unlocked states).

## Constraints

- No raw hex color literals or repeated `font-family` declarations outside `assets/css/tokens.css`.
- `index.html` stays at or under 70KB.
- Spanish copy, tone, and visual identity are unchanged from the original single-file version.

## Origin

Extracted from `Dreamcoder08/DreamFolio` (`public/aurelia21/index.html`), then restructured from one monolithic file into this tokenized, modular, tested project.
