import type { Locator, Page } from "@playwright/test";
import { SEARCH } from "./routes";
import { expect, openRoute, test } from "./helpers";

/*
 * The panels of the search box (type, destination, dates, travellers) in every bar and on several pages, at the six widths of the
 * review, and the menu's header buttons. It resizes one page through the widths, so it runs once (in the 1280 project).
 *   From 1024 a panel hangs under its field: left edge on the field's when there is room, shifted left to stay inside the bar, never wider
 *   than the bar, 16px from the viewport edge. Below 1024 the dates and travellers are a sheet (full width, Close button, focus kept, Escape
 *   closes) and the two lists are as wide as the bar with a Close button. Never a horizontal scroll of the page; always on top.
 */
const WIDTHS = [375, 430, 768, 820, 1024, 1280, 1440];
const GUTTER = 16;

interface BarCase {
  name: string;
  path: string;
  /** Which bar: the hero box, the docked bar, or the results page's (docked from md, the summary's "Edit search" on a phone). */
  bar: "hero" | "docked" | "results";
}

const CASES: BarCase[] = [
  { name: "home hero", path: "/", bar: "hero" },
  { name: "home docked bar", path: "/", bar: "docked" },
  { name: "results page", path: SEARCH("hotel"), bar: "results" },
  { name: "all destinations", path: "/destinations", bar: "docked" },
  { name: "lifestyle page", path: "/lifestyle/adventure", bar: "docked" },
  { name: "hotel category", path: "/hotels/wellness-resorts", bar: "docked" },
];

const FORM = { hero: 'form[aria-label="Search Vacayou"]', docked: 'form[aria-label="Quick search"]', results: 'form[role="search"]' } as const;

/**
 * Brings the wanted bar on screen at this width, or says it does not exist there. The docked bar is a row from 1280 (below it the
 * pill and its sheet, tested in search-bar.spec.ts), and a phone's results page has the pill.
 */
async function showBar(page: Page, entry: BarCase, width: number): Promise<Locator | null> {
  await page.evaluate(() => window.scrollTo(0, 0));
  if (entry.bar !== "hero") {
    if (width < 1280) return null;
    if (entry.bar === "docked") await page.evaluate(() => window.scrollTo(0, 900));
  }
  await page.waitForTimeout(450);
  const forms = page.locator(FORM[entry.bar]);
  for (let index = 0; index < (await forms.count()); index++) {
    const form = forms.nth(index);
    const usable = await form.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && !element.closest("[inert]") && getComputedStyle(element).visibility !== "hidden";
    });
    if (usable) return form;
  }
  return null;
}

type Kind = "type" | "destination" | "dates" | "guests";

function opener(bar: Locator, kind: Kind): Locator {
  // In the docked bar at 768 the fields are icons only (the input has no width): a visitor taps the field, which is the label.
  if (kind === "type") return bar.getByRole("combobox").nth(0).locator("xpath=ancestor::label");
  if (kind === "destination") return bar.getByRole("combobox").nth(1).locator("xpath=ancestor::label");
  return bar.getByRole("button", { name: kind === "dates" ? /^When/ : /^Who/ });
}

async function metrics(page: Page, bar: Locator, sheet: boolean) {
  const handle = await bar.elementHandle();
  return page.evaluate(
    ({ form, sheet }) => {
      const panel = (sheet ? document.querySelector("[data-search-sheet]") : form!.querySelector("[data-search-panel]")) as HTMLElement | null;
      if (!panel) return null;
      const box = panel.getBoundingClientRect();
      const field = sheet ? null : (panel.offsetParent as HTMLElement | null)?.getBoundingClientRect() ?? null;
      const bounds = form!.getBoundingClientRect();
      const viewport = document.documentElement.clientWidth;
      // What is on top at five points of the panel.
      const points = [[0.5, 0.5], [0.1, 0.1], [0.9, 0.1], [0.1, 0.9], [0.9, 0.9]].map(([fx, fy]) => {
        const x = box.left + box.width * fx;
        const y = Math.min(box.top + box.height * fy, window.innerHeight - 2);
        const top = document.elementFromPoint(x, Math.max(y, 1));
        return top ? panel.contains(top) : false;
      });
      return {
        left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height,
        field: field ? { left: field.left } : null,
        bounds: { left: bounds.left, right: bounds.right, width: bounds.width },
        viewport, innerHeight: window.innerHeight,
        docOverflow: document.documentElement.scrollWidth - viewport, scrollX: window.scrollX,
        topmost: points,
      };
    },
    { form: handle, sheet },
  );
}

for (const entry of CASES) {
  test(`${entry.name}: the four panels at every width`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "laptop-1280", "resizes one page through the widths itself: runs once");
    await page.setViewportSize({ width: 1440, height: 900 });
    await openRoute(page, { name: entry.name, path: entry.path });

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      const bar = await showBar(page, entry, width);
      if (!bar) {
        expect(entry.bar, `${entry.name}: the bar exists at ${width}px`).not.toBe("hero");
        expect(width, "only the docked row is absent, and only below 1280 (the pill is there)").toBeLessThan(1280);
        continue;
      }
      for (const kind of ["type", "destination", "dates", "guests"] as const) {
        const at = `${entry.name} · ${kind} at ${width}px`;
        const field = opener(bar, kind);
        await field.click();
        const sheet = (kind === "dates" || kind === "guests") && width < 1024;
        await expect(page.locator(sheet ? "[data-search-sheet]" : "[data-search-panel]").first(), `${at}: opens`).toBeVisible();
        await page.waitForTimeout(250);
        const m = await metrics(page, bar, sheet);
        expect(m, `${at}: panel found`).not.toBeNull();
        if (!m) continue;

        // Never a sideways scroll of the page, and the panel inside the viewport.
        expect(m.docOverflow, `${at}: the page scrolls sideways`).toBeLessThanOrEqual(1);
        expect(m.scrollX, `${at}: the page was scrolled sideways`).toBe(0);
        expect(m.left, `${at}: left edge in the viewport`).toBeGreaterThanOrEqual(-0.5);
        expect(m.right, `${at}: right edge in the viewport`).toBeLessThanOrEqual(m.viewport + 0.5);
        expect(m.topmost, `${at}: the panel is on top of the page (sticky tabs, bars)`).toEqual([true, true, true, true, true]);

        if (sheet) {
          expect(m.left, `${at}: sheet starts at the left edge`).toBeLessThanOrEqual(0.5);
          expect(m.right, `${at}: sheet reaches the right edge`).toBeGreaterThanOrEqual(m.viewport - 0.5);
          expect(m.height, `${at}: sheet fits the screen`).toBeLessThanOrEqual(m.innerHeight * 0.9 + 1);
          const sheetBox = page.locator("[data-search-sheet]");
          await expect(sheetBox.getByRole("button", { name: /^Close/ }), `${at}: Close button`).toBeVisible();
          // Focus stays inside the sheet.
          for (let step = 0; step < 14; step++) {
            await page.keyboard.press("Tab");
            expect(await page.evaluate(() => !!document.activeElement?.closest("[data-search-sheet]")), `${at}: focus left the sheet after ${step + 1} Tab presses`).toBe(true);
          }
          await page.keyboard.press("Escape");
          await expect(sheetBox, `${at}: Escape closes the sheet`).toHaveCount(0);
          await expect(field, `${at}: focus returns to the field`).toBeFocused();
          continue;
        }

        // A panel under its field.
        const limitLeft = Math.max(m.bounds.left, GUTTER);
        const limitRight = Math.min(m.bounds.right, m.viewport - GUTTER);
        expect(m.left, `${at}: inside the bar and 16px from the edge (left)`).toBeGreaterThanOrEqual(limitLeft - 1);
        expect(m.right, `${at}: inside the bar and 16px from the edge (right)`).toBeLessThanOrEqual(limitRight + 1);
        expect(m.width, `${at}: not wider than the bar`).toBeLessThanOrEqual(m.bounds.width + 1);
        if (width >= 1024) {
          // From lg: left edge on the field's when there is room, else pushed left until it fits.
          const fits = m.field!.left + m.width <= limitRight + 1 && m.field!.left >= limitLeft - 1;
          if (fits) expect(Math.abs(m.left - m.field!.left), `${at}: left edge matches the field`).toBeLessThanOrEqual(1);
          else expect(Math.abs(m.right - limitRight), `${at}: pushed left to the edge of the bar`).toBeLessThanOrEqual(1);
        } else {
          // Below lg the lists are as wide as the bar, with a Close button.
          expect(m.width, `${at}: as wide as the bar`).toBeGreaterThanOrEqual(limitRight - limitLeft - 1);
          const close = bar.getByRole("button", { name: /^Close/ });
          await expect(close, `${at}: Close button`).toBeVisible();
          await close.click();
          await expect(page.locator("[data-search-panel]"), `${at}: Close closes the list`).toHaveCount(0);
          continue;
        }
        await page.keyboard.press("Escape");
        await expect(page.locator("[data-search-panel]"), `${at}: Escape closes the panel`).toHaveCount(0);
      }
    }
  });
}

test("the menu's header buttons are one size and round, closed and open", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "laptop-1280", "resizes one page through the widths itself: runs once");
  await page.setViewportSize({ width: 375, height: 812 });
  await openRoute(page, { name: "home", path: "/" });
  for (const width of [375, 430, 768, 820]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(200);
    for (const state of ["closed", "open"] as const) {
      const scope = state === "open" ? page.getByRole("dialog", { name: "Main menu" }) : page.locator("header");
      if (state === "open") await page.getByRole("button", { name: "Open menu" }).click();
      const second = state === "open" ? "Close menu" : "Open menu";
      const boxes = [];
      for (const name of ["Open account", second]) {
        const target = scope.getByRole("button", { name }).or(scope.getByRole("link", { name })).first();
        await expect(target, `${state} at ${width}px: ${name}`).toBeVisible();
        boxes.push(await target.evaluate((element) => {
          const box = element.getBoundingClientRect();
          return { width: box.width, height: box.height, centre: (box.top + box.bottom) / 2, radius: parseFloat(getComputedStyle(element).borderTopLeftRadius) };
        }));
      }
      const [account, menu] = boxes;
      const at = `${state} menu at ${width}px`;
      expect(Math.abs(account.width - account.height), `${at}: account button is square`).toBeLessThanOrEqual(0.5);
      expect(Math.abs(menu.width - menu.height), `${at}: menu button is square`).toBeLessThanOrEqual(0.5);
      expect(Math.abs(account.width - menu.width), `${at}: both buttons have the same width`).toBeLessThanOrEqual(0.5);
      expect(Math.abs(account.height - menu.height), `${at}: both buttons have the same height`).toBeLessThanOrEqual(0.5);
      expect(account.width, `${at}: at least 44px`).toBeGreaterThanOrEqual(44);
      expect(Math.abs(account.centre - menu.centre), `${at}: aligned`).toBeLessThanOrEqual(1);
      expect(account.radius, `${at}: fully round`).toBeGreaterThanOrEqual(account.width / 2 - 0.5);
      expect(menu.radius, `${at}: fully round`).toBeGreaterThanOrEqual(menu.width / 2 - 0.5);
      if (state === "open") await page.keyboard.press("Escape");
    }
  }
});
