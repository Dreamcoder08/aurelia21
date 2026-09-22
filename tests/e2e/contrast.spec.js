import { test, expect } from '@playwright/test';

// Manual WCAG contrast verification for cases axe-core cannot evaluate:
// text-over-gradient (marked "incomplete", never pass/fail) and generated
// ::before/::after content (never inspected at all). See odd/tasks/
// aurelia21-professional-redesign.md, T10.
//
// Two measurement techniques are used, chosen per background type:
//  - Flat/solid backgrounds (.endmark small on .final's solid rgb(5,5,5)):
//    read computed styles directly and compute the ratio analytically.
//  - CSS gradients with known, enumerable color stops (.gate small on the
//    gate's radial-gradient): parse the resolved gradient's color stops and
//    test against the lightest (worst-case) stop, per WCAG guidance for
//    text over a gradient.
//  - A real photo + gradient overlay (.hero::before over the hero image):
//    neither computed styles nor a hand-parsed gradient can tell us the
//    true composited pixel color, so this one is measured by taking a real
//    Playwright screenshot of the exact patch of page behind the pseudo-
//    element (with the pseudo-element's text temporarily made transparent
//    so only the background is captured), decoding that screenshot with an
//    in-browser <canvas> (real PNG decode + getImageData, no extra
//    dependency), and taking the lightest pixel found as the worst case.
//    This is the only technique that is actually reliable for a photo-
//    backed background — analytical CSS-gradient math cannot see the JPEG.

const CONTRAST_HELPERS = `
window.__contrast = (function () {
  function srgbToLinear(c) {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function relLuminance([r, g, b]) {
    const [R, G, B] = [r, g, b].map((c) => srgbToLinear(c / 255));
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }
  function contrastRatio(rgbA, rgbB) {
    const L1 = relLuminance(rgbA);
    const L2 = relLuminance(rgbB);
    const hi = Math.max(L1, L2);
    const lo = Math.min(L1, L2);
    return (hi + 0.05) / (lo + 0.05);
  }
  function parseColor(str) {
    const m = str.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }
  function blendOver(fg, bg) {
    const a = fg.a == null ? 1 : fg.a;
    return {
      r: a * fg.r + (1 - a) * bg.r,
      g: a * fg.g + (1 - a) * bg.g,
      b: a * fg.b + (1 - a) * bg.b,
    };
  }
  function extractStops(str) {
    const stops = [];
    const re = /rgba?\\([^)]+\\)/g;
    let m;
    while ((m = re.exec(str))) {
      const c = parseColor(m[0]);
      if (c) stops.push(c);
    }
    return stops;
  }
  // Walks up from el looking for the first effectively-opaque background-color.
  // Sufficient for flat solid section backgrounds (e.g. .final { background: rgb(5,5,5) }).
  function resolveOpaqueAncestorBg(el) {
    let node = el;
    while (node) {
      const bg = parseColor(getComputedStyle(node).backgroundColor);
      if (bg && bg.a >= 0.99) return bg;
      node = node.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  }
  function requiredRatio(fontSizePx, fontWeight) {
    const bold = fontWeight >= 700;
    const large = fontSizePx >= 24 || (bold && fontSizePx >= 18.66);
    return large ? 3 : 4.5;
  }
  return {
    relLuminance,
    contrastRatio,
    parseColor,
    blendOver,
    extractStops,
    resolveOpaqueAncestorBg,
    requiredRatio,
  };
})();
`;

test('.gate small clears AA contrast against the gate gradient lightest stop', async ({ page }) => {
  await page.goto('/');
  await page.addScriptTag({ content: CONTRAST_HELPERS });

  const result = await page.evaluate(() => {
    const gate = document.querySelector('.gate');
    const small = document.querySelector('.gate small');
    const stops = window.__contrast.extractStops(getComputedStyle(gate).backgroundImage);
    let lightest = stops[0];
    let lightestL = window.__contrast.relLuminance([lightest.r, lightest.g, lightest.b]);
    for (const s of stops) {
      const l = window.__contrast.relLuminance([s.r, s.g, s.b]);
      if (l > lightestL) {
        lightest = s;
        lightestL = l;
      }
    }
    const cs = getComputedStyle(small);
    const fg = window.__contrast.parseColor(cs.color);
    const ratio = window.__contrast.contrastRatio([fg.r, fg.g, fg.b], [lightest.r, lightest.g, lightest.b]);
    const required = window.__contrast.requiredRatio(parseFloat(cs.fontSize), parseFloat(cs.fontWeight) || 400);
    return { ratio, required, fg, worstCaseStop: lightest, fontSizePx: parseFloat(cs.fontSize) };
  });

  console.log('[contrast] .gate small', JSON.stringify(result));
  expect(result.ratio).toBeGreaterThanOrEqual(result.required);
});

test('.hero::before clears AA contrast against its real rendered background', async ({ page }) => {
  await page.goto('/');
  await page.addScriptTag({ content: CONTRAST_HELPERS });
  await page.locator('#enter-button').click();
  await page.evaluate(async () => {
    const step = innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(300);

  const displayState = await page.evaluate(
    () => getComputedStyle(document.querySelector('.hero'), '::before').display
  );
  test.skip(displayState === 'none', '.hero::before is display:none below the 900px breakpoint');

  // Fonts must be fully loaded before measuring text metrics below — if Inter
  // hasn't finished loading yet, the hidden-span measurement falls back to
  // system-ui's metrics, shifting the sampled patch by a few px and landing
  // on a different part of the underlying photo (observed: flaky ratios
  // across otherwise-identical runs of the same viewport).
  await page.evaluate(() => document.fonts.ready);

  // Measure the pseudo-element's real geometry: create a hidden span with the
  // same font/letter-spacing/content to get the vertical-rl text's true
  // length (becomes patch height) and thickness (becomes patch width), then
  // position the sample patch using the pseudo-element's own right/top/
  // transform offsets relative to .hero's box.
  const metrics = await page.evaluate(() => {
    const hero = document.querySelector('.hero');
    const cs = getComputedStyle(hero, '::before');
    const content = cs.content.replace(/^"|"$/g, '');
    const span = document.createElement('span');
    span.style.position = 'fixed';
    span.style.top = '-9999px';
    span.style.left = '-9999px';
    span.style.whiteSpace = 'pre';
    span.style.font = cs.font;
    span.style.letterSpacing = cs.letterSpacing;
    span.textContent = content;
    document.body.appendChild(span);
    const rect = span.getBoundingClientRect();
    span.remove();
    const heroRect = hero.getBoundingClientRect();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return {
      color: cs.color,
      textLength: rect.width,
      textThickness: rect.height,
      heroTop: heroRect.top,
      heroRight: heroRect.right,
      heroHeight: heroRect.height,
      rightOffsetPx: 1.35 * rem,
    };
  });

  const margin = 0;
  const patchWidth = Math.ceil(metrics.textThickness + margin * 2);
  const patchHeight = Math.ceil(metrics.textLength + margin * 2);
  const centerY = metrics.heroTop + metrics.heroHeight / 2;
  const patchRightEdge = metrics.heroRight - metrics.rightOffsetPx + margin;
  const clip = {
    x: Math.max(0, Math.round(patchRightEdge - patchWidth)),
    y: Math.max(0, Math.round(centerY - patchHeight / 2)),
    width: patchWidth,
    height: patchHeight,
  };

  // Hide the pseudo-element's text color so the screenshot captures only the
  // real composited background (photo + gradient overlay) behind it.
  const styleHandle = await page.addStyleTag({ content: '.hero::before { color: transparent !important; }' });
  const bgBuffer = await page.screenshot({ clip });
  await styleHandle.evaluate((el) => el.remove());
  if (process.env.DEBUG_CONTRAST_PATCH) {
    const fs = await import('node:fs');
    fs.writeFileSync(process.env.DEBUG_CONTRAST_PATCH, bgBuffer);
  }

  const dataUrl = `data:image/png;base64,${bgBuffer.toString('base64')}`;
  const worstCaseBg = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let best = { r: 0, g: 0, b: 0 };
    let bestL = -1;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const l = window.__contrast.relLuminance([r, g, b]);
      if (l > bestL) {
        bestL = l;
        best = { r, g, b };
      }
    }
    return best;
  }, dataUrl);

  const result = await page.evaluate(
    ({ colorStr, bg }) => {
      const fg = window.__contrast.parseColor(colorStr);
      const blended = window.__contrast.blendOver(fg, bg);
      const ratio = window.__contrast.contrastRatio([blended.r, blended.g, blended.b], [bg.r, bg.g, bg.b]);
      return { ratio, fg, bg, blended };
    },
    { colorStr: metrics.color, bg: worstCaseBg }
  );

  console.log('[contrast] .hero::before', JSON.stringify({ ...result, clip }));
  expect(result.ratio).toBeGreaterThanOrEqual(4.5);
});

test('.endmark small clears AA contrast against its solid final-section background', async ({ page }) => {
  await page.goto('/');
  await page.addScriptTag({ content: CONTRAST_HELPERS });
  await page.locator('#enter-button').click();
  await page.evaluate(async () => {
    const step = innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    const small = document.querySelector('.endmark small');
    const cs = getComputedStyle(small);
    const fg = window.__contrast.parseColor(cs.color);
    const bg = window.__contrast.resolveOpaqueAncestorBg(small);
    const ratio = window.__contrast.contrastRatio([fg.r, fg.g, fg.b], [bg.r, bg.g, bg.b]);
    const required = window.__contrast.requiredRatio(parseFloat(cs.fontSize), parseFloat(cs.fontWeight) || 400);
    return { ratio, required, fg, bg, fontSizePx: parseFloat(cs.fontSize) };
  });

  console.log('[contrast] .endmark small', JSON.stringify(result));
  expect(result.ratio).toBeGreaterThanOrEqual(result.required);
});
