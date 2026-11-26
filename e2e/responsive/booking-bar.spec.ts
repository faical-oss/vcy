import type { Locator, Page } from "@playwright/test";
import { DATES } from "./routes";
import { expect, openRoute, test } from "./helpers";

/*
 * The reserve bar of the hotel, experience and package pages below lg (src/components/sections/detail/mobile-booking-bar.tsx). It runs once
 * (in the 1280 project) and sets the sizes itself: 375, 430, 768 and 844x390 landscape.
 *   - It says what the desktop card says: the dates, the travellers, for a hotel the rooms chosen, the lowest price per night or per person
 *     and, for a hotel with its rooms chosen, the total. Experiences and packages never show the rooms line or a total.
 *   - With no dates there is no price: one full-width "Select dates" button that opens the dates.
 *   - The summary is one button: its accessible name starts with its visible text and ends with "Change dates and guests"; it is 44px or
 *     more high, has a chevron, a pressed and a focus state, and opens the sheet.
 *   - The bar is at least 5rem high and as tall as its content (the rooms of a hotel are one per line, two at most): `--booking-bar-h` follows it (Task 9; round2.spec.ts).
 *   - The page and the footer have room for it, whatever the state.
 */
const SIZES = [
  { width: 375, height: 812 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
];
const PAGES = [
  { kind: "hotel", path: "/hotels/h/azure-spa-and-wellness-resort-krabi", unit: "per night" },
  { kind: "experience", path: "/experiences/e/ubud-yoga-and-detox-retreat", unit: "per person" },
  { kind: "package", path: "/packages/p/bali-soul-surf", unit: "per person" },
] as const;

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "laptop-1280", "sets the sizes itself: runs once");
});

const bar = (page: Page) => page.locator("[data-booking-bar]");
const summary = (page: Page) => page.locator("[data-booking-summary]");
const box = async (locator: Locator) => (await locator.boundingBox())!;

/** What is on screen in the summary: the text that is rendered, without the part only a screen reader gets. */
const visibleText = (button: Locator) =>
  button.evaluate((element) => {
    const walk = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
      if (!(node instanceof HTMLElement) || getComputedStyle(node).display === "none" || node.classList.contains("sr-only")) return "";
      return [...node.childNodes].map(walk).join(" ");
    };
    return walk(element).replace(/\s+/g, " ").trim();
  });

/** The accessible name of a button, from the accessibility tree. */
const nameOf = async (button: Locator) => /^- button "(.*)"/.exec(await button.ariaSnapshot())?.[1] ?? "";
const squash = (value: string) => value.replace(/\s+/g, "");

for (const entry of PAGES) {
  test(`${entry.kind}: with no dates there is no price, only a full-width "Select dates" that opens the dates`, async ({ page }) => {
    for (const size of SIZES) {
      await page.setViewportSize(size);
      await openRoute(page, { name: entry.kind, path: entry.path });
      const at = `${entry.kind} at ${size.width}x${size.height}`;
      await expect(summary(page), `${at}: no summary without dates`).toHaveCount(0);
      expect(await bar(page).innerText(), `${at}: no price`).not.toContain("$");
      const button = bar(page).getByRole("button", { name: "Select dates" });
      await expect(button, `${at}: the button`).toBeVisible();
      expect((await box(button)).width, `${at}: full width`).toBeGreaterThan(size.width - 48);
      expect(await button.locator("svg").count(), `${at}: calendar icon`).toBeGreaterThan(0);
      await button.click();
      const sheet = page.getByRole("dialog", { name: /^Book this/ });
      await expect(sheet, `${at}: the sheet opens`).toBeVisible();
      await expect(sheet.getByRole("dialog", { name: "Choose your dates" }), `${at}: on the dates`).toBeVisible();
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
      await expect(sheet).toHaveCount(0);
    }
  });

  test(`${entry.kind}: with dates the summary is one obvious button, wraps without cutting, and the bar keeps its height`, async ({ page }) => {
    for (const size of SIZES) {
      await page.setViewportSize(size);
      await openRoute(page, { name: entry.kind, path: `${entry.path}?${DATES}` });
      const at = `${entry.kind} at ${size.width}x${size.height}`;
      await expect(summary(page), `${at}: the summary`).toBeVisible();
      await expect(bar(page).locator("[data-booking-price]").getByText(/From \$/), `${at}: the price, on the right above the button`).toBeVisible();
      const text = await visibleText(summary(page));
      expect(text, `${at}: the dates`).toMatch(/14–\d+ Oct/);
      expect(text, `${at}: travellers`).toContain("2 travellers");
      expect(await visibleText(bar(page)), `${at}: ${entry.unit}`).toContain(entry.unit);
      if (entry.kind !== "hotel") {
        expect(text, `${at}: no rooms line`).not.toMatch(/selected|Choose/);
        expect(text, `${at}: no total`).not.toContain("Total");
      }

      // One button, 44px or more, a chevron, with a name that starts with what is on screen.
      expect((await box(summary(page))).height, `${at}: 44px or more`).toBeGreaterThanOrEqual(44);
      expect(await summary(page).locator("svg").count(), `${at}: chevron`).toBeGreaterThan(0);
      expect(await summary(page).getAttribute("aria-label"), `${at}: no aria-label that leaves the text out`).toBeNull();
      const name = await nameOf(summary(page));
      expect(squash(name).startsWith(squash(text)), `${at}: the name "${name}" starts with the visible text "${text}"`).toBe(true);
      expect(name.endsWith("Change dates and guests"), `${at}: the name ends with "Change dates and guests"`).toBe(true);

      // Nothing cut: every line is inside the button and the button holds all of its text.
      const cut = await summary(page).evaluate((element) => {
        const outer = element.getBoundingClientRect();
        return { overflow: element.scrollHeight - element.clientHeight, lines: [...element.querySelectorAll<HTMLElement>("span")].filter((span) => span.textContent && !span.classList.contains("sr-only") && getComputedStyle(span).display !== "none").some((span) => { const rect = span.getBoundingClientRect(); return rect.bottom > outer.bottom + 0.5 || rect.top < outer.top - 0.5 || rect.right > outer.right + 0.5; }) };
      });
      expect(cut.overflow, `${at}: the summary holds its text`).toBeLessThanOrEqual(1);
      expect(cut.lines, `${at}: no line leaves the button`).toBe(false);

      // Pressed and focus states.
      const rest = await summary(page).evaluate((element) => getComputedStyle(element).backgroundColor);
      const center = await box(summary(page));
      await page.mouse.move(center.x + center.width / 2, center.y + center.height / 2);
      await page.mouse.down();
      const pressed = await summary(page).evaluate((element) => getComputedStyle(element).backgroundColor);
      await page.mouse.move(0, 0);
      await page.mouse.up();
      expect(pressed, `${at}: a pressed state`).not.toBe(rest);
      await page.keyboard.press("Tab");
      await summary(page).focus();
      const ring = await summary(page).evaluate((element) => { const style = getComputedStyle(element); return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) }; });
      expect(ring.style, `${at}: a focus ring`).not.toBe("none");
      expect(ring.width, `${at}: a focus ring`).toBeGreaterThan(0);

      // The height is the same as with no dates, and the variable says so.
      const heights = await page.evaluate(() => {
        const probe = document.createElement("div");
        probe.style.cssText = "position:absolute;visibility:hidden;height:var(--booking-bar-h)";
        document.body.append(probe);
        const variable = probe.getBoundingClientRect().height;
        probe.remove();
        return { bar: document.querySelector("[data-booking-bar]")!.getBoundingClientRect().height, variable };
      });
      expect(heights.bar, `${at}: the bar is --booking-bar-h high`).toBeCloseTo(heights.variable, 0);
      expect(heights.bar, `${at}: 5rem plus the safe area`).toBeGreaterThanOrEqual(80);

      // Room at the end of the page: everything in the footer ends above the bar (the footer's own spacer is under it).
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(150);
      const ends = await page.evaluate(() => {
        const bottoms = [...document.querySelector("footer")!.querySelectorAll<HTMLElement>("*")].filter((node) => node.getBoundingClientRect().height > 0).map((node) => node.getBoundingClientRect().bottom);
        return { footer: Math.max(...bottoms), bar: document.querySelector("[data-booking-bar]")!.getBoundingClientRect().top };
      });
      expect(ends.footer, `${at}: the last line of the footer is above the bar`).toBeLessThanOrEqual(ends.bar + 1);
    }
  });

  test(`${entry.kind}: the summary opens the sheet and a primary button follows the card`, async ({ page }) => {
    await page.setViewportSize(SIZES[0]);
    await openRoute(page, { name: entry.kind, path: `${entry.path}?${DATES}` });
    await summary(page).click();
    await expect(page.getByRole("dialog", { name: /^Book this/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: /^Book this/ })).toHaveCount(0);
    await expect(summary(page), "focus returns to the summary").toBeFocused();
    await expect(bar(page).getByRole("button", { name: entry.kind === "hotel" ? /Reserve now/ : /Reserve now/ })).toBeVisible();
  });

  test(`${entry.kind}: nothing available says so, without a price, and the button is disabled`, async ({ page }) => {
    await page.setViewportSize(SIZES[0]);
    await openRoute(page, { name: entry.kind, path: `${entry.path}?${DATES}&mock=none` });
    await expect(bar(page).getByText("Not available for your dates")).toBeVisible();
    expect(await visibleText(bar(page)), "no price").not.toContain("$");
    await expect(bar(page).getByRole("button", { name: "Reserve now" })).toBeDisabled();
    expect((await box(bar(page))).height, "same height as with no dates").toBeGreaterThanOrEqual(80);
  });

  test(`${entry.kind}: loading to loaded does not move or resize the bar and shifts nothing`, async ({ page }) => {
    await page.setViewportSize(SIZES[0]);
    await page.route("**/api/rooms/availability**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((list) => {
        for (const item of list.getEntries() as unknown as { hadRecentInput: boolean; value: number }[]) if (!item.hadRecentInput) (window as unknown as { __cls: number }).__cls += item.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(`${entry.path}?${DATES}`, { waitUntil: "load" });
    await expect(page.getByRole("status", { name: "Loading prices" }).last()).toBeVisible();
    const loading = await box(bar(page));
    await expect(bar(page).getByRole("button", { name: "Checking…" })).toBeDisabled();
    const before = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    await expect(bar(page).getByText(/From \$/)).toBeVisible({ timeout: 15_000 });
    const loaded = await box(bar(page));
    const after = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(loaded.height, "the bar keeps its height").toBeCloseTo(loading.height, 0);
    expect(loaded.y, "the bar keeps its place").toBeCloseTo(loading.y, 0);
    expect(after - before, "layout shift from loading to loaded").toBeLessThan(0.01);
  });
}

test("hotel: the rooms line says what to do, then the count and the types, wrapped, and only the count in landscape; the total follows", async ({ page }) => {
  const path = `/hotels/h/azure-spa-and-wellness-resort-krabi?${DATES}`;
  await page.setViewportSize(SIZES[0]);
  await openRoute(page, { name: "hotel", path });
  await expect(summary(page).getByText(/Choose 1 room to reserve/).first()).toBeVisible();
  await expect(bar(page).getByRole("button", { name: "Reserve now" })).toBeDisabled();
  expect(await visibleText(summary(page)), "no total before the rooms are chosen").not.toContain("Total");

  // Choose a room in the Rooms tab (the room picker is not touched by the bar).
  await page.getByRole("tab", { name: "Rooms" }).click();
  await page.getByRole("button", { name: "Select room" }).first().click();
  await expect(summary(page).getByText(/1 of 1 room selected/).first()).toBeVisible();
  const portrait = await visibleText(summary(page));
  expect(portrait, "the type is named, on its own line").toMatch(/1 of 1 room selected\s+1 × \S/);
  expect(await visibleText(bar(page)), "the total, as the card says it").toMatch(/Total for 7 nights \$/);
  await expect(bar(page).getByRole("button", { name: "Reserve now" })).toBeEnabled();
  const portraitHeight = (await box(bar(page))).height;

  // Landscape: the count only, and the bar is as high as before.
  await page.setViewportSize(SIZES[3]);
  await page.waitForTimeout(250);
  const landscape = await visibleText(summary(page));
  expect(landscape, "the count only in landscape").toContain("1 of 1 room selected");
  expect(landscape, "no types in landscape").not.toContain("×");
  expect((await box(bar(page))).height, "the bar is as tall as its content: no taller than in portrait").toBeLessThanOrEqual(portraitHeight + 1);
  // 320px collapses it too, and still nothing is cut.
  await page.setViewportSize({ width: 320, height: 640 });
  await page.waitForTimeout(250);
  // Under 360px wide the rooms line gives way (the sheet has the rooms), so the dates, the travellers and the total still fit.
  expect(await visibleText(summary(page)), "no rooms line at 320px").not.toContain("selected");
  expect(await visibleText(bar(page)), "the total at 320px").toContain("Total for 7 nights");
  expect(await summary(page).evaluate((element) => element.scrollHeight - element.clientHeight), "nothing cut at 320px").toBeLessThanOrEqual(1);
});
