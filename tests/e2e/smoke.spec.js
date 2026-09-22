import { test, expect } from "@playwright/test";

test("loads with gate and correct title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("AURELIA // 21·09");
  await expect(page.locator("#gate")).toBeVisible();
  await expect(page.locator("#enter-button")).toBeVisible();
});
