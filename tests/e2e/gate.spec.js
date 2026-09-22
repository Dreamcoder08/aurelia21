import { test, expect } from "@playwright/test";

test("enter unlocks the site", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#site")).toHaveClass(/locked/);
  await expect(page.locator("body")).toHaveClass(/no-scroll/);
  await page.locator("#enter-button").click();
  await expect(page.locator("#site")).not.toHaveClass(/locked/);
  await expect(page.locator("gate, #gate")).toHaveClass(/hidden/);
  await expect(page.locator("body")).not.toHaveClass(/no-scroll/);
  await expect(page.locator("#inicio h1")).toBeVisible();
});
