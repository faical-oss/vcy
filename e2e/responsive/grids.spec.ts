import { DYNAMIC_ROUTES, REGION_SAMPLE } from "../dynamic-routes";
import { ROUTES } from "../../src/constants/routes";
import { DATES, SEARCH } from "./routes";
import { expect, openRoute, test } from "./helpers";

/*
 * The card grids (src/constants/grids.ts). For every page that lays out cards, at the eight widths of the card-grid rule, it counts
 * the columns of the first row, the narrowest card, the shape of the photos, and (tiles) the share of the caption. It resizes one
 * page through the widths, so it runs once (in the 1280 project) whatever the matrix is.
 *
 *   tiles    1 below 560, 2 to 767, 3 to 1023, 4 from 1024     listing  1 below 640, 2 to 1279, 3 from 1280
 */
const WIDTHS = [375, 430, 600, 768, 820, 1024, 1280, 1440];
const MIN_CARD = 215; // "about 220px"; a pixel of rounding on top of the gaps

type Kind = "tiles" | "listing" | "carousel";
interface GridCase {
  name: string;
  path: string;
  kind: Kind;
  /** Which `[data-grid]` of the page (0 = first). */
  nth?: number;
  /** The grid only exists from this width (search grid view; narrower it falls back to the list cards). */
  from?: number;
  /** The filter sidebar of the results page is visible from 1024, the drawer below. */
  sidebar?: boolean;
  /** A signed-in page; `favorites` seeds the saved hotels it shows (the mock account has no trips, so My trips has no grid to measure). */
  account?: boolean;
  favorites?: string[];
}

const SAVED_HOTELS = ["azure-spa-and-wellness-resort", "six-senses-zighy-bay", "como-uma-ubud", "chiva-som-hua-hin", "sha-wellness-clinic-alicante", "clinique-la-prairie-montreux"];

const route = (pattern: keyof typeof DYNAMIC_ROUTES) => DYNAMIC_ROUTES[pattern].path(DYNAMIC_ROUTES[pattern].sample);
const CASES: GridCase[] = [
  { name: "home popular destinations", path: "/", kind: "tiles" },
  { name: "all destinations", path: "/destinations", kind: "tiles" },
  { name: "lifestyle destinations", path: route("/lifestyle/[slug]"), kind: "tiles" },
  { name: "region popular destinations (carousel)", path: `/destinations/${REGION_SAMPLE}`, kind: "carousel" },
  { name: "region packages", path: `/destinations/${REGION_SAMPLE}`, kind: "listing", nth: 0 },
  { name: "region hotels", path: `/destinations/${REGION_SAMPLE}`, kind: "listing", nth: 1 },
  { name: "country experiences", path: route("/destinations/[slug]"), kind: "listing" },
  { name: "hotel category", path: route("/hotels/[category]"), kind: "listing" },
  { name: "experience category", path: route("/experiences/[category]"), kind: "listing" },
  { name: "hotel group", path: route("/hotels/groups/[group]"), kind: "listing" },
  { name: "experience group", path: route("/experiences/groups/[group]"), kind: "listing" },
  { name: "you might also like (hotel)", path: `${route("/hotels/h/[slug]")}?${DATES}`, kind: "listing" },
  { name: "you might also like (package)", path: route("/packages/p/[slug]"), kind: "listing" },
  { name: "you might also like (experience)", path: route("/experiences/e/[slug]"), kind: "listing" },
  { name: "account favorites", path: ROUTES.favorites, kind: "listing", account: true, favorites: SAVED_HOTELS },
  { name: "search results, hotels (grid view)", path: `${SEARCH("hotel")}&view=grid`, kind: "listing", from: 768, sidebar: true },
  { name: "search results, experiences (grid view)", path: `${SEARCH("experience")}&view=grid`, kind: "listing", from: 768, sidebar: true },
  { name: "search results, packages (grid view)", path: `${SEARCH("package")}&view=grid`, kind: "listing", from: 768, sidebar: true },
];

const columnsFor = (kind: Kind, width: number): number => {
  if (kind === "listing") return width < 640 ? 1 : width < 1280 ? 2 : 3;
  const tiles = width < 560 ? 1 : width < 768 ? 2 : width < 1024 ? 3 : 4;
  return kind === "carousel" && width < 560 ? 1.4 : tiles;
};

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "laptop-1280", "resizes one page through the eight widths itself: runs once");
});

for (const grid of CASES) {
  test(`${grid.name}: columns, card size and photo shape at every width`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    if (grid.favorites) {
      const saved = JSON.stringify(grid.favorites.map((id) => ({ kind: "hotel", id })));
      await page.addInitScript((value) => localStorage.setItem("vku:favorites:v1:pw-user", value), saved);
    }
    await openRoute(page, { name: grid.name, path: grid.path, account: grid.account });
    const selector = `[data-grid="${grid.kind}"]`;

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(250);
      const where = `${grid.name} at ${width}px`;
      const present = await page.locator(selector).count();
      if (grid.from && width < grid.from) {
        expect(present, `${where}: the grid view falls back to the list cards on phones`).toBe(0);
        continue;
      }
      expect(present, `${where}: ${selector} exists`).toBeGreaterThan(grid.nth ?? 0);

      const result = await page.evaluate(
        ({ selector, nth }) => {
          const root = document.querySelectorAll(selector)[nth] as HTMLElement;
          root.scrollIntoView({ block: "start" });
          const items = [...root.children] as HTMLElement[];
          const rects = items.map((item) => item.getBoundingClientRect());
          const firstTop = rects[0].top;
          const firstRow = rects.filter((rect) => Math.abs(rect.top - firstTop) < 2);
          const rootRect = root.getBoundingClientRect();
          // The photo of a card: the first image, or the tile itself for a tile.
          const photoRatio = (item: HTMLElement) => {
            const box = (item.querySelector(".group\\/carousel") ?? item.querySelector("img")?.parentElement ?? item.firstElementChild ?? item) as HTMLElement;
            const rect = box.getBoundingClientRect();
            return rect.width / Math.max(rect.height, 1);
          };
          const captions = items.map((item) => {
            const caption = item.matches("a, div") ? item.querySelector(":scope > div.absolute.bottom-3, :scope > a > div.absolute.bottom-3, :scope > * > div.absolute.bottom-3") : null;
            if (!caption) return null;
            const tile = (caption.parentElement as HTMLElement).getBoundingClientRect();
            const box = caption.getBoundingClientRect();
            // Clipped = a line of text that sticks out of the tile (the tile clips what overflows it), or out of the caption sideways.
            const clipped = [...caption.querySelectorAll("p")].some((p) => {
              const line = p.getBoundingClientRect();
              return line.left < tile.left || line.right > tile.right + 0.5 || line.bottom > tile.bottom + 0.5 || p.scrollWidth > p.clientWidth + 1;
            });
            return { share: box.height / tile.height, inside: box.top >= tile.top - 0.5 && box.bottom <= tile.bottom + 0.5, clipped };
          });
          return {
            count: items.length,
            columns: firstRow.length,
            visibleCarousel: (root.clientWidth + 20) / (rects[0].width + 20),
            minWidth: Math.min(...rects.map((rect) => rect.width)),
            ratios: items.map(photoRatio),
            captions,
            rootOverflow: root.scrollWidth - root.clientWidth,
            rootLeft: rootRect.left,
            pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
            sidebar: (() => {
              const aside = document.querySelector("#results-filters");
              return aside ? getComputedStyle(aside).display !== "none" : null;
            })(),
          };
        },
        { selector, nth: grid.nth ?? 0 },
      );

      const expected = columnsFor(grid.kind, width);
      if (grid.kind === "carousel") {
        expect(result.visibleCarousel, `${where}: tiles in view`).toBeCloseTo(expected, 1);
      } else {
        expect(result.columns, `${where}: columns of the first row`).toBe(Math.min(expected, result.count));
      }
      // A carousel track scrolls sideways by design; its own width is the thing to hold.
      expect(result.minWidth, `${where}: narrowest card`).toBeGreaterThanOrEqual(MIN_CARD);
      expect(result.pageOverflow, `${where}: the page scrolls sideways`).toBeLessThanOrEqual(1);
      if (grid.kind !== "carousel") expect(result.rootOverflow, `${where}: the grid overflows`).toBeLessThanOrEqual(1);

      // Same photo shape for every card of the grid (no card stretched to fill its row).
      const first = result.ratios[0];
      for (const ratio of result.ratios) expect(Math.abs(ratio - first), `${where}: photo ratios ${result.ratios.map((r) => r.toFixed(2)).join(", ")}`).toBeLessThan(0.04);

      if (grid.kind !== "listing") {
        // Tiles: 4:3 when alone in the row, square from 560px (always square in a carousel, where the next tile peeks in); the caption is at most 40% of the tile, inside it, with no clipped text.
        const target = grid.kind !== "carousel" && width < 560 ? 4 / 3 : 1;
        expect(first, `${where}: tile shape`).toBeCloseTo(target, 1);
        for (const caption of result.captions) {
          if (!caption) continue;
          expect(caption.share, `${where}: caption share of the tile`).toBeLessThanOrEqual(0.4);
          expect(caption.inside, `${where}: caption inside the tile`).toBe(true);
          expect(caption.clipped, `${where}: caption text clipped`).toBe(false);
        }
      }
      if (grid.sidebar) expect(result.sidebar, `${where}: filter sidebar (1024+, the drawer below)`).toBe(width >= 1024);
    }
  });
}

test("the search list view keeps its list cards on phones even when the URL asks for the grid", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openRoute(page, { name: "search grid on a phone", path: `${SEARCH("hotel")}&view=grid` });
  await expect(page.locator('[data-grid="listing"]')).toHaveCount(0);
  await expect(page.getByRole("group", { name: "View" })).toBeHidden();
  await expect(page.locator("main article").first()).toBeVisible();
});
