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
