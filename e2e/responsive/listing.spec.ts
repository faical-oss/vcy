import type { Page } from "@playwright/test";
import { DATES, SEARCH } from "./routes";
import { expect, openRoute, test } from "./helpers";

/*
 * Task 7, items 1 and 2. It sets the widths itself (320, 360, 390, 768, 1024, 1280), so each test runs once (in the 1280 project).
 *  1. The filters drawer (below 1024) stays open while a filter changes: the results behind it update, the URL is replaced (no new history entry),
 *     the focus stays on the control that changed, and the count is announced politely. Only "Show N results", the close button, Escape and the
 *     dimmed area close it, and the focus goes back to the Filters button.
 *  2. No card says "Select your dates to see prices". With no valid dates a card has no price block text and keeps its height; with valid dates the
 *     price shows as before.
 */
const WIDTHS = [320, 360, 390, 768, 1024, 1280];
const PLACEHOLDER = "Select your dates to see prices";

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "laptop-1280", "sets the widths itself: runs once");
});

const filtersButton = (page: Page) => page.getByRole("button", { name: "Filters", exact: true });
const drawer = (page: Page) => page.getByRole("dialog", { name: "Filters" });
const historyLength = (page: Page) => page.evaluate(() => history.length);

test("filters drawer: a change updates the results and the URL (a replace), keeps the drawer open and the focus on the control, and announces the count", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openRoute(page, { name: "search", path: SEARCH("hotel") });
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(250);
    const at = `drawer at ${width}px`;
    if (width >= 1024) {
      await expect(filtersButton(page), `${at}: the filters are a sidebar from 1024`).toBeHidden();
      continue;
    }
    await filtersButton(page).click();
    await expect(drawer(page), `${at}: opens`).toBeVisible();
    const status = drawer(page).getByRole("status");
    const before = { url: page.url(), history: await historyLength(page) };

    // A checkbox.
    const checkbox = drawer(page).locator("input[type=checkbox]").first();
    await checkbox.check({ force: true });
    await expect(page, `${at}: the URL has the filter`).not.toHaveURL(before.url);
    await expect(drawer(page), `${at}: the drawer stays open after a checkbox`).toBeVisible();
    expect(await historyLength(page), `${at}: no new history entry for a checkbox`).toBe(before.history);
    expect(await checkbox.evaluate((element) => element === document.activeElement), `${at}: the focus stays on the checkbox`).toBe(true);
    await expect(status, `${at}: the count is announced`).toHaveText(/^\d+ results?$/);
    await expect(status, `${at}: a polite live region`).toHaveAttribute("aria-live", "polite");
    await expect(drawer(page).getByRole("button", { name: /^Show \d+ results?$/ }), `${at}: the button shows the count`).toBeVisible();

    // The price slider (a keyboard step), then a radio (the guest rating).
    const slider = drawer(page).locator("input[type=range]").first();
    const beforeSlider = page.url();
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(page, `${at}: the price is in the URL`).not.toHaveURL(beforeSlider);
    await expect(drawer(page), `${at}: the drawer stays open after the price`).toBeVisible();
    expect(await slider.evaluate((element) => element === document.activeElement), `${at}: the focus stays on the price slider`).toBe(true);
    const radio = drawer(page).locator("input[type=radio]").first();
    if (await radio.count()) {
      await radio.check({ force: true });
      await expect(drawer(page), `${at}: the drawer stays open after the rating`).toBeVisible();
      expect(await radio.evaluate((element) => element === document.activeElement), `${at}: the focus stays on the rating`).toBe(true);
    }
    expect(await historyLength(page), `${at}: still no new history entry (every change replaced the entry)`).toBe(before.history);

    // The four ways to close it, each returning the focus to the Filters button.
    const closers: [string, () => Promise<void>][] = [
      ["Show N results", () => drawer(page).getByRole("button", { name: /^Show / }).click()],
      ["the close button", () => drawer(page).getByRole("button", { name: "Close filters" }).click()],
      ["Escape", () => page.keyboard.press("Escape")],
      ["the dimmed area", () => page.mouse.click(width - 8, 300)],
    ];
    for (const [name, close] of closers) {
      await close();
      await expect(drawer(page), `${at}: ${name} closes the drawer`).toBeHidden();
      await expect(filtersButton(page), `${at}: ${name} returns the focus to the Filters button`).toBeFocused();
      await filtersButton(page).click();
      await expect(drawer(page), `${at}: reopens`).toBeVisible();
    }
    await page.keyboard.press("Escape");
    await expect(drawer(page)).toBeHidden();
    // The filters stay applied once it is closed.
    await expect(page).toHaveURL(/types=|stars=|places=|amenities=|board=|minPrice=|rating=/);
    await page.goto(SEARCH("hotel"));
    await page.waitForLoadState("load");
  }
});

/** The text of every card of the page (the cards are `article` elements; the booking box and the banner are not). */
const cardTexts = (page: Page) => page.locator("article").evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).innerText));

const LISTINGS = [
  { name: "search list (no dates)", path: "/search?type=hotel", cards: true },
  { name: "search grid (no dates)", path: "/search?type=hotel&view=grid", cards: true },
  { name: "search packages grid (no dates)", path: "/search?type=package&view=grid", cards: true },
  { name: "home", path: "/", cards: true },
  { name: "hotel category", path: "/hotels/wellness-resorts", cards: true },
  { name: "region", path: "/destinations/asia", cards: true },
  { name: "related cards on a hotel page", path: "/hotels/h/azure-spa-and-wellness-resort-krabi", cards: true },
  { name: "related cards on an experience page", path: "/experiences/e/ubud-yoga-and-detox-retreat", cards: true },
  { name: "related cards on a package page", path: "/packages/p/bali-soul-surf", cards: true },
];

for (const entry of LISTINGS) {
  test(`cards never say "${PLACEHOLDER}": ${entry.name}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await openRoute(page, { name: entry.name, path: entry.path });
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(200);
      const texts = await cardTexts(page);
      expect(texts.length, `${entry.name} at ${width}px: cards on the page`).toBeGreaterThan(0);
      for (const text of texts) expect(text, `${entry.name} at ${width}px: a card has the placeholder`).not.toContain(PLACEHOLDER);
    }
  });
}

test("cards without dates keep their height and have no price text; with valid dates the price shows as before, at the same height", async ({ page }) => {
  const WIDTHS_HERE = [390, 768, 1280];
  const measure = async () =>
    page.locator("article").evaluateAll((nodes) => nodes.slice(0, 3).map((node) => ({ height: Math.round(node.getBoundingClientRect().height), text: (node as HTMLElement).innerText.replace(/\s+/g, " ") })));
  for (const view of ["list", "grid"] as const) {
    const suffix = view === "grid" ? "&view=grid" : "";
    const without: Record<number, Awaited<ReturnType<typeof measure>>> = {};
    const withDates: Record<number, Awaited<ReturnType<typeof measure>>> = {};
    await page.setViewportSize({ width: 390, height: 900 });
    await openRoute(page, { name: `no dates ${view}`, path: `/search?type=hotel${suffix}` });
    for (const width of WIDTHS_HERE) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(250);
      without[width] = await measure();
    }
    await page.setViewportSize({ width: 390, height: 900 });
    await openRoute(page, { name: `dates ${view}`, path: `/search?type=hotel${suffix}&${DATES}` });
    for (const width of WIDTHS_HERE) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(250);
      withDates[width] = await measure();
    }
    for (const width of WIDTHS_HERE) {
      const at = `${view} at ${width}px`;
      expect(without[width].length, `${at}: cards`).toBeGreaterThan(0);
      for (const card of without[width]) expect(card.text, `${at}: no price text without dates`).not.toMatch(/\$|per night/);
      expect(withDates[width].some((card) => /From \$[\d,]+/.test(card.text)), `${at}: with valid dates the price shows`).toBe(true);
      // The same cards, with and without a price, are the same height (a row of the lockup's own height holds its place).
      for (let i = 0; i < Math.min(without[width].length, withDates[width].length); i++) expect(Math.abs(without[width][i].height - withDates[width][i].height), `${at}: card ${i + 1} height without and with a price`).toBeLessThanOrEqual(2);
    }
  }
});
