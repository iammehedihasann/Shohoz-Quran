import { test, expect } from "@playwright/test";
import type { CDPSession, Page } from "@playwright/test";

async function swipe(page: Page, session: CDPSession, dx: number, dy = 0) {
  const viewport = page.locator(".page-viewport");
  await viewport.scrollIntoViewIfNeeded();
  const bounds = (await viewport.boundingBox())!;
  const height = page.viewportSize()!.height;
  const x = bounds.x + bounds.width / 2 - dx / 2;
  const y = Math.min(height - 170, Math.max(bounds.y + 80, height / 2));
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let step = 1; step <= 6; step++) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove", touchPoints: [{ x: x + dx * step / 6, y: y + dy * step / 6 }],
    });
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

test("page-turn areas stay on the Mushaf edges at mobile widths", async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem("hafezi-quran-v1", JSON.stringify({
    version: 1,
    preferences: { audio: false, translation: "none" },
  })));
  const widths = info.project.name === "mobile" ? [320, 360, 390, 430, 768, 844] : [1440];
  for (const width of widths) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
    await page.goto("/read/3/");
    await page.waitForFunction(() => document.documentElement.classList.contains("quran-font-ready"));
    const mushaf = page.locator(".mushaf-page");
    await mushaf.scrollIntoViewIfNeeded();
    const bounds = (await mushaf.boundingBox())!;
    const next = (await page.getByRole("button", { name: "Next Mushaf page", exact: true }).boundingBox())!;
    const previous = (await page.getByRole("button", { name: "Previous Mushaf page", exact: true }).boundingBox())!;
    expect(Math.abs(next.x - bounds.x)).toBeLessThan(1);
    expect(Math.abs(previous.x + previous.width - bounds.x - bounds.width)).toBeLessThan(1);
    const viewportHeight = page.viewportSize()!.height;
    const y = Math.min(viewportHeight - 90, Math.max(bounds.y + 20, viewportHeight / 2));
    if (info.project.name === "mobile") await page.touchscreen.tap(bounds.x + 5, y);
    else await page.mouse.click(bounds.x + 5, y);
    await expect(mushaf).toHaveAttribute("aria-label", "DigitalKhatt Indo-Pak Quran page 4");
    await mushaf.scrollIntoViewIfNeeded();
    const changed = (await mushaf.boundingBox())!;
    const changedY = Math.min(viewportHeight - 90, Math.max(changed.y + 20, viewportHeight / 2));
    if (info.project.name === "mobile") await page.touchscreen.tap(changed.x + changed.width - 5, changedY);
    else await page.mouse.click(changed.x + changed.width - 5, changedY);
    await expect(mushaf).toHaveAttribute("aria-label", "DigitalKhatt Indo-Pak Quran page 3");
  }
});

test("mobile swipes turn one page and preserve scrolling, selection and zoom", async ({ page, context }, info) => {
  test.skip(info.project.name !== "mobile", "Touch gestures are checked on the mobile project.");
  await page.addInitScript(() => localStorage.setItem("hafezi-quran-v1", JSON.stringify({
    version: 1, preferences: { audio: false, translation: "none" },
  })));
  const session = await context.newCDPSession(page);
  const mushaf = page.locator(".mushaf-page");
  for (const width of [320, 360, 390, 430, 844]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
    await page.goto("/read/3/");
    await page.waitForFunction(() => document.documentElement.classList.contains("quran-font-ready"));
    await expect(page.locator(".page-viewport")).toHaveCSS("touch-action", "pan-y pinch-zoom");
    await swipe(page, session, -120);
    await expect(mushaf).toHaveAttribute("aria-label", "DigitalKhatt Indo-Pak Quran page 4");
    await swipe(page, session, 120);
    await expect(mushaf).toHaveAttribute("aria-label", "DigitalKhatt Indo-Pak Quran page 3");
    await swipe(page, session, -25);
    await expect(mushaf).toHaveAttribute("aria-label", "DigitalKhatt Indo-Pak Quran page 3");
    await swipe(page, session, 10, -100);
    await expect(mushaf).toHaveAttribute("aria-label", "DigitalKhatt Indo-Pak Quran page 3");
    const verse = page.locator(".mushaf-line-inner [role=button]").nth(1);
    const key = (await verse.getAttribute("aria-label"))!.replace("Select ayah ", "");
    await verse.tap();
    await expect(page.locator(".selected-ayah-actions")).toContainText(key);
    await expect(mushaf).toHaveAttribute("aria-label", "DigitalKhatt Indo-Pak Quran page 3");
  }
  await page.getByRole("button", { name: "Reading display settings" }).click();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(page.locator(".page-viewport")).not.toHaveCSS("touch-action", "pan-y pinch-zoom");
  await swipe(page, session, -120);
  await expect(mushaf).toHaveAttribute("aria-label", "DigitalKhatt Indo-Pak Quran page 3");
  await page.goto("/read/1/");
  await expect(mushaf).toBeVisible();
  await swipe(page, session, 120);
  await expect(mushaf).toHaveAttribute("aria-label", "DigitalKhatt Indo-Pak Quran page 1");
  await page.goto("/read/610/");
  await expect(mushaf).toBeVisible();
  await swipe(page, session, -120);
  await expect(mushaf).toHaveAttribute("aria-label", "DigitalKhatt Indo-Pak Quran page 610");
  await page.getByRole("button", { name: "Verse by verse", exact: true }).click();
  await expect(page.locator(".verse-card").first()).toBeVisible();
  await swipe(page, session, -120);
  await expect(page).toHaveURL(/\/read\/610\//);
  await session.detach();
});
