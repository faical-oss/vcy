import { ROUTES } from "../../src/constants/routes";
import { expect, openRoute, test } from "./helpers";

/*
 * The five account pages (overview, trips, favorites, preferences, profile) at 320, 360, 390, 768 and 1024. It sets the widths itself, so it
 * runs once (in the 1280 project).
 *   - The page column (the shell's content area) is never wider than the viewport, and the page never scrolls sideways. The shell's single
 *     column below lg is minmax(0,1fr): without it, wide content stretched the column past the screen and the card's clip hid the rest.
 *   - The account menu is a 2-column grid below 768 and a vertical list from 1024: no sideways scroll. At 768 to 1023 it is a tab row (a ScrollRow) that shows a 28px fade at an edge only when there is more that way: the right fade at the start
 *     of the row, the left fade once it is scrolled, and no fade at the far end. Scrolling the row to each end proves it.
 */
const WIDTHS = [320, 360, 390, 768, 1024];
const PAGES = [
  { name: "overview", path: ROUTES.account },
  { name: "trips", path: ROUTES.accountTrips },
  { name: "favorites", path: ROUTES.favorites },
  { name: "preferences", path: ROUTES.accountPreferences },
  { name: "profile", path: ROUTES.accountProfile },
];

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "laptop-1280", "sets the widths itself: runs once");
});

for (const entry of PAGES) {
  test(`account ${entry.name}: the column fits the viewport and the tab row's fades follow its scroll position`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await openRoute(page, { name: `account ${entry.name}`, path: entry.path, account: true });
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(250);
      const at = `account ${entry.name} at ${width}px`;
      const fit = await page.evaluate(() => {
        const column = document.querySelector('nav[aria-label="Account"]')!.closest("div.grid")!.lastElementChild as HTMLElement;
        const box = column.getBoundingClientRect();
        return { right: box.right, left: box.left, viewport: document.documentElement.clientWidth, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      });
      expect(fit.right, `${at}: the page column ends inside the viewport`).toBeLessThanOrEqual(fit.viewport + 0.5);
      expect(fit.left, `${at}: the page column starts inside the viewport`).toBeGreaterThanOrEqual(-0.5);
      expect(fit.overflow, `${at}: the page scrolls sideways`).toBeLessThanOrEqual(0);

      const row = page.locator('nav[aria-label="Account"] ul');
      const read = () => row.evaluate((element) => {
        const max = element.scrollWidth - element.clientWidth;
        return { max, left: element.scrollLeft, fadeL: element.style.getPropertyValue("--fade-l"), fadeR: element.style.getPropertyValue("--fade-r") };
      });
      const first = await read();
      if (width >= 1024 || width < 768) {
        expect(first.max, `${at}: the menu is a 2-column grid below 768 and a vertical list from lg, no sideways scroll`).toBeLessThanOrEqual(1);
        continue;
      }
      if (first.max <= 1) {
        expect(first.fadeR, `${at}: a row that fits has no fade`).toBe("0px");
        continue;
      }
      // Scroll to the start: more to the right only. To the end: more to the left only.
      await row.evaluate((element) => element.scrollTo({ left: 0 }));
      await expect.poll(async () => (await read()).fadeR, { message: `${at}: right fade at the start of the row` }).toBe("28px");
      expect((await read()).fadeL, `${at}: no left fade at the start`).toBe("0px");
      await row.evaluate((element) => element.scrollTo({ left: element.scrollWidth }));
      await expect.poll(async () => (await read()).fadeL, { message: `${at}: left fade at the end of the row` }).toBe("28px");
      expect((await read()).fadeR, `${at}: no right fade at the end`).toBe("0px");
    }
  });
}
