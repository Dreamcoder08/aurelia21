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
  const link = page.locator('.chapter-nav a[data-section="flor"]');
  // .chapter-nav is display:none below the 900px breakpoint (assets/css/components.css);
  // the hit-area guarantee only applies where the nav is actually rendered.
  const isVisible = await link.isVisible();
  test.skip(!isVisible, '.chapter-nav is hidden below the 900px breakpoint on this viewport');
  const box = await link.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
});
