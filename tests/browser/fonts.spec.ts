import fs from "node:fs";
import { test, expect } from "@playwright/test";

test("Arabic font sidebar shares a persisted verified selection with Settings", async ({ page }, info) => {
  await page.goto("/read/3/");
  await expect(page.locator(".mushaf-page")).toBeVisible();
  await page.getByRole("button", { name: "Reading display settings" }).click();
  const trigger = page.getByRole("button", { name: "Arabic Font", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Arabic Font", exact: true });
  await expect(dialog).toBeVisible();
  const select = page.locator("#reader-arabic-font");
  await expect(select).toHaveValue("indopak");
  await expect(select.locator('option[value="kolkata"]')).toBeDisabled();
  await expect(dialog).toContainText("lacks digits and Quranic signs");
  await select.selectOption("indopak");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hafezi-quran-v1")!).preferences.arabicFont)).toBe("indopak");
  const bounds = (await dialog.boundingBox())!;
  expect(bounds.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  await page.screenshot({ path: `test-results/arabic-font-sidebar-${info.project.name}.png`, fullPage: true });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.reload();
  await page.getByRole("button", { name: "Reading display settings" }).click();
  await page.getByRole("button", { name: "Arabic Font", exact: true }).click();
  await expect(page.locator("#reader-arabic-font")).toHaveValue("indopak");
  await page.getByRole("button", { name: "Close Arabic font settings" }).click();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page.locator(".mushaf-page")).toHaveAttribute("aria-label", "DigitalKhatt Indo-Pak Quran page 4");
  await page.goto("/settings/");
  await expect(page.locator("#setting-arabic-font")).toHaveValue("indopak");
});

test("unsupported saved fonts never substitute or mislabel the Quran font", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("hafezi-quran-v1", JSON.stringify({
    version: 1, preferences: { arabicFont: "kolkata", translation: "none", audio: false, mode: "continuous" },
  })));
  await page.goto("/read/1/");
  await expect(page.locator(".continuous-arabic")).toHaveCount(7);
  await expect(page.locator(".continuous-arabic").first()).toHaveCSS("font-family", 'Indopak, serif');
  await page.getByRole("button", { name: "Reading display settings" }).click();
  await page.getByRole("button", { name: "Arabic Font", exact: true }).click();
  await expect(page.locator("#reader-arabic-font")).toHaveValue("indopak");
  await expect(page.locator("#reader-arabic-font option[value=kolkata]")).toBeDisabled();
});

test("representative Quranic signs render in the verified face without glyph fallback", async ({ page, context }, info) => {
  await page.addInitScript(() => localStorage.setItem("hafezi-quran-v1", JSON.stringify({
    version: 1, preferences: { arabicFont: "indopak", translation: "none", audio: false, mode: "continuous" },
  })));
  const verses = JSON.parse(fs.readFileSync("public/data/verses.json", "utf8"));
  const selected = ["1:1", "2:255", "12:11", "18:1", "36:52", "41:44", "75:27", "96:19"];
  for (const point of [0x617, 0x6d8, 0x6da, 0x89c, 0x8db, 0x8dd, 0x8de, 0x8df]) {
    const verse = verses.find((v: { text: string }) => v.text.includes(String.fromCodePoint(point)));
    expect(verse).toBeTruthy();
    selected.push(verse.key);
  }
  const session = await context.newCDPSession(page);
  await session.send("DOM.enable");await session.send("CSS.enable");
  for (const key of new Set(selected)) {
    const verse = verses.find((v: { key: string }) => v.key === key);
    await page.goto(`/read/${verse.page}/?ayah=${key}`);
    const card = page.locator(".verse-card").filter({ has: page.getByRole("button", { name: key, exact: true }) });
    await expect(card.locator(".continuous-arabic")).toHaveText(verse.text);
    await expect(card.locator(".continuous-arabic")).toHaveCSS("font-family", 'Indopak, serif');
    await card.locator(".continuous-arabic").evaluate(el => el.setAttribute("data-font-audit", "selected"));
    const { root } = await session.send("DOM.getDocument");
    const { nodeId } = await session.send("DOM.querySelector", { nodeId: root.nodeId, selector: '[data-font-audit="selected"]' });
    const result = await session.send("CSS.getPlatformFontsForNode", { nodeId });
    expect(result.fonts.length).toBeGreaterThan(0);
    for (const font of result.fonts) {
      expect(font.isCustomFont, `${key}: no system fallback`).toBe(true);
      expect(font.familyName).toBe("DigitalKhatt IndoPak");
    }
    if (key === "12:11") await card.screenshot({ path: `test-results/quran-signs-${info.project.name}.png` });
  }
  await session.detach();
});

test("font loading failure reports an error and permits retry without fallback Quran text", async ({ page }) => {
  let blocked = true;
  await page.route("**/fonts/DigitalKhattIndoPak.woff2", async route => {
    if (blocked) await route.abort();else await route.continue();
  });
  await page.goto("/read/1/");
  await expect(page.getByRole("alert")).toContainText("compatible Indo-Pak Quran font could not load");
  await expect(page.locator(".mushaf-page")).toHaveCount(0);
  blocked = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator(".mushaf-page")).toBeVisible();
});
