import { test, expect } from '@playwright/test';

// A CSS @media (prefers-reduced-motion) block can only strip transitions — it
// cannot stop a JS pointermove handler from writing new values. Before T13,
// reduced-motion users still got the cursor spotlight relocating on every
// mouse move, just instantly instead of gliding. These tests assert the
// handler itself is gated, which is the only thing that honors the intent.

const readCursorVars = (page) =>
  page.evaluate(() => {
    const root = document.documentElement;
    return { mx: root.style.getPropertyValue('--mx'), my: root.style.getPropertyValue('--my') };
  });

test('reduced-motion: pointer movement does not drive the cursor spotlight', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('#enter-button').click();

  const before = await readCursorVars(page);
  await page.mouse.move(120, 140);
  await page.mouse.move(360, 420);
  await page.waitForTimeout(150);
  const after = await readCursorVars(page);

  expect(after).toEqual(before);
  expect(after.mx).toBe('');
});

test('no-preference + fine pointer: the spotlight still tracks the cursor', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');

  const hasFinePointer = await page.evaluate(() => matchMedia('(pointer:fine)').matches);
  test.skip(!hasFinePointer, 'cursor effects are fine-pointer only; this project emulates touch');

  await page.locator('#enter-button').click();
  await page.mouse.move(200, 240);
  await page.waitForTimeout(150);

  const { mx, my } = await readCursorVars(page);
  expect(mx).toBe('200px');
  expect(my).toBe('240px');
});
