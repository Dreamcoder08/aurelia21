import { test, expect } from '@playwright/test';

test('content is readable with JavaScript disabled', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('#gate')).toBeHidden();
  await expect(page.locator('#inicio h1')).toBeVisible();
  await expect(page.locator('#flor h2')).toBeVisible();
  // gate.js applies tabindex="-1" to the skip-link while the gate modal is
  // open, but that guard is JS-only (T11) — with JS disabled it must never
  // apply, since #inicio is already visible and the skip-link stays useful.
  expect(await page.locator('.skip-link').evaluate((el) => el.tabIndex)).toBe(0);
  await ctx.close();
});
