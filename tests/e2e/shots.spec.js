import { test } from '@playwright/test';

// Visual capture pass. Inert during normal runs; set SHOTS to a directory to
// activate: `bun run shots` (see package.json). Exists because reviewing this
// page by screenshot has already been needed repeatedly, and hand-rolling a
// throwaway script each time loses the details that matter — waiting for
// fonts, letting reveal animations settle, and capturing the same set of
// sections at every viewport so states are comparable across breakpoints.
const OUT = process.env.SHOTS;

test('capture page states', async ({ page }, info) => {
  test.skip(!OUT, 'set SHOTS=<dir> to capture (bun run shots)');
  test.setTimeout(120000);
  const v = info.project.name;

  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${v}-00-gate.png` });

  await page.locator('#enter-button').click();
  await page.waitForTimeout(1600); // gate fade + hero reveal
  await page.screenshot({ path: `${OUT}/${v}-01-hero.png` });

  const sections = await page.locator('section.section[id]').evaluateAll((els) =>
    els.map((el) => el.id)
  );
  for (const [i, id] of sections.entries()) {
    const el = page.locator('#' + id);
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200); // .reveal transition is 0.9s
    await page.screenshot({ path: `${OUT}/${v}-${String(i + 2).padStart(2, '0')}-${id}.png` });
  }
});
