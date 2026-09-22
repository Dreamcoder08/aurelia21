# AURELIA 21 Professional Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the AURELIA 21 single-file page into a multi-file, no-build project with a real design system, modular JS, automated Playwright/axe tests, and elite responsive/a11y execution — without changing copy, tone, or visual identity.

**Architecture:** Native HTML/CSS/JS served as-is by GitHub Pages. Inline `<style>` splits into five CSS files led by `tokens.css`; two inline scripts become five ES modules wired by `main.js`; both base64 JPEGs become lazy-loaded files. Playwright (dev-only dependency, HTTP server via Node) pins behavior across four viewports plus axe-core scans.

**Tech Stack:** HTML5, CSS custom properties, native ES modules, Node ≥20 (installed: v26.7.0), Playwright 1.63, @axe-core/playwright. No bundler, no transpiler, no npm build step.

**Spec:** `docs/superpowers/specs/2026-09-21-aurelia21-professional-design.md`

## Global Constraints

- Zero build: GitHub Pages serves `index.html` from `main`, path `/`; `npm install` is dev-only.
- Spanish copy, emotional content, and visual identity (dark `#070706` + gold, Cormorant Garamond + Inter) unchanged.
- Conventional Commits, no AI attribution, no Co-Authored-By.
- No raw hex color literals in CSS outside `tokens.css`; no repeated `font-family` outside `tokens.css`.
- Final `index.html` ≤ 70KB (spec target ≈40–60KB; acceptance: "≈60KB or less" — 70KB ceiling allows meta/headline growth, images are the real weight).
- Tests run over HTTP only (ES modules fail on `file://`).
- Delivery: work-unit commits on branch `feat/professional-redesign`, then fast-forward `main` and push (publish explicitly authorized by the user).
- Viewports: phone 390×844, tablet 768×1024, laptop 1280×800, desktop 1440×900.
- axe acceptance: zero `serious`/`critical` violations in locked AND unlocked states.

## Review Focus

1. **ES modules over `file://` are blocked by CORS** — every Playwright run must go through `tests/serve.mjs` (`webServer` in config). Owned by Task 1: `smoke.spec.js` loads `/` over `http://localhost:4173` and asserts `#gate` visible.
2. **Gate interaction leaks state across tests** (click adds `.hidden`, removes `#gate` after 1s, removes `body.no-scroll`) — each spec must use Playwright's fresh page per test; never reuse a page after entering. Owned by Task 4: `gate.spec.js` opens its own page and asserts pre- and post-click state.
3. **Reveal animations leave content at `opacity:0` until scrolled** — axe or visibility checks on the unlocked state would scan an unrendered page. Owned by Task 8: `a11y.spec.js` scrolls through all sections before analyzing the unlocked state.
4. **Fixed widths (`min-width:260px` record cards, `.letters span{font-size:5rem}`) can overflow at 390px** — horizontal scroll is the most likely responsive regression. Owned by Task 7: `responsive.spec.js` asserts `scrollWidth ≤ clientWidth` at every viewport after unlock.
5. **Extracted images without intrinsic dimensions cause CLS** — the hero `<img>` (line 511) and record `<img>` (line 567) must carry `width`/`height`. Owned by Task 2: `images.spec.js` asserts both attributes plus `decoding="async"` and lazy-loading on the below-fold image.

---

### Task 1: Playwright harness + smoke test

**Files:**
- Create: `package.json`, `tests/serve.mjs`, `tests/playwright.config.js`, `tests/e2e/smoke.spec.js`
- Test: `tests/e2e/smoke.spec.js`

**Interfaces:**
- Consumes: existing `index.html` (unchanged this task).
- Produces: `npm test` script; server on `http://localhost:4173` serving repo root; baseURL configured for all later specs.

- [ ] **Step 1: Write the failing smoke test**

```js
// tests/e2e/smoke.spec.js
import { test, expect } from '@playwright/test';

test('loads with gate and correct title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('AURELIA // 21·09');
  await expect(page.locator('#gate')).toBeVisible();
  await expect(page.locator('#enter-button')).toBeVisible();
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test --config=tests/playwright.config.js`
Expected: FAIL — config/`package.json` do not exist yet.

- [ ] **Step 3: Create the harness**

```js
// tests/serve.mjs — static server, no dependencies
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), '..'));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

createServer(async (req, res) => {
  const path = normalize(join(root, (req.url || '/').split('?')[0] === '/' ? '/index.html' : (req.url || '/').split('?')[0]));
  if (!path.startsWith(root)) { res.writeHead(403); res.end(); return; }
  try {
    const data = await readFile(path);
    res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}).listen(4173, () => console.log('serving http://localhost:4173'));
```

```js
// tests/playwright.config.js
import { defineConfig } from '@playwright/test';

const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1440, height: 900 },
];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  webServer: {
    command: 'node serve.mjs',
    port: 4173,
    reuseExistingServer: true,
  },
  use: { baseURL: 'http://localhost:4173' },
  projects: viewports.map((v) => ({
    name: v.name,
    use: { viewport: { width: v.width, height: v.height } },
  })),
});
```

```json
// package.json
{
  "name": "aurelia21",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "playwright test --config=tests/playwright.config.js",
    "test:headed": "playwright test --config=tests/playwright.config.js --headed"
  },
  "devDependencies": {
    "@playwright/test": "^1.63.0",
    "@axe-core/playwright": "^4.10.2"
  }
}
```

- [ ] **Step 4: Install dev dependencies + Chromium**

Run: `npm install && npx playwright install chromium`
Expected: lockfile created; browser installed.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS — 1 test × 4 viewport projects.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tests/
git commit -m "test: add Playwright harness with 4-viewport smoke test"
```

---

### Task 2: Extract base64 JPEGs to files

**Files:**
- Create: `assets/img/aurelia-hero.jpg`, `assets/img/aurelia-record.jpg`
- Modify: `index.html` (both `<img>` tags: lines 511 hero, 567 record)
- Test: `tests/e2e/images.spec.js`

**Interfaces:**
- Consumes: Task 1 harness (`npm test`).
- Produces: image paths `assets/img/aurelia-hero.jpg` (hero, above fold), `assets/img/aurelia-record.jpg` (below fold) — referenced by `og:image` in Task 6.

- [ ] **Step 1: Write the failing test**

```js
// tests/e2e/images.spec.js
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('images are files with intrinsic size, hero eager, record lazy', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('#inicio img');
  await expect(hero).toHaveAttribute('src', /assets\/img\/.*\.jpg$/);
  await expect(hero).toHaveAttribute('width', /\d+/);
  await expect(hero).toHaveAttribute('height', /\d+/);
  await expect(hero).toHaveAttribute('decoding', 'async');

  const record = page.locator('#choko img');
  await expect(record).toHaveAttribute('src', /assets\/img\/.*\.jpg$/);
  await expect(record).toHaveAttribute('loading', 'lazy');
  await expect(record).toHaveAttribute('width', /\d+/);
  await expect(record).toHaveAttribute('height', /\d+/);

  const html = await readFile('index.html', 'utf8');
  expect(html).not.toContain('data:image/jpeg');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --project=phone images.spec.js`
Expected: FAIL — `src` still `data:image/jpeg`.

- [ ] **Step 3: Extract both JPEGs**

```bash
mkdir -p assets/img
node -e "
const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const uris=[...html.matchAll(/data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/g)].map(m=>m[1]);
if(uris.length!==2){console.error('expected 2 jpegs, got',uris.length);process.exit(1);}
fs.writeFileSync('assets/img/aurelia-hero.jpg',Buffer.from(uris[0],'base64'));
fs.writeFileSync('assets/img/aurelia-record.jpg',Buffer.from(uris[1],'base64'));
console.log('extracted',uris.length);
"
file assets/img/aurelia-hero.jpg assets/img/aurelia-record.jpg   # note reported WxH for Step 4
```

- [ ] **Step 4: Replace both `<img>` tags**

Hero (line 511) — keep every existing attribute (class, alt if present) and add intrinsic size; **no** `loading="lazy"` (above the fold):

```html
<img src="assets/img/aurelia-hero.jpg" width="REPORTED_W" height="REPORTED_H" decoding="async" …remaining existing attributes… />
```

Record (line 567) — same, plus lazy:

```html
<img src="assets/img/aurelia-record.jpg" width="REPORTED_W" height="REPORTED_H" loading="lazy" decoding="async" …remaining existing attributes… />
```

(`REPORTED_W/H` = dimensions printed by `file` in Step 3.)

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- images.spec.js`
Expected: PASS across 4 viewports. Also `wc -c index.html` ≤ 71680.

- [ ] **Step 6: Commit**

```bash
git add assets/img/ index.html tests/e2e/images.spec.js
git commit -m "perf: extract inline JPEGs to lazy-loaded image files"
```

---

### Task 3: CSS split + token system

**Files:**
- Create: `assets/css/tokens.css`, `assets/css/base.css`, `assets/css/layout.css`, `assets/css/components.css`, `assets/css/sections.css`
- Modify: `index.html` (remove inline `<style>` block(s); add five `<link rel="stylesheet">` tags in order: tokens → base → layout → components → sections, before `</head>` content ends)
- Test: `npm test` (whole suite) + verification commands below

**Interfaces:**
- Consumes: existing CSS currently inside `<style>` (line 13 onward, two `:root` blocks at lines 13 and 244).
- Produces: the token names below — later tasks (7, 8) add rules referencing `--font-*`, `--dur-*`, `--sp-*`, `--content`, `--narrow`, `--z-*`.

- [ ] **Step 1: Move existing tokens verbatim, then extend**

Create `tokens.css`: copy BOTH existing `:root{…}` blocks verbatim (no value edits), then append this extension (merge into a single `:root` if adjacent):

```css
/* —— extended tokens (new) —— */
:root {
  --font-display:"Cormorant Garamond", serif;
  --font-body: Inter, system-ui, sans-serif;

  --fs-h1-hero: clamp(4rem, 12vw, 8.7rem);
  --fs-h1-gate: clamp(3.3rem, 10vw, 6.8rem);
  --fs-h2: clamp(3rem, 8vw, 6rem);
  --fs-lead: clamp(1.24rem, 2.6vw, 1.72rem);
  --fs-sub: clamp(1.45rem, 4vw, 2.35rem);

  --sp-section-y: clamp(5rem, 10vw, 9rem);
  --sp-section-x: clamp(1.25rem, 6vw, 7rem);
  --sp-gap: clamp(2rem, 5vw, 6rem);

  --content: 760px;
  --narrow: 670px;

  --z-canvas: 1;
  --z-chrome: 40;
  --z-overlay: 60;
  --z-gate: 80;

  --gold-rgb: 246, 202, 91; /* for rgba(var(--gold-rgb), a) variants */
}
```

Then:
- Replace ALL ~13 inline `font-family:Inter…` / `font-family:"Cormorant Garamond"…` declarations with `var(--font-body)` / `var(--font-display)`.
- Replace the hard-coded `clamp()` sizes listed in the tokens above with the matching `var(--fs-*)` / `var(--sp-*)` where the literal matches exactly.
- Replace `max-width:760px` / `670px` with `var(--content)` / `var(--narrow)`.
- Replace `rgba(246,202,91,…)` with `rgba(var(--gold-rgb),…)` wherever it appears ≥2 times.
- Collect every `transition-duration`/`animation-duration` literal that appears ≥2 times and add `--dur-*` tokens for them (do not invent durations — tokenize what exists).

- [ ] **Step 2: Split remaining CSS by rubric (each selector exactly once)**

- `base.css` — universal/`html`/`body`/element resets, `::selection`, scrollbars, `.skip-link`, global `:focus-visible`, shared typography defaults, and the global reduced-motion kill switch (Task 7 Step 3 adds it if not already present).
- `layout.css` — `.section`, `.content`, `.narrow`, section flex/grid/padding/max-width rules, and every `@media (max-width:…)` block that changes layout (the rule's media query travels WITH its selector group).
- `components.css` — `.gate*`, `.chapter-nav*`, `.timeline-chip*`, `.experience-progress*`, `.cursor-ring*`, `.grain`, `.secret*`, `.record*`, `.spec-card*`, `.eyebrow`, `.reveal`/`.visible`.
- `sections.css` — per-section art direction: `.hero*`, `.orbit*`, `.petal*`, `.split*`, `.vow*`, `.archive*`, `.final*`, `.endmark*`, `.monogram*`, `.signature*`, `.letters*`, `.narrative*`, `.aurelia-bloom*`, and their media-query variants.

- [ ] **Step 3: Wire the links**

In `index.html` `<head>`, after the fonts `<link>`:

```html
  <link rel="stylesheet" href="assets/css/tokens.css">
  <link rel="stylesheet" href="assets/css/base.css">
  <link rel="stylesheet" href="assets/css/layout.css">
  <link rel="stylesheet" href="assets/css/components.css">
  <link rel="stylesheet" href="assets/css/sections.css">
```

Delete the inline `<style>` block(s).

- [ ] **Step 4: Verify**

Run: `npm test`
Expected: PASS (all specs from Tasks 1–2).

```bash
grep -n '<style' index.html                      # expect: empty
grep -rnE '#[0-9a-fA-F]{3,8}\b' assets/css/ | grep -v tokens.css   # expect: empty
grep -rn 'font-family' assets/css/ | grep -v tokens.css            # expect: empty (or only inside tokens.css)
```

- [ ] **Step 5: Commit**

```bash
git add assets/css/ index.html
git commit -m "refactor: extract CSS into tokenized five-file design system"
```

---

### Task 4: Pin behavior (characterization tests), then modularize JS

**Files:**
- Create: `tests/e2e/gate.spec.js`, `tests/e2e/navigation.spec.js`, `tests/e2e/secret.spec.js`
- Create: `assets/js/gate.js`, `assets/js/reveal.js`, `assets/js/secret.js`, `assets/js/nav.js`, `assets/js/ambient.js`, `assets/js/main.js`
- Modify: `index.html` (replace both inline `<script>` blocks with one module tag)

**Interfaces:**
- Consumes: Task 1 harness; existing behavior in scripts at lines ~651 (gate/reveal/secret-class/canvas) and ~709 (nav/progress/cursor/secret-aria/parallax/sessionStorage).
- Produces: `initGate()`, `initReveal()`, `initSecret()`, `initNav()`, `initAmbient()` — all zero-arg, side-effect-on-call; `main.js` is the only entry.

- [ ] **Step 1: Write the three characterization tests (they pass on CURRENT inline JS)**

```js
// tests/e2e/gate.spec.js
import { test, expect } from '@playwright/test';

test('enter unlocks the site', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#site')).toHaveClass(/locked/);
  await expect(page.locator('body')).toHaveClass(/no-scroll/);
  await page.locator('#enter-button').click();
  await expect(page.locator('#site')).not.toHaveClass(/locked/);
  await expect(page.locator('gate, #gate')).toHaveClass(/hidden/);
  await expect(page.locator('body')).not.toHaveClass(/no-scroll/);
  await expect(page.locator('#inicio h1')).toBeVisible();
});
```

```js
// tests/e2e/navigation.spec.js
import { test, expect } from '@playwright/test';

test('chapter nav sets aria-current and updates timeline label', async ({ page }) => {
  await page.goto('/');
  await page.locator('#enter-button').click();
  await page.locator('.chapter-nav a[data-section="archivo"]').click();
  const archivoLink = page.locator('.chapter-nav a[data-section="archivo"]');
  await expect(archivoLink).toHaveAttribute('aria-current', 'true', { timeout: 5000 });
  await expect(page.locator('#timeline-label')).toHaveText('05 · archive', { timeout: 5000 });
});
```

```js
// tests/e2e/secret.spec.js
import { test, expect } from '@playwright/test';

test('secret toggles open class and aria state', async ({ page }) => {
  await page.goto('/');
  await page.locator('#enter-button').click();
  const trigger = page.locator('#secret-trigger');
  const message = page.locator('#secret-message');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await expect(message).toHaveClass(/open/);
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(message).toHaveAttribute('aria-hidden', 'false');
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(message).not.toHaveClass(/open/);
});
```

- [ ] **Step 2: Run to verify they pass against current code (baseline pin)**

Run: `npm test`
Expected: PASS — all specs green before refactor.

- [ ] **Step 3: Commit the pins**

```bash
git add tests/e2e/gate.spec.js tests/e2e/navigation.spec.js tests/e2e/secret.spec.js
git commit -m "test: pin gate, navigation, and secret behavior before refactor"
```

- [ ] **Step 4: Extract modules (move code verbatim; merge only the secret handler)**

Responsibility map (from the two existing scripts — copy the code, do not rewrite logic):

| Module | Owns (verbatim from current inline code) |
|---|---|
| `gate.js` → `export function initGate()` | `body.no-scroll` add; BOTH enter-button listeners (class flow: `.hidden`/unlock/no-scroll/hero reveals/`gate.remove()` after 1000ms; AND `experience-live` + `sessionStorage.setItem('aurelia-entered','1')`) |
| `reveal.js` → `export function initReveal()` | IntersectionObserver `{threshold:0.18}` adding `.visible` to `.reveal` |
| `secret.js` → `export function initSecret()` | aria init (`aria-expanded=false`, `aria-controls`, `aria-hidden=true`) + ONE click handler: `secretMessage.classList.toggle('open')`, then `requestAnimationFrame` updating aria + label text (merges the two current handlers — same observable result, tests in Step 1 pin it) |
| `nav.js` → `export function initNav()` | `sectionNames`, chapter IntersectionObserver (rootMargin/thresholds, `.active` + `aria-current`, timeline label), nav-link vibrate handler, scroll progress `setProgress` + rAF scroll listener + hero parallax |
| `ambient.js` → `export function initAmbient()` | stars canvas (`resize`/`draw`/resize listener), `pointermove` (`--mx`/`--my` + cursor ring), `pointerover` `.hot` toggle |
| `main.js` | imports + calls in order: `initGate, initReveal, initSecret, initNav, initAmbient` |

```js
// assets/js/main.js (entire entry)
import { initGate } from './gate.js';
import { initReveal } from './reveal.js';
import { initSecret } from './secret.js';
import { initNav } from './nav.js';
import { initAmbient } from './ambient.js';

initGate();
initReveal();
initSecret();
initNav();
initAmbient();
```

In `index.html`, replace BOTH inline `<script>` blocks with exactly one tag just before `</body>`:

```html
  <script type="module" src="assets/js/main.js"></script>
```

- [ ] **Step 5: Run full suite to verify refactor is behavior-neutral**

Run: `npm test`
Expected: PASS — all specs (smoke, images, gate, navigation, secret) × 4 viewports.

- [ ] **Step 6: Commit**

```bash
git add assets/js/ index.html
git commit -m "refactor: split inline scripts into ES modules with single entry"
```

---

### Task 5: Progressive enhancement — page readable without JS

**Files:**
- Test: `tests/e2e/nojs.spec.js`
- Modify: `index.html` (one `<noscript>` block in `<head>`)

**Interfaces:**
- Consumes: `.locked` / `#gate` / `body.no-scroll` class contract (unchanged).
- Produces: no-JS path; no other task depends on it.

- [ ] **Step 1: Write the failing test**

```js
// tests/e2e/nojs.spec.js
import { test, expect } from '@playwright/test';

test('content is readable with JavaScript disabled', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('#gate')).toBeHidden();
  await expect(page.locator('#inicio h1')).toBeVisible();
  await expect(page.locator('#flor h2')).toBeVisible();
  await ctx.close();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --project=phone nojs.spec.js`
Expected: FAIL — gate visible, `#site.locked` hides content.

- [ ] **Step 3: Add the noscript override**

Inside `<head>` of `index.html`:

```html
    <noscript>
      <style>
        #gate { display: none !important; }
        #site { visibility: visible !important; opacity: 1 !important; }
        body { overflow: auto !important; }
        .reveal { opacity: 1 !important; transform: none !important; }
      </style>
    </noscript>
```

Note: adjust the `#site` declarations to whatever `.locked` actually sets (read `assets/css/components.css` — override the exact properties `.locked` uses: likely `visibility:hidden` and/or `opacity:0`/`filter`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- nojs.spec.js`
Expected: PASS on all 4 viewports.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/e2e/nojs.spec.js
git commit -m "feat: render content without JavaScript via noscript fallback"
```

---

### Task 6: Social meta + external favicon

**Files:**
- Create: `assets/img/favicon.svg`
- Modify: `index.html` `<head>`
- Test: `tests/e2e/meta.spec.js`

**Interfaces:**
- Consumes: `assets/img/aurelia-hero.jpg` (Task 2); canonical URL `https://dreamcoder08.github.io/aurelia21/`.
- Produces: `og:image` absolute URL `https://dreamcoder08.github.io/aurelia21/assets/img/aurelia-hero.jpg` (spec §7).

- [ ] **Step 1: Write the failing test**

```js
// tests/e2e/meta.spec.js
import { test, expect } from '@playwright/test';

test('social meta, canonical, and external favicon present', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /AURELIA/);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /Choko/);
  await expect(page.locator('meta[property="og:image"]'))
    .toHaveAttribute('content', 'https://dreamcoder08.github.io/aurelia21/assets/img/aurelia-hero.jpg');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  await expect(page.locator('link[rel="canonical"]'))
    .toHaveAttribute('href', 'https://dreamcoder08.github.io/aurelia21/');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', 'assets/img/favicon.svg');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --project=phone meta.spec.js`
Expected: FAIL — tags absent / icon still data URI.

- [ ] **Step 3: Extract favicon + add meta**

```bash
mkdir -p assets/img
node -e "
const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const m=html.match(/href=\"data:image\/svg\+xml;base64,([A-Za-z0-9+/=]+)\"/);
if(!m){console.error('favicon data uri not found');process.exit(1);}
fs.writeFileSync('assets/img/favicon.svg',Buffer.from(m[1],'base64'));
console.log('favicon written');
"
```

In `<head>`, replace the data-URI icon `<link>` with `<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">` and add:

```html
    <meta property="og:type" content="website"/>
    <meta property="og:title" content="AURELIA // 21·09"/>
    <meta property="og:description" content="AURELIA // 21·09 — Para Vivian ‘Choko’, de Moshi."/>
    <meta property="og:url" content="https://dreamcoder08.github.io/aurelia21/"/>
    <meta property="og:image" content="https://dreamcoder08.github.io/aurelia21/assets/img/aurelia-hero.jpg"/>
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="AURELIA // 21·09"/>
    <meta name="twitter:description" content="AURELIA // 21·09 — Para Vivian ‘Choko’, de Moshi."/>
    <meta name="twitter:image" content="https://dreamcoder08.github.io/aurelia21/assets/img/aurelia-hero.jpg"/>
    <link rel="canonical" href="https://dreamcoder08.github.io/aurelia21/"/>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- meta.spec.js`
Expected: PASS × 4 viewports.

- [ ] **Step 5: Commit**

```bash
git add index.html assets/img/favicon.svg tests/e2e/meta.spec.js
git commit -m "feat: add Open Graph, Twitter card, canonical, and file favicon"
```

---

### Task 7: Responsive hardening (scroll, touch targets, reduced motion, safe areas)

**Files:**
- Test: `tests/e2e/responsive.spec.js`
- Modify: `assets/css/layout.css`, `assets/css/components.css`, `assets/css/base.css` (as diagnostics dictate)

**Interfaces:**
- Consumes: token system (Task 3); chapter-nav markup (unchanged).
- Produces: `:focus-visible` global rule consumed by Task 8 acceptance; reduced-motion kill switch.

- [ ] **Step 1: Write the failing tests**

```js
// tests/e2e/responsive.spec.js
import { test, expect } from '@playwright/test';

test('no horizontal scroll after unlock', async ({ page }) => {
  await page.goto('/');
  await page.locator('#enter-button').click();
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('chapter nav hit area is at least 44px', async ({ page }) => {
  await page.goto('/');
  await page.locator('#enter-button').click();
  const box = await page.locator('.chapter-nav a[data-section="flor"]').boundingBox();
  expect(box).not.toBeNull();
  expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
});
```

- [ ] **Step 2: Run tests to find real failures**

Run: `npm test -- responsive.spec.js`
Expected: likely FAIL on phone (touch target) and possibly horizontal scroll. Record which projects fail.

- [ ] **Step 3: Fix what failed (do not touch passing rules)**

- **Touch target:** in `components.css`, make each `.chapter-nav a` a ≥44×44 flex-centered hit area while keeping the visual dot the same size — the `<a>` grows transparently, the dot stays via its `::after`/background:
  ```css
  .chapter-nav a { min-width: 44px; min-height: 44px; display: grid; place-items: center; }
  .chapter-nav a::after { /* existing dot visual — keep size/appearance */ }
  ```
- **Horizontal overflow:** diagnose the offender, then fix minimally:
  ```js
  // run in page.evaluate to find offenders
  [...document.querySelectorAll('body *')]
    .filter(el => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
    .map(el => el.tagName + '.' + el.className)
  ```
  Fix by `max-width:100%`, `overflow-wrap`, flex-wrap, or converting the brittle row to grid — preserve visuals.
- **Safe areas** (add regardless, `layout.css`):
  ```css
  .section { padding-left: max(var(--sp-section-x), env(safe-area-inset-left)); padding-right: max(var(--sp-section-x), env(safe-area-inset-right)); }
  ```
- **Reduced motion kill switch** (add to `base.css` regardless):
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: .01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: .01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
- **Focus visibility** (add to `base.css` regardless — required by Task 8):
  ```css
  :where(a, button, [tabindex]):focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 3px;
  }
  ```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- responsive.spec.js` then `npm test`
Expected: PASS everywhere; no regressions.

- [ ] **Step 5: Commit**

```bash
git add assets/css/ tests/e2e/responsive.spec.js
git commit -m "fix: harden responsive layout, touch targets, and reduced motion"
```

---

### Task 8: Accessibility pass (axe + contrast)

**Files:**
- Test: `tests/e2e/a11y.spec.js`
- Modify: `assets/css/tokens.css` (contrast token tweaks only), possibly `components.css`

**Interfaces:**
- Consumes: reveal/gate behavior; focus-visible rule (Task 7).
- Produces: axe-clean acceptance for spec §9.7.

- [ ] **Step 1: Write the failing test**

```js
// tests/e2e/a11y.spec.js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const scan = async (page) => {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
};

test('locked state: no serious/critical violations', async ({ page }) => {
  await page.goto('/');
  expect(await scan(page)).toEqual([]);
});

test('unlocked state: no serious/critical violations after full scroll', async ({ page }) => {
  await page.goto('/');
  await page.locator('#enter-button').click();
  await page.evaluate(async () => {
    const step = innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
  expect(await scan(page)).toEqual([]);
});
```

- [ ] **Step 2: Run test to verify it fails (baseline)**

Run: `npm test -- a11y.spec.js`
Expected: likely FAIL listing violations (candidates: `color-contrast` on `--muted` text, `target-size` on nav dots if not fixed by Task 7, missing image `alt`).

- [ ] **Step 3: Fix each reported violation**

- `color-contrast`: raise `--muted` / affected text tokens in `tokens.css` ONLY until ratio ≥ 4.5:1 (use the ratio axe prints; adjust lightness, keep hue).
- `image-alt`: if either `<img>` lacks `alt`, add `alt=""` (both are decorative, sections already have headings) — decorative images must be empty alt + `aria-hidden` already present on wrappers.
- `target-size`: should already pass from Task 7; if not, grow the hit area further.
- Any other rule: fix at the source, never disable the rule in the test.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- a11y.spec.js` then `npm test`
Expected: PASS × 4 viewports, full suite green.

- [ ] **Step 5: Commit**

```bash
git add assets/css/ index.html tests/e2e/a11y.spec.js
git commit -m "fix: meet WCAG AA with axe-clean locked and unlocked states"
```

---

### Task 9: Documentation, full verification, publish

**Files:**
- Modify: `README.md`
- Test: full `npm test`

**Interfaces:**
- Consumes: Tasks 1–8 outputs.
- Produces: published GitHub Pages update.

- [ ] **Step 1: Update README** (English): project structure, "no build — Pages serves as-is", dev setup (`npm install`, `npx playwright install chromium`), `npm test` / `npm run test:headed`, link to spec, live URL.

```bash
git add README.md
git commit -m "docs: document project structure and test workflow"
```

- [ ] **Step 2: Full verification**

Run: `npm test`
Expected: ALL specs × 4 viewports PASS (smoke, images, gate, navigation, secret, nojs, meta, responsive, a11y).

```bash
wc -c index.html          # ≤ 71680
git log --oneline         # work-unit commits present
```

- [ ] **Step 3: Merge to main and publish**

```bash
git checkout main && git merge --ff-only feat/professional-redesign
git push origin main
```

- [ ] **Step 4: Verify Pages**

Run: `sleep 120 && curl -sI https://dreamcoder08.github.io/aurelia21/ | head -1`
Expected: `HTTP/2 200` (Pages rebuilds ~2 min).

- [ ] **Step 5: Final commit (README lands before merge — commit in Step 1)**

No additional commit; report published URL.
