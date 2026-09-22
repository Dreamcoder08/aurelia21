import { test, expect } from '@playwright/test';

// Measures real characters-per-line on rendered body copy. Not an estimate:
// walks the text node with a Range, groups characters by the vertical
// position of their client rect (i.e. by actual line box), and counts them.
// The classic readability range for body text is 45-75 cpl; below ~40 the
// text wraps often enough to break reading rhythm.
const measureCpl = (page) =>
  page.evaluate(() => {
    const paras = [...document.querySelectorAll('.content p')].filter(
      (p) => (p.textContent || '').trim().length > 120
    );
    if (!paras.length) return null;

    const lineLengths = [];
    for (const p of paras) {
      const node = [...p.childNodes].find(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 120
      );
      if (!node) continue;

      const range = document.createRange();
      const text = node.textContent;
      const byLine = new Map();
      for (let i = 0; i < text.length; i++) {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const rect = range.getBoundingClientRect();
        if (!rect.height) continue;
        const key = Math.round(rect.top);
        byLine.set(key, (byLine.get(key) || 0) + 1);
      }
      const lines = [...byLine.values()];
      // Drop the last line: it's a partial by definition and would drag the
      // average down regardless of how the column is sized.
      if (lines.length > 1) lines.pop();
      lineLengths.push(...lines);
    }

    if (!lineLengths.length) return null;
    const avg = lineLengths.reduce((a, b) => a + b, 0) / lineLengths.length;
    const sample = document.querySelector('.content p');
    return {
      avgCpl: Math.round(avg * 10) / 10,
      lineCount: lineLengths.length,
      columnPx: Math.round(sample.getBoundingClientRect().width),
      fontPx: Math.round(parseFloat(getComputedStyle(sample).fontSize) * 100) / 100,
    };
  });

test('body copy holds a readable line length', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.locator('#enter-button').click();
  await page.evaluate(async () => {
    const step = innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    scrollTo(0, 0);
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);

  const result = await measureCpl(page);
  expect(result, 'no body paragraph long enough to measure').not.toBeNull();
  console.log(`[readability] ${testInfo.project.name}`, JSON.stringify(result));

  // The classic 45-75 band, asserted in both directions: too short breaks
  // reading rhythm with constant wrapping, too long makes it hard to find
  // the start of the next line. Both failure modes were present here before
  // T14 — phone at 41.7, tablet at 83.4.
  expect(result.avgCpl).toBeGreaterThanOrEqual(45);
  expect(result.avgCpl).toBeLessThanOrEqual(75);
});
