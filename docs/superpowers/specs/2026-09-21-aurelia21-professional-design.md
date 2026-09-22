# AURELIA 21 — Professional Redesign Spec

**Date:** 2026-09-21
**Status:** Approved (design review)
**Target repo:** Dreamcoder08/aurelia21 (GitHub Pages, branch `main`)

## 1. Context and goal

`index.html` is an 817-line, 543KB self-contained romantic experience page for Vivian
"Choko". It works, has decent semantics and a clear dark/gold identity, but it is a
single monolith: inline CSS and JS, only 4 media queries, no automated tests, no
social meta, and 2 base64 JPEGs that account for nearly all of its weight.

**Goal:** bring the page to professional web-development standard — a real design
system, robust responsive behavior, automated testing, and elite-level UI/UX
execution — **without changing its content, tone, or emotional identity**.

## 2. Decisions (approved)

| Decision | Choice |
|---|---|
| Project shape | Multi-file, **no build** — GitHub Pages serves the repo as-is |
| Testing | Playwright E2E across 4 viewports + axe-core accessibility |
| Visual direction | **Refine** the current dark/gold aesthetic to agency quality; no art-direction change |

Explicitly out of scope: Tailwind/Vite or any build toolchain, dark/light mode,
copy/content changes, visual screenshot diffs, CI (deferred to phase 2).

## 3. Current-state facts (verified)

- Single `index.html` (817 lines, 543,198 bytes) + `README.md`; no `package.json`.
- 11 CSS custom properties already exist (`--bg`, `--gold`, `--ease-lux`, …) in two
  `:root` blocks; `clamp()` fluid type is already used widely.
- `font-family` is repeated ~13 times inline instead of tokens.
- Only 4 media queries: `max-width:900px` (×2), `pointer:fine`,
  `prefers-reduced-motion:reduce`.
- 2 inline scripts: gate (line ~651) and main (line ~709).
- 2 base64 JPEG data URIs inline + 2 small SVG data URIs (SVGs may stay inline).
- Google Fonts loaded with `preconnect` + `display=swap` (keep).
- A11y base is good: `lang="es"`, skip-link, `aria-live` timeline chip,
  `aria-expanded`/`aria-controls` on the secret, `aria-current` nav sync.
- Gap: `main#site.locked` renders the page empty when JavaScript is disabled.
- Gap: no Open Graph / Twitter / canonical meta; theme-color and description exist.

## 4. Architecture

```
aurelia21/
├── index.html                 # semantics preserved; references become external
├── assets/
│   ├── css/
│   │   ├── tokens.css         # design tokens only (single source of truth)
│   │   ├── base.css           # reset, typography defaults, focus, reduced-motion
│   │   ├── layout.css         # sections, grids, safe areas, breakpoints
│   │   ├── components.css     # gate, nav, timeline chip, secret, records, cursor
│   │   └── sections.css       # per-section art direction (hero, orbits, final…)
│   ├── js/
│   │   ├── main.js            # entry (type="module"); wires the rest
│   │   ├── gate.js            # enter-button gate flow
│   │   ├── nav.js             # chapter nav, IntersectionObserver, aria-current
│   │   ├── reveal.js          # reveal-on-scroll animations
│   │   ├── secret.js          # secret-trigger toggle
│   │   └── ambient.js         # stars canvas, cursor ring, progress, timeline chip
│   └── img/                   # the 2 JPEGs extracted from base64
│       └── …                  # width/height attrs, loading="lazy", decoding="async"
├── tests/
│   ├── e2e/
│   │   ├── gate.spec.js
│   │   ├── navigation.spec.js
│   │   ├── secret.spec.js
│   │   └── a11y.spec.js
│   └── playwright.config.js   # 4 viewport projects
├── package.json               # devDependencies ONLY: @playwright/test, @axe-core/playwright
├── README.md
└── docs/superpowers/specs/    # this document
```

Constraints:
- Native ES modules (`<script type="module">`); no bundler, no transpiler, no npm
  build step. `npm install` exists only for dev-time testing.
- GitHub Pages continues to serve `index.html` from branch `main`, path `/`.

## 5. Design system

Extend the existing custom properties into a complete token layer in `tokens.css`:

- **Color:** semantic names only (`--bg`, `--bg-soft`, `--panel`, `--ink`,
  `--muted`, `--gold`, `--gold-deep`, `--line`) plus focus/hover states derived
  from them. No raw hex outside `tokens.css`.
- **Typography:** `--font-display` (Cormorant Garamond) and `--font-body` (Inter)
  eliminate the ~13 inline `font-family` repetitions. Fluid scale documented as
  `--fs-*` tokens (formalizing the existing `clamp()` sizes).
- **Spacing:** `--sp-*` scale (formalizing recurring values such as section
  padding `clamp(5rem,10vw,9rem)` and gutters).
- **Motion:** keep `--ease-lux`; add `--dur-*` durations used by transitions and
  animations.
- **Layout:** content widths as tokens (`--content: 760px`, `--narrow: 670px`
  today are hard-coded), plus a z-index scale (`--z-*`) for chrome/canvas/overlays.
- Rule: no magic value repeated in more than one place.

## 6. Responsive strategy

- Mobile-first audit of every section; keep `max-width:900px` as the primary
  anchor and add only breakpoints the audit proves necessary (candidates:
  `600px`, `1200px`). No filler breakpoints.
- Replace brittle flex arrangements with CSS Grid where two-dimensional layout
  is meant (section splits, records grid).
- `env(safe-area-inset-*)` for notches/home-indicator.
- Touch targets ≥ 44×44px in the chapter nav and gate button.
- Hover-only effects guarded by `pointer:fine` (cursor ring already is; audit the
  rest).
- Extend `prefers-reduced-motion: reduce` to **every** animation, including
  canvas-driven and scroll reveals.
- Verify landscape phones and 200% zoom without horizontal scroll.

## 7. Best practices

- **Images:** extract both base64 JPEGs to `assets/img/`, add intrinsic
  `width`/`height` (CLS), `loading="lazy"` below the fold, `decoding="async"`.
  HTML target: ≈40–60KB instead of 543KB.
- **Meta:** add Open Graph + Twitter card + `canonical` pointing to the Pages
  URL; keep existing `description`, `theme-color`; add an SVG favicon.
  `og:image` uses the hero JPEG extracted in §7 (1200×630 crop if needed) — a
  single explicit choice, revisitable only if content review objects.
- **Accessibility:** keep all existing ARIA; add visible `:focus-visible` styles
  for every interactive element; verify color contrast with axe (WCAG AA).
- **Progressive enhancement:** content must render without JavaScript —
  a `<noscript>` rule removes `.locked`; with JS enabled the gate experience is
  unchanged.
- Fonts: keep current `preconnect` + `display=swap` strategy.

## 8. Testing

Tooling: `@playwright/test` + `@axe-core/playwright` as devDependencies.

- **Viewports (projects):** 390×844 (phone), 768×1024 (tablet), 1280×800
  (laptop), 1440×900 (desktop).
- **Specs:**
  - `gate.spec.js` — gate visible, Enter unlocks `main#site`, content visible.
  - `navigation.spec.js` — chapter links scroll to sections and set
    `aria-current`; timeline chip updates.
  - `secret.spec.js` — trigger toggles `aria-expanded`/`aria-controls` state.
  - `a11y.spec.js` — axe scan of the locked state and the unlocked state, zero
    serious/critical violations.
- **Scripts:** `npm test` (headless), `npm run test:headed`.
- CI via GitHub Actions is phase 2, not part of this iteration.

## 9. Acceptance criteria

1. Repo structure matches §4; `index.html` no longer contains inline `<style>`
   blocks or inline scripts.
2. Tokens per §5; no raw hex or repeated `font-family` outside `tokens.css`.
3. Responsive behavior per §6 passes at all 4 viewports with no horizontal
   scrolling and ≥44px touch targets.
4. HTML payload ≈60KB or less; both JPEGs served as files with lazy-loading
   attributes.
5. Social meta + favicon present; canonical points to the live Pages URL.
6. Page renders fully with JavaScript disabled (noscript path).
7. `npm test` green: 4 specs × 4 viewports, axe clean on both states.
8. Visual identity and Spanish copy unchanged; page still opens with the gate.

## 10. Delivery notes

Implementation will be planned as work-unit commits (conventional commits, no AI
attribution) on a feature branch; merge/push policy stays with the repository
owner. An ODD task document will track progress before the first source write.
