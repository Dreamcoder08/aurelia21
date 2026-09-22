import { test, expect } from "@playwright/test";

test("secret toggles open class and aria state", async ({ page }) => {
  await page.goto("/");
  await page.locator("#enter-button").click();
  const trigger = page.locator("#secret-trigger");
  const message = page.locator("#secret-message");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(message).toHaveClass(/open/);
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(message).toHaveAttribute("aria-hidden", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(message).not.toHaveClass(/open/);
});
