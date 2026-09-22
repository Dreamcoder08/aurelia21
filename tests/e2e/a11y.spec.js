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
