import { test, expect } from "@playwright/test";

test("bottom Settings and About links remain reachable on short screens", async ({ page }, info) => {
  await page.setViewportSize({ width: info.project.name === "mobile" ? 390 : 1280, height: 450 });
  await page.goto("/");
  if (info.project.name === "mobile") await page.getByRole("button", { name: "Open navigation" }).click();
  const sidebar = page.locator(".sidebar");
  await expect(sidebar).toBeVisible();
  await expect(sidebar).toHaveCSS("overflow-y", "auto");
  const settings = sidebar.getByRole("link", { name: "Settings", exact: true });
  await settings.scrollIntoViewIfNeeded();
  await expect(settings).toBeInViewport();
  await expect(sidebar.getByRole("link", { name: "About & sources" })).toBeInViewport();
  await settings.click();
  await expect(page).toHaveURL(/\/settings\//);
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
});
