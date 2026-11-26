import type { Page } from "@playwright/test";
import { ROUTE_CASES, SEARCH } from "./routes";
import { expect, openRoute, test, viewportWidth } from "./helpers";

/*
 * Chip, pill, badge and tab rows (`ScrollRow`, src/components/ui/scroll-row.tsx) and the results toolbar.
 *  - Below 1024 every row is ONE line: no wrapping, scrolling sideways when it is too long, a fade at the edge that has more, the chosen
 *    item scrolled into view, and room above and below the chips for the 44px tap area.
 *  - From 1024 the rows that wrap keep wrapping; tab rows (`data-scroll-row="scroll"`) scroll at every width.
 *  - The results toolbar: Filters / Hide filters, the count, Sort and List/Grid share one vertical centre (1px), the controls one height.
 *  - The one exception: the account menu below 768 is a 2-column grid (Task 9), checked in round2.spec.ts.
 * Every route is checked, so a new chip row on any page is covered the day it is added.
 */
interface RowReport {
  name: string;
  mode: string;
  display: string;
  flexWrap: string;
  gridColumns: number;
  flexDirection: string;
  overflowX: string;
  scrollable: boolean;
  fadeRight: string;
  fadeLeft: string;
  /** What is hidden beyond each edge, from scrollLeft: the fades must match it (a row scrolled to its end has no right fade). */
  moreRight: boolean;
  moreLeft: boolean;
  centerSpread: number;
  lines: number;
  paddingTop: number;
  smallestHit: number | null;
  activeInView: boolean | null;
  pageOverflow: number;
}

async function rowReports(page: Page): Promise<RowReport[]> {
  // Give the row's observers a frame to set the fade.
  await page.waitForTimeout(150);
  return page.evaluate(() => {
    const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea';
    const ACTIVE = '[aria-pressed="true"],[aria-current]:not([aria-current="false"]),[aria-selected="true"],[data-active="true"]';
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    };
    return [...document.querySelectorAll<HTMLElement>("[data-scroll-row]")].filter(visible).map((row) => {
      const style = getComputedStyle(row);
      const kids = [...row.children].filter(visible) as HTMLElement[];
      const boxes = kids.map((kid) => kid.getBoundingClientRect());
      const centers = boxes.map((box) => (box.top + box.bottom) / 2);
      const hits = kids.map((kid) => ((kid.matches(FOCUSABLE) ? kid : kid.querySelector(FOCUSABLE)) ? kid.getBoundingClientRect().height : null)).filter((height): height is number => height !== null);
      const rowBox = row.getBoundingClientRect();
      const active = row.querySelector<HTMLElement>(ACTIVE);
      const activeBox = active?.getBoundingClientRect();
      const scrollable = row.scrollWidth - row.clientWidth > 1;
      return {
        name: row.getAttribute("aria-label") ?? row.getAttribute("role") ?? row.tagName.toLowerCase(),
        mode: row.getAttribute("data-scroll-row") ?? "",
        display: style.display,
        flexWrap: style.flexWrap,
        gridColumns: style.display === "grid" ? style.gridTemplateColumns.split(" ").length : 0,
        flexDirection: style.flexDirection,
        overflowX: style.overflowX,
        scrollable,
        fadeRight: row.style.getPropertyValue("--fade-r"),
        fadeLeft: row.style.getPropertyValue("--fade-l"),
        moreRight: scrollable && row.scrollLeft < row.scrollWidth - row.clientWidth - 1,
        moreLeft: scrollable && row.scrollLeft > 1,
        centerSpread: centers.length ? Math.max(...centers) - Math.min(...centers) : 0,
        // Rows of children: a child below the first one's bottom starts a new line.
        lines: boxes.filter((box, index) => index === 0 || box.top >= Math.min(...boxes.slice(0, index).map((other) => other.bottom)) - 1).length === boxes.length && boxes.length > 1 ? new Set(boxes.map((box) => Math.round(box.top / 4))).size : 1,
        paddingTop: parseFloat(style.paddingTop),
        smallestHit: hits.length ? Math.min(...hits) : null,
        activeInView: scrollable && activeBox ? activeBox.left >= rowBox.left - 1 && activeBox.right <= rowBox.right + 1 : null,
        pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
  });
}

function expectRows(reports: RowReport[], where: string) {
  const width = viewportWidth();
  for (const row of reports) {
    const at = `${where} · "${row.name}" at ${width}px`;
    expect(row.pageOverflow, `${at}: the page scrolls sideways`).toBeLessThanOrEqual(1);
    if (row.display === "grid") {
      // The account menu below 768 is a 2-column card (Task 9), not a row: it never scrolls and nothing is hidden.
      expect(width, `${at}: a grid only below 768`).toBeLessThan(768);
      expect(row.gridColumns, `${at}: two columns`).toBe(2);
      expect(row.scrollable, `${at}: a grid does not scroll sideways`).toBe(false);
    } else if (width < 1024 || row.mode === "scroll") {
      expect(row.flexWrap, `${at}: never wraps`).toBe("nowrap");
      expect(row.lines, `${at}: one line (children start at ${row.lines} different heights)`).toBe(1);
      expect(row.centerSpread, `${at}: items share one vertical centre`).toBeLessThanOrEqual(1);
      expect(["auto", "scroll"], `${at}: scrolls sideways`).toContain(row.overflowX);
      if (row.scrollable) {
        expect(row.fadeRight, `${at}: fade at the right edge only when there is more that way`).toBe(row.moreRight ? "28px" : "0px");
        expect(row.fadeLeft, `${at}: fade at the left edge only when there is more that way`).toBe(row.moreLeft ? "28px" : "0px");
      }
      if (row.smallestHit !== null) expect(row.paddingTop, `${at}: room for the 44px tap area`).toBeGreaterThanOrEqual((44 - row.smallestHit) / 2 - 0.5);
      if (row.activeInView !== null) expect(row.activeInView, `${at}: the chosen item is in view`).toBe(true);
    } else if (row.flexDirection === "column") {
      // The account menu is a vertical list from lg.
      expect(row.scrollable, `${at}: a vertical list does not scroll sideways`).toBe(false);
    } else {
      expect(row.flexWrap, `${at}: wraps from lg`).toBe("wrap");
      expect(row.overflowX, `${at}: nothing hidden at lg`).toBe("visible");
    }
  }
}

/** Pages that must have these rows (so the test cannot pass because the rows went missing). */
const MIN_ROWS: Record<string, number> = { home: 2, "/destinations": 1, "/lifestyle/[slug]": 2, "/hotels/h/[slug]": 2, "/experiences/e/[slug]": 2, "/packages/p/[slug]": 2, account: 1 };

for (const route of ROUTE_CASES.filter((entry) => !entry.notFound)) {
  test(`chip rows · ${route.name}`, async ({ page }) => {
    await openRoute(page, route);
    const rows = await rowReports(page);
    expect(rows.length, `${route.name}: rows found`).toBeGreaterThanOrEqual(MIN_ROWS[route.name] ?? 0);
    expectRows(rows, route.name);
  });
}

test("chip rows with something applied: filter chips, and the drawer open", async ({ page }) => {
  await openRoute(page, { name: "filtered search", path: `${SEARCH("hotel")}&stars=5&amenities=pool&board=breakfast&minPrice=100` });
  const rows = await rowReports(page);
  expect(rows.some((row) => row.name === "Active filters"), "the applied filters are a row").toBe(true);
  expectRows(rows, "filtered search");
  if (viewportWidth() < 1024) {
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
    expectRows(await rowReports(page), "filtered search, drawer open");
  }
});

test("chip rows in the open search panels", async ({ page }) => {
  await openRoute(page, { name: "home", path: "/" });
  for (const field of [/^When/, /^Who/]) {
    await page.getByRole("button", { name: field }).first().click();
    await page.waitForTimeout(250);
    expectRows(await rowReports(page), `home, ${String(field)} open`);
    await page.keyboard.press("Escape");
  }
});

test("the chosen chip is scrolled into view when it is picked", async ({ page }) => {
  test.skip(viewportWidth() >= 1024, "below lg the row scrolls");
  await openRoute(page, { name: "home", path: "/" });
  const row = page.getByRole("group", { name: "Experience types" });
  const last = row.getByRole("button").last();
  await row.evaluate((element) => { element.scrollLeft = 0; });
  await last.scrollIntoViewIfNeeded();
  await last.click();
  await expect(last).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(600);
  const inView = await last.evaluate((element) => {
    const parent = element.closest("[data-scroll-row]")!.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    return box.left >= parent.left - 1 && box.right <= parent.right + 1;
  });
  expect(inView, "the picked chip is fully inside the row").toBe(true);
});

test("the results toolbar is one aligned row", async ({ page }) => {
  await openRoute(page, { name: "search hotel", path: SEARCH("hotel") });
  const width = viewportWidth();
  const report = await page.evaluate(() => {
    const toolbar = document.querySelector<HTMLElement>("[data-results-toolbar]")!;
    const visible = (element: Element) => { const rect = element.getBoundingClientRect(); return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== "hidden"; };
    // The leaves of the toolbar: the filters button, the count, the sort select and the two view buttons.
    const leaves = [...toolbar.querySelectorAll<HTMLElement>("button, select, p[aria-live]")].filter(visible);
    const items = leaves.map((element) => {
      const box = element.getBoundingClientRect();
      return { name: (element.getAttribute("aria-label") ?? element.textContent ?? "").trim().slice(0, 24), centre: (box.top + box.bottom) / 2, height: box.height, control: element.tagName !== "P" };
    });
    const header = document.querySelector<HTMLElement>("[data-filters-header]");
    const headerBox = header && visible(header) ? header.getBoundingClientRect() : null;
    return { items, header: headerBox ? (headerBox.top + headerBox.bottom) / 2 : null, rows: new Set(items.map((item) => Math.round(item.centre / 8))).size };
  });
  // Items on the same line share a centre; from 768 everything is on one line (phones put the count on a line of its own).
  const lines = new Map<number, number[]>();
  for (const item of report.items) {
    const key = [...lines.keys()].find((centre) => Math.abs(centre - item.centre) < 10) ?? item.centre;
    lines.set(key, [...(lines.get(key) ?? []), item.centre]);
  }
  for (const [, centres] of lines) expect(Math.max(...centres) - Math.min(...centres), `items on one line share a centre at ${width}px`).toBeLessThanOrEqual(1);
  if (width >= 768) expect(lines.size, `the toolbar is one row at ${width}px`).toBe(1);
  const first = report.items[0].centre;
  const heights = report.items.filter((item) => item.control).map((item) => item.height);
  expect(Math.max(...heights) - Math.min(...heights), `controls share one height at ${width}px (${heights.join(", ")})`).toBeLessThanOrEqual(1);
  // From 1024 the sidebar's "Filters / Clear all" header sits on the same line as "Hide filters" and the count.
  if (report.header !== null) expect(Math.abs(report.header - first), "sidebar header and toolbar share a centre").toBeLessThanOrEqual(1);
  else expect(width < 1024, "the sidebar header exists from 1024").toBe(true);
});
