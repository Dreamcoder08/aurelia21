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

test('gate is exposed as a labelled modal dialog and takes initial focus', async ({ page }) => {
  await page.goto('/');
  const gate = page.locator('#gate');
  await expect(gate).toHaveAttribute('role', 'dialog');
  await expect(gate).toHaveAttribute('aria-modal', 'true');
  const labelledby = await gate.getAttribute('aria-labelledby');
  expect(labelledby).toBeTruthy();
  await expect(page.locator(`#${labelledby}`)).toBeVisible();
  await expect(page.locator('#enter-button')).toBeFocused();
});

test('skip-link is unreachable while the gate is open and restored after dismiss', async ({ page }) => {
  await page.goto('/');
  const skipLink = page.locator('.skip-link');
  // tabIndex === -1 means "programmatically focusable but excluded from
  // sequential keyboard navigation" — the correct way to make an element
  // unreachable via Tab without hiding it or breaking a later programmatic
  // focus move.
  expect(await skipLink.evaluate((el) => el.tabIndex)).toBe(-1);

  await page.locator('#enter-button').click();

  expect(await skipLink.evaluate((el) => el.tabIndex)).toBe(0);
});

test('every section landmark has a resolvable accessible name', async ({ page }) => {
  await page.goto('/');
  const sections = await page.locator('section.section').all();
  expect(sections.length).toBe(8);
  for (const section of sections) {
    const labelledby = await section.getAttribute('aria-labelledby');
    expect(labelledby).toBeTruthy();
    await expect(page.locator(`#${labelledby}`)).toHaveCount(1);
  }
});
