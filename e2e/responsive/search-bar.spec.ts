import type { Locator, Page } from "@playwright/test";
import { searchBoxFixture } from "../../src/mocks/fixtures/search";
import { expect, openRoute, test } from "./helpers";

/*
 * The search bar at every width: the hero (stacked fields below 768, a 2x2 grid with a full-width Search button from 768, one row from
 * 1024), the docked bar (one row from 1280) and, below 1280, the pill (at every width, 320 included) that opens the sheet (Task 9: as tall as its content). It resizes one page through the
 * widths, so each test runs once (in the 1280 project).
 *   - Nothing is cut: no ellipsis, no clipped input, no text out of its box, with the longest labels, the longest stay and the most guests.
 *   - Tabs: three equal tabs, 44px or more high, a 20-24px icon, a label of 13px or more, no overlap or clipping (320 included).
 *   - Pill and sheet: fields stacked and 48px or more, the Search button always on screen (844x390 included), the on-screen keyboard
 *     (a shorter viewport) keeps the focused field and the button in view, focus kept and returned, Escape closes.
 *   - The rules stay: rooms never above adults, and the same search gives the same URL from the hero and from the sheet.
 */
const WIDTHS = [320, 375, 430, 600, 768, 1024, 1280, 1440];
const LANDSCAPE = { width: 844, height: 390 };
const PILL_WIDTHS = [768, 820, 1024, 1279];

const TABS = searchBoxFixture.tabs;
const longest = (labels: string[]) => labels.reduce((a, b) => (b.length > a.length ? b : a));
const DESTINATIONS = searchBoxFixture.destinationGroups.flatMap((group) => group.options);
const LONG_DESTINATION = DESTINATIONS.reduce((a, b) => (b.label.length > a.label.length ? b : a));
const stay = "checkIn=2099-12-28&checkOut=2100-01-03&rooms=8&adults=9&children=6&childAges=1,2,3,4,5,6"; // the longest dates and the most guests

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "laptop-1280", "resizes one page through the widths itself: runs once");
});

/** Everything in the root that is cut: an ellipsis that is on, an input whose text is wider than it, a box that hides what is wider or taller than it. */
async function cutOff(root: Locator): Promise<string[]> {
  return root.evaluate((element) => {
    const issues: string[] = [];
    const visible = (node: Element) => {
      const box = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return box.width > 0 && box.height > 0 && style.visibility !== "hidden" && style.display !== "none" && !node.closest(".sr-only");
    };
    for (const node of element.querySelectorAll<HTMLElement>("*")) {
      if (!visible(node)) continue;
      const style = getComputedStyle(node);
      const name = `${node.tagName.toLowerCase()}${node.getAttribute("aria-label") ? `[${node.getAttribute("aria-label")}]` : ""} "${(node.textContent ?? "").trim().slice(0, 28)}"`;
      if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
        if (node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1) issues.push(`field cut: ${node.value || node.placeholder}`);
        continue;
      }
      const hides = style.overflowX !== "visible" || style.overflowY !== "visible";
      if (style.textOverflow === "ellipsis" && node.scrollWidth > node.clientWidth + 1) issues.push(`ellipsis: ${name}`);
      if (hides && (node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1) && (node.textContent ?? "").trim() && !node.hasAttribute("data-sheet-body")) {
        issues.push(`hidden overflow: ${name} (${node.scrollWidth}x${node.scrollHeight} in ${node.clientWidth}x${node.clientHeight})`);
      }
    }
    return issues;
  });
}

const hero = (page: Page) => page.locator('form[aria-label="Search Vacayou"]').first();

for (const tab of TABS) {
  test(`hero, ${tab.label} tab: nothing is cut off at any width, empty and with the longest values`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openRoute(page, { name: "home", path: "/" });
    await hero(page).getByRole("tab", { name: tab.label }).click();
    for (const filled of [false, true]) {
      if (filled) {
        await hero(page).getByRole("combobox").nth(0).click();
        await page.getByRole("option", { name: longest(tab.types.map((type) => type.label)), exact: true }).click();
        await hero(page).getByRole("combobox").nth(1).click();
        await page.getByRole("option", { name: LONG_DESTINATION.label, exact: true }).click();
        await page.keyboard.press("Escape");
      }
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(150);
        expect(await cutOff(hero(page)), `${tab.label}${filled ? " (long values)" : ""} at ${width}px`).toEqual([]);
      }
    }
  });
}

test("hero: stacked fields below 768, a 2x2 grid and a full-width Search button from 768, one row from 1024", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRoute(page, { name: "home", path: "/" });
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    const at = `hero at ${width}px`;
    const layout = await hero(page).evaluate((form) => {
      const panel = form.querySelector('[role="tabpanel"]')!;
      const fields = [...panel.children].slice(0, 4).map((cell) => cell.getBoundingClientRect());
      const button = form.querySelector<HTMLElement>('button[type="submit"]')!.getBoundingClientRect();
      const panelBox = panel.getBoundingClientRect();
      return { lefts: new Set(fields.map((box) => Math.round(box.left))).size, tops: new Set(fields.map((box) => Math.round(box.top))).size, heights: fields.map((box) => box.height), buttonWidth: button.width, buttonTop: button.top, fieldsBottom: Math.max(...fields.map((box) => box.bottom)), panelWidth: panelBox.width };
    });
    const columns = width < 768 ? 1 : width < 1024 ? 2 : 4;
    expect(layout.lefts, `${at}: columns`).toBe(columns);
    expect(Math.min(...layout.heights), `${at}: every field is 48px or more`).toBeGreaterThanOrEqual(48);
    if (width < 1024) {
      expect(layout.buttonWidth, `${at}: Search is full width`).toBeGreaterThan(layout.panelWidth - 40);
      expect(layout.buttonTop, `${at}: Search is under the fields`).toBeGreaterThanOrEqual(layout.fieldsBottom - 1);
    } else {
      expect(layout.buttonTop, `${at}: Search is on the row of the fields`).toBeLessThan(layout.fieldsBottom);
    }
  }
});

test("tabs: three equal tabs, 44px or more, a 20-24px icon, a 13px label, nothing overlapping or clipped (320 included)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRoute(page, { name: "home", path: "/" });
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    const tabs = await hero(page).getByRole("tab").evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect();
        const icon = node.querySelector("svg")!.getBoundingClientRect();
        const range = document.createRange();
        const label = [...node.childNodes].find((child) => child.nodeType === Node.TEXT_NODE)!;
        range.selectNodeContents(label);
        const text = range.getBoundingClientRect();
        return {
          width: box.width, height: box.height, icon: icon.width, font: parseFloat(getComputedStyle(node).fontSize),
          textInside: text.left >= box.left - 0.5 && text.right <= box.right + 0.5 && text.top >= box.top - 0.5 && text.bottom <= box.bottom + 0.5,
          overlap: !(icon.right <= text.left + 0.5 || icon.left >= text.right - 0.5 || icon.bottom <= text.top + 0.5 || icon.top >= text.bottom - 0.5),
          clipped: node.scrollWidth > node.clientWidth + 1,
        };
      }),
    );
    const at = `tabs at ${width}px`;
    expect(tabs, `${at}: three tabs`).toHaveLength(3);
    expect(Math.max(...tabs.map((tab) => tab.width)) - Math.min(...tabs.map((tab) => tab.width)), `${at}: equal widths`).toBeLessThanOrEqual(1);
    for (const tab of tabs) {
      expect(tab.height, `${at}: height`).toBeGreaterThanOrEqual(44);
      expect(tab.icon, `${at}: icon size`).toBeGreaterThanOrEqual(20);
      expect(tab.icon, `${at}: icon size`).toBeLessThanOrEqual(24);
      expect(tab.font, `${at}: label size`).toBeGreaterThanOrEqual(13);
      expect(tab.textInside, `${at}: the label is inside its tab`).toBe(true);
      expect(tab.overlap, `${at}: the icon and the label do not overlap`).toBe(false);
      expect(tab.clipped, `${at}: the tab is not clipped`).toBe(false);
    }
  }
});

/** The results page with the longest stay and the most guests: the bar (xl and up) and the pill (below) show it. */
const RESULTS = `/search?type=experience&category=${longest(TABS[0].types.map((type) => type.label)).toLowerCase().replace(/[^a-z0-9]+/g, "-")}&destination=${LONG_DESTINATION.slug}&${stay}`;

test("docked bar from 1280 and pill below it: nothing cut off, the right one at each width", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRoute(page, { name: "results", path: RESULTS });
  for (const width of [768, 820, 1024, 1279, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(250);
    const at = `results bar at ${width}px`;
    const row = page.locator('form[aria-label="Quick search"]');
    const pill = page.getByRole("button", { name: /^Edit search/ }).first();
    if (width >= 1280) {
      await expect(row, `${at}: the row`).toBeVisible();
      expect(await cutOff(row), at).toEqual([]);
    } else {
      await expect(row, `${at}: no row below 1280`).toBeHidden();
      await expect(pill, `${at}: the pill`).toBeVisible();
      expect(await cutOff(pill), `${at}: pill text`).toEqual([]);
    }
  }
});

/** Opens the pill's sheet on the results page and returns it. */
async function openSheet(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: /^Edit search/ }).first().click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("search")).toBeVisible();
  await page.waitForTimeout(200);
  return sheet;
}

test("the sheet: stacked fields of 48px or more, Search always on screen, scrolls inside, focus kept, Escape closes, below 1280 and in landscape", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRoute(page, { name: "results", path: RESULTS });
  const sizes = [...PILL_WIDTHS.map((width) => ({ width, height: 900 })), { width: 375, height: 812 }, { width: 320, height: 640 }, LANDSCAPE];
  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.waitForTimeout(250);
    const at = `sheet at ${size.width}x${size.height}`;
    const sheet = await openSheet(page);
    const layout = await sheet.evaluate((element) => {
      const panel = element.querySelector('[role="tabpanel"]')!;
      const fields = [...panel.children].map((cell) => cell.getBoundingClientRect());
      const body = element.querySelector<HTMLElement>("[data-sheet-body]")!;
      const button = element.querySelector<HTMLElement>('button[type="submit"]')!.getBoundingClientRect();
      const box = element.getBoundingClientRect();
      return { lefts: new Set(fields.map((f) => Math.round(f.left))).size, heights: fields.map((f) => f.height), scrolls: body.scrollHeight > body.clientHeight + 1, button: { top: button.top, bottom: button.bottom }, innerHeight: window.innerHeight, sheet: { top: box.top, bottom: box.bottom, width: box.width, height: box.height }, innerWidth: window.innerWidth };
    });
    expect(layout.lefts, `${at}: the fields are stacked`).toBe(1);
    expect(Math.min(...layout.heights), `${at}: fields are 48px or more`).toBeGreaterThanOrEqual(48);
    expect(layout.sheet.width, `${at}: the sheet is full width (phones and tablets alike)`).toBeGreaterThanOrEqual(layout.innerWidth - 1);
    expect(layout.sheet.height, `${at}: at most 90dvh`).toBeLessThanOrEqual(layout.innerHeight * 0.9 + 1);
    expect(layout.sheet.bottom, `${at}: the sheet fits the screen`).toBeLessThanOrEqual(layout.innerHeight + 1);
    expect(layout.button.bottom, `${at}: Search is on screen`).toBeLessThanOrEqual(layout.innerHeight + 1);
    expect(layout.button.top, `${at}: Search is on screen`).toBeGreaterThanOrEqual(0);
    if (size.height <= 400) expect(layout.scrolls, `${at}: the body scrolls inside the sheet when it is short`).toBe(true);
    // Nothing is cut inside the sheet either.
    expect(await cutOff(sheet), `${at}: nothing cut off in the sheet`).toEqual([]);
    // Search stays put while the body scrolls.
    await sheet.locator("[data-sheet-body]").evaluate((body) => body.scrollTo(0, body.scrollHeight));
    const after = await sheet.getByRole("button", { name: "Search", exact: true }).boundingBox();
    expect(after!.y + after!.height, `${at}: Search stays on screen while the body scrolls`).toBeLessThanOrEqual(size.height + 1);
    // Focus stays inside, Escape closes, focus returns to the pill.
    for (let step = 0; step < 14; step++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')), `${at}: focus left the sheet after ${step + 1} Tab presses`).toBe(true);
    }
    // Tab may have opened a field's list: Escape closes that first, the next one closes the sheet.
    await page.keyboard.press("Escape");
    if (await page.getByRole("dialog").count()) await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog"), `${at}: Escape closes`).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Edit search/ }).first(), `${at}: focus returns to the pill`).toBeFocused();
  }
});

test("the sheet with the on-screen keyboard (a short viewport): the focused field and Search stay in view", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openRoute(page, { name: "results", path: RESULTS });
  const sheet = await openSheet(page);
  // The keyboard takes about 300px: the viewport gets shorter, the way the visual viewport does on a phone.
  await page.setViewportSize({ width: 390, height: 520 });
  await page.waitForTimeout(300);
  await sheet.getByRole("combobox").nth(1).locator("xpath=ancestor::label").click();
  await page.waitForTimeout(700);
  const view = await sheet.evaluate((element) => {
    const input = element.querySelectorAll<HTMLElement>('[role="combobox"]')[1].getBoundingClientRect();
    const body = element.querySelector("[data-sheet-body]")!.getBoundingClientRect();
    const button = element.querySelector<HTMLElement>('button[type="submit"]')!.getBoundingClientRect();
    return { input: { top: input.top, bottom: input.bottom }, body: { top: body.top, bottom: body.bottom }, button: { top: button.top, bottom: button.bottom }, innerHeight: window.innerHeight };
  });
  expect(view.input.top, "the focused field is inside the visible body").toBeGreaterThanOrEqual(view.body.top - 1);
  expect(view.input.bottom, "the focused field is inside the visible body").toBeLessThanOrEqual(view.body.bottom + 1);
  expect(view.button.bottom, "Search is above the bottom of the short viewport").toBeLessThanOrEqual(view.innerHeight + 1);
  // Typing narrows the list in place, under the field.
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("bal");
  await expect(sheet.getByRole("option").first()).toBeVisible();
});

test("the pill and the row follow the docked-bar rules: details from the first pixel, the pill at every width below 1280", async ({ page }) => {
  const HOTEL = "/hotels/h/azure-spa-and-wellness-resort-krabi";
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRoute(page, { name: "hotel", path: HOTEL });
  for (const [width, expected] of [[375, "pill"], [767, "pill"], [768, "pill"], [1279, "pill"], [1280, "row"], [1440, "row"]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(250);
    const at = `hotel page at ${width}px`;
    const pill = page.getByRole("button", { name: /^Edit search/ });
    const row = page.locator('form[aria-label="Quick search"]');
    if (expected === "pill") {
      await expect(pill.first(), `${at}: the pill`).toBeVisible();
      await expect(row, `${at}: no row`).toBeHidden();
    } else {
      await expect(row, `${at}: the row`).toBeVisible();
      await expect(pill.first(), `${at}: no pill`).toBeHidden();
    }
    {
      // The tab bar and the booking box sit under the bar, not behind it.
      const offsets = await page.evaluate(() => {
        const tabs = document.querySelector<HTMLElement>('[role="tablist"][aria-label="Hotel information"]')?.parentElement;
        const header = document.querySelector("header")!.getBoundingClientRect().bottom;
        return { header, docked: getComputedStyle(document.documentElement).getPropertyValue("--docked-search-h"), tabsTop: tabs ? parseFloat(getComputedStyle(tabs).top) : null };
      });
      expect(offsets.tabsTop, `${at}: the sticky tabs are below the header and the docked bar`).toBeGreaterThanOrEqual(offsets.header + 63);
    }
  }
});

test("rooms never go above adults in the sheet, and the sheet and the hero build the same search URL", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const type = TABS[0].types[0].label;
  // 1. the hero on Home (1280 is wide enough for the row): pick a type and a destination, press Search.
  await openRoute(page, { name: "home", path: "/" });
  await page.setViewportSize({ width: 1024, height: 900 });
  await hero(page).getByRole("combobox").nth(0).click();
  await page.getByRole("option", { name: type, exact: true }).click();
  await hero(page).getByRole("combobox").nth(1).click();
  await page.getByRole("option", { name: LONG_DESTINATION.label, exact: true }).click();
  await hero(page).getByRole("button", { name: "Search", exact: true }).click();
  await page.waitForURL(/\/search\?/);
  const fromHero = new URL(page.url());

  // 2. the sheet on another page: the same two picks, press Search.
  await openRoute(page, { name: "hotel", path: "/hotels/h/azure-spa-and-wellness-resort-krabi" });
  await page.setViewportSize({ width: 820, height: 900 });
  await page.waitForTimeout(250);
  const sheet = await openSheet(page);
  await sheet.getByRole("combobox").nth(0).locator("xpath=ancestor::label").click();
  await sheet.getByRole("option", { name: type, exact: true }).click();
  await sheet.getByRole("combobox").nth(1).locator("xpath=ancestor::label").click();
  await sheet.getByRole("option", { name: LONG_DESTINATION.label, exact: true }).click();
  // Rooms never above adults: a second room raises the adults to two.
  await sheet.getByRole("button", { name: /^Who/ }).click();
  await sheet.getByRole("button", { name: "More rooms" }).click();
  await expect(sheet.getByRole("button", { name: /^Who/ })).toContainText("2 travellers");
  await sheet.getByRole("button", { name: "Fewer adults" }).click();
  await expect(sheet.getByRole("button", { name: /^Who/ })).toContainText("1 traveller");
  await sheet.getByRole("button", { name: "Done" }).click();
  await sheet.getByRole("button", { name: "Search", exact: true }).click();
  await page.waitForURL(/\/search\?/);
  const fromSheet = new URL(page.url());

  expect(fromSheet.pathname).toBe(fromHero.pathname);
  expect([...fromSheet.searchParams.keys()].sort(), "the same parameters").toEqual([...fromHero.searchParams.keys()].sort());
  for (const key of ["type", "category", "destination", "rooms", "adults", "children"]) expect(fromSheet.searchParams.get(key), key).toBe(fromHero.searchParams.get(key));
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
