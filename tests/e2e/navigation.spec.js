import { test, expect } from "@playwright/test";

test("chapter nav sets aria-current and updates timeline label", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#enter-button").click();
  // .chapter-nav is display:none below 900px (assets/css/components.css), so the
  // link cannot receive a real click on phone/tablet viewports. There we drive the
  // SAME chapter-observer path by scrolling the section into view instead.
  const archivoLink = page.locator('.chapter-nav a[data-section="archivo"]');
  if (await archivoLink.isVisible()) {
    await archivoLink.click();
  } else {
    await page.locator("#archivo").scrollIntoViewIfNeeded();
  }
  // Anchor jumps use html{scroll-behavior:smooth} (base.css), so the ~5000px
  // animated scroll plus JPEG load layout-shifts can exceed 5s: allow 15s.
  await expect(archivoLink).toHaveAttribute("aria-current", "true", {
    timeout: 15000,
  });
  await expect(page.locator("#timeline-label")).toHaveText("05 · archive", {
    timeout: 15000,
  });
});
