import { DATES, SEARCH } from "./routes";
import { expect, openRoute, test } from "./helpers";

/*
 * Task 10. It sets the widths itself, so each test runs once (in the 1280 project). (The photo layout, the header order, the focus order and
 * the unclipped action row are in round2.spec.ts, test A.)
 *   - Hotel cards have no class stars before the badge: no star icon in any hotel card of the home page, a category listing, the search results
 *     and "You might also like" on a hotel page, at 320 to 1280; the class is still there for screen readers; no gap where the stars were (the title
 *     is the first thing under the photo, at the card's own padding); the cards do not overflow.
 *   - The photo grid on the detail pages (4 or more photos) at 320, 360, 390, 400, 768, 1024: no sideways scroll, and the grid is about 318px
 *     high at 390 (a 16:10 hero and a row of 4:3 thumbnails); from 768 the desktop grid keeps its 355px.
 */
const WIDTHS = [320, 360, 390, 400, 768, 1024];
const CARD_PAGES = [
  { name: "home", path: "/", from: 0 },
  { name: "hotel category", path: "/hotels/wellness-resorts", from: 0 },
  { name: "search results (grid)", path: `${SEARCH("hotel")}&view=grid`, from: 768 },
  { name: "hotel detail (related)", path: `/hotels/h/azure-spa-and-wellness-resort-krabi?${DATES}`, from: 0 },
];

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "laptop-1280", "sets the widths itself: runs once");
});

for (const entry of CARD_PAGES) {
  test(`${entry.name}: hotel cards have no class stars, the title sits right under the photo, nothing overflows`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await openRoute(page, { name: entry.name, path: entry.path });
    for (const width of [...WIDTHS, 1280].filter((value) => value >= entry.from)) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(250);
      const at = `${entry.name} at ${width}px`;
      const cards = await page.evaluate(() =>
        [...document.querySelectorAll("article")]
          .filter((card) => card.textContent?.includes("-star hotel"))
          .map((card) => {
            const title = card.querySelector("h3")!.getBoundingClientRect();
            const body = card.querySelector("h3")!.parentElement!.getBoundingClientRect();
            return { stars: [...card.querySelectorAll("svg.lucide-star")].filter((icon) => !!(icon.compareDocumentPosition(card.querySelector("h3")!) & Node.DOCUMENT_POSITION_FOLLOWING)).length, visibleClass: [...card.querySelectorAll('[role="img"]')].some((node) => /-star hotel/.test(node.getAttribute("aria-label") ?? "")), gap: title.top - body.top, srText: [...card.querySelectorAll(".sr-only")].some((node) => /-star hotel/.test(node.textContent ?? "")) };
          }),
      );
      expect(cards.length, `${at}: has hotel cards`).toBeGreaterThan(0);
      for (const card of cards) {
        expect(card.stars, `${at}: no star icon before the title (the guest rating below it stays)`).toBe(0);
        expect(card.visibleClass, `${at}: no star row`).toBe(false);
        expect(card.srText, `${at}: the class stays for screen readers`).toBe(true);
        expect(card.gap, `${at}: no empty gap above the title (the card's 16px padding only)`).toBeLessThanOrEqual(16.5);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${at}: sideways scroll`).toBeLessThanOrEqual(0);
    }
  });
}

test("the detail photo grid: no sideways scroll, about 318px at 390 below 768, the desktop 355px from 768", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openRoute(page, { name: "hotel", path: `/hotels/h/azure-spa-and-wellness-resort-krabi?${DATES}` });
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(250);
    const at = `photos at ${width}px`;
    const grid = await page.locator('[data-detail="gallery"] > div').first().evaluate((element) => ({ height: element.getBoundingClientRect().height, width: element.getBoundingClientRect().width, scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
    expect(grid.scroll, `${at}: sideways scroll`).toBeLessThanOrEqual(0);
    if (width < 768) {
      // hero 16:10 + 8px gap + a thumbnail at one third of the width less the gaps, 4:3.
      const thumb = (grid.width - 16) / 3;
      expect(Math.abs(grid.height - (grid.width / 1.6 + 8 + (thumb * 3) / 4)), `${at}: hero + gap + thumbnails (${grid.height})`).toBeLessThanOrEqual(1.5);
    } else {
      expect(Math.abs(grid.height - 355), `${at}: the desktop grid`).toBeLessThanOrEqual(1);
    }
  }
});
