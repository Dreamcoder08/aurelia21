import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("images are files with intrinsic size, hero eager, record lazy", async ({
  page,
}) => {
  await page.goto("/");
  const hero = page.locator("#inicio img");
  await expect(hero).toHaveAttribute("src", /assets\/img\/.*\.jpg$/);
  await expect(hero).toHaveAttribute("width", /\d+/);
  await expect(hero).toHaveAttribute("height", /\d+/);
  await expect(hero).toHaveAttribute("decoding", "async");

  const record = page.locator("#choko img");
  await expect(record).toHaveAttribute("src", /assets\/img\/.*\.jpg$/);
  await expect(record).toHaveAttribute("loading", "lazy");
  await expect(record).toHaveAttribute("width", /\d+/);
  await expect(record).toHaveAttribute("height", /\d+/);

  const html = await readFile("index.html", "utf8");
  expect(html).not.toContain("data:image/jpeg");
});
