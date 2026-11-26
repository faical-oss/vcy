import type { Page } from "@playwright/test";
import { ROUTES } from "../../src/constants/routes";
import { expect, openRoute, test } from "./helpers";

/*
 * Task 8: step 1 of the preferences wizard ("What do you like to do on vacation?") is a grid of 20 photo tiles. It sets the widths itself,
 * so it runs once (in the 1280 project).
 *   Columns: 1 below 400, 2 from 400, 3 from 768, 4 from 1024, 5 from 1280. One gap, tiles about 16:10 and at least 44px, no sideways scroll.
 *   Each tile is a checkbox named by its label: click and Space/Enter-free keyboard (Space) toggle it, the "N selected" count follows, and a
 *   selected tile shows a ring and a check badge. Continue is on screen and never covers the last row.
 */
const WIDTHS = [320, 360, 390, 399, 400, 768, 1024, 1279, 1280, 1440, 1920];
const columnsAt = (width: number) => (width >= 1280 ? 5 : width >= 1024 ? 4 : width >= 768 ? 3 : width >= 400 ? 2 : 1);

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "laptop-1280", "sets the widths itself: runs once");
});

async function openStepOne(page: Page) {
  await page.setViewportSize({ width: 390, height: 900 });
  await openRoute(page, { name: "account preferences", path: ROUTES.accountPreferences, account: true });
  const edit = page.getByRole("button", { name: "Edit preferences" });
  if (await edit.isVisible().catch(() => false)) await edit.click();
  await expect(page.getByRole("group", { name: "Select all that apply" })).toBeVisible();
}

test("the tile grid: columns, gap, ratio, size and no sideways scroll at every width", async ({ page }) => {
  await openStepOne(page);
  const group = page.getByRole("group", { name: "Select all that apply" });
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    const at = `${width}px`;
    const m = await group.evaluate((element) => {
      const tiles = [...element.querySelectorAll("label")].map((tile) => tile.getBoundingClientRect());
      const columns = new Set(tiles.map((box) => Math.round(box.left))).size;
      const gaps = tiles.slice(1).map((box, index) => (box.top === tiles[index]!.top ? box.left - tiles[index]!.right : null)).filter((gap): gap is number => gap !== null);
      const rows = [...new Set(tiles.map((box) => Math.round(box.top)))];
      const vgaps = rows.slice(1).map((top, index) => top - (rows[index]! + tiles[0]!.height));
      const box = element.getBoundingClientRect();
      return {
        count: tiles.length, columns, hGap: gaps, vGap: vgaps,
        ratio: tiles[0]!.width / tiles[0]!.height, minHeight: Math.min(...tiles.map((tile) => tile.height)), minWidth: Math.min(...tiles.map((tile) => tile.width)),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        right: box.right, viewport: document.documentElement.clientWidth,
      };
    });
    expect(m.count, `${at}: 20 tiles`).toBe(20);
    expect(m.columns, `${at}: columns`).toBe(columnsAt(width));
    expect(m.overflow, `${at}: sideways scroll`).toBeLessThanOrEqual(0);
    expect(m.right, `${at}: inside the viewport`).toBeLessThanOrEqual(m.viewport);
    expect(Math.abs(m.ratio - 1.6), `${at}: about 16:10`).toBeLessThan(0.05);
    expect(m.minHeight, `${at}: tile at least 44px high`).toBeGreaterThanOrEqual(44);
    expect(m.minWidth, `${at}: tile at least 44px wide`).toBeGreaterThanOrEqual(44);
    for (const gap of [...m.hGap, ...m.vGap]) expect(Math.abs(gap - 12), `${at}: one gap everywhere`).toBeLessThanOrEqual(1);
  }
});

test("selecting by click and by keyboard: the count follows, the selected tile has a ring and a check, Continue stays clear of the last row", async ({ page }) => {
  await openStepOne(page);
  for (const width of [320, 390, 768, 1024, 1280, 1920]) {
    await page.setViewportSize({ width, height: 800 });
    const at = `${width}px`;
    const bike = page.getByRole("checkbox", { name: "Bike" });
    const count = page.getByText(/^\d+ selected$/);
    if (await bike.isChecked()) await bike.uncheck({ force: true });
    await expect(count, `${at}: starts empty or keeps the count`).toBeVisible();
    const start = Number((await count.textContent())!.split(" ")[0]);

    // Click: the whole tile is the target.
    const tile = page.locator("label", { has: bike });
    await tile.click();
    await expect(bike, `${at}: click selects`).toBeChecked();
    await expect(count).toHaveText(`${start + 1} selected`);
    const look = await tile.evaluate((element) => {
      const ring = element.querySelector("span.absolute.inset-0.rounded-card") as HTMLElement;
      const badge = element.querySelector("svg")!.parentElement as HTMLElement;
      return { border: getComputedStyle(ring).borderTopColor, badge: getComputedStyle(badge).opacity };
    });
    expect(look.badge, `${at}: check badge shown`).toBe("1");
    expect(look.border, `${at}: gold ring`).not.toBe("rgba(0, 0, 0, 0)");
    await tile.click();
    await expect(bike, `${at}: click again clears`).not.toBeChecked();
    await expect(count).toHaveText(`${start} selected`);

    // Keyboard: Tab to the tile, Space toggles, and focus order follows the visual order.
    await bike.focus();
    await page.keyboard.press("Space");
    await expect(bike, `${at}: Space selects`).toBeChecked();
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.closest("label")?.textContent?.trim()), `${at}: Tab goes to the next tile (Detox)`).toBe("Detox");
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Space");
    await expect(bike, `${at}: Space clears`).not.toBeChecked();

    // Continue is reachable and does not cover the last tile.
    const last = page.locator("label", { has: page.getByRole("checkbox", { name: "Raft" }) });
    const next = page.getByRole("button", { name: "Continue" });
    await next.scrollIntoViewIfNeeded();
    await expect(next, `${at}: Continue visible`).toBeVisible();
    const [lastBox, nextBox] = [await last.boundingBox(), await next.boundingBox()];
    expect(lastBox!.y + lastBox!.height, `${at}: the last row ends above Continue`).toBeLessThanOrEqual(nextBox!.y);
  }
});

test("the tile label stays readable: white on the scrim, 4.5:1 even over a white photo, and the tiles keep the same selection data", async ({ page }) => {
  await openStepOne(page);
  const result = await page.locator("label", { has: page.getByRole("checkbox", { name: "Golf" }) }).evaluate((element) => {
    const scrim = [...element.querySelectorAll("span")].find((span) => getComputedStyle(span).backgroundImage.includes("gradient") && span.getAttribute("aria-hidden"))!;
    const label = [...element.querySelectorAll("span")].find((span) => span.textContent === "Golf")!;
    return { scrim: getComputedStyle(scrim).backgroundImage, colour: getComputedStyle(label).color, size: getComputedStyle(label).fontSize };
  });
  // Bottom of the scrim is black at 80% opacity (50% halfway up): over pure white that is rgb(51,51,51) behind white text.
  expect(result.scrim).toMatch(/0 0 0 \/ 0\.8\)|rgba\(0, 0, 0, 0\.8\)/);
  expect(result.colour).toBe("rgb(255, 255, 255)");
  const luminance = (value: number) => ((value /= 255) <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const worst = 0.2 * 255; // white photo under 80% black
  const ratio = 1.05 / (luminance(worst) + 0.05);
  expect(ratio, "contrast of the label over a white photo").toBeGreaterThanOrEqual(4.5);
});

test("reduced motion: the tiles do not animate", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openStepOne(page);
  const durations = await page.getByRole("group", { name: "Select all that apply" }).locator("label").first().evaluate((element) =>
    [...element.querySelectorAll("*")].map((child) => getComputedStyle(child).transitionProperty),
  );
  for (const value of durations) expect(value, "no transition under reduced motion").toBe("none");
});

test("the photos cause no layout shift (every tile has its 16:10 box before its image loads), and the placeholders are local WebP files", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const item of list.getEntries() as unknown as { hadRecentInput: boolean; value: number }[]) if (!item.hadRecentInput) (window as unknown as { __cls: number }).__cls += item.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await openStepOne(page);
  // The page's own load (the streamed welcome band, the click on Edit) is not the photos' shift: count from here.
  await page.waitForTimeout(600);
  const before = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
  const group = page.getByRole("group", { name: "Select all that apply" });
  // The photos are lazy: scroll through every tile so each one loads.
  for (const label of await group.locator("label").all()) await label.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.querySelectorAll('[aria-labelledby="wizard-select-label"] img')].every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0), undefined, { timeout: 15_000 });
  await page.waitForTimeout(500);
  expect((await page.evaluate(() => (window as unknown as { __cls: number }).__cls)) - before, "layout shift while the photos load").toBeLessThan(0.01);
  const sources = await group.locator("img").evaluateAll((images) => images.map((image) => (image as HTMLImageElement).currentSrc));
  expect(sources.length, "20 photos").toBe(20);
  for (const source of sources) expect(new URL(source).origin, "no image is loaded from another site").toBe(new URL(page.url()).origin);
});
