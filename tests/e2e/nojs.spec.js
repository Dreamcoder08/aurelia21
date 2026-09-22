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
