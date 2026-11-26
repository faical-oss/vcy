import { DATES } from "./routes";
import { expect, openRoute, test } from "./helpers";

/*
 * Task 7, items 3 and 4. It sets the widths itself, so it runs once (in the 1280 project).
 *  3. The search on the detail pages (hotel, experience, package): below 1280 the pill (Task 9: at every width, 320 included), from 1280 the row, sticky
 *     under the navbar from the first pixel; the sticky tabs sit under the navbar and the pill, tapping a tab never hides the section's title, an anchor
 *     never lands under them, and nothing shifts when the pill sticks. Below 768 the reserve bar is the only fixed element at the bottom.
 *  4. The review box (Task 9 reversed Task 7: it never traps the scroll). Below 768 there is no inner scroll box: the list grows with the page.
 *     From 768 the box scrolls inside and, at its end, the wheel and a touch swipe continue to the page (`overscroll-behavior: auto`); it is a named
 *     region and a keyboard stop only while it scrolls.
 */
const PAGES = [
  { kind: "hotel", path: "/hotels/h/azure-spa-and-wellness-resort-krabi" },
  { kind: "experience", path: "/experiences/e/ubud-yoga-and-detox-retreat" },
  { kind: "package", path: "/packages/p/bali-soul-surf" },
] as const;
const HEADER = 64; // --spacing-header (4rem)
const BAR = 64; // --docked-search-h (4rem)

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "laptop-1280", "sets the widths itself: runs once");
});

for (const entry of PAGES) {
  test(`${entry.kind}: the pill (below 1280) or the row (1280+) is sticky under the navbar, the tabs and anchors sit under both, nothing shifts`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await openRoute(page, { name: entry.kind, path: `${entry.path}?${DATES}` });
    for (const width of [320, 360, 390, 400, 768, 1024, 1279, 1280, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(250);
      const at = `${entry.kind} at ${width}px`;
      const pill = page.getByRole("button", { name: /^Edit search/ }).first();
      const row = page.locator('form[aria-label="Quick search"]');
      const bar = width >= 1280 ? row : pill;
      await expect(bar, `${at}: the ${width >= 1280 ? "row" : "pill"} is there from the first pixel`).toBeVisible();

      const before = await page.evaluate(() => (window as unknown as { __cls: number }).__cls ?? 0);
      await page.evaluate(() => window.scrollTo(0, 1500));
      await page.waitForTimeout(300);
      const after = await page.evaluate(() => (window as unknown as { __cls: number }).__cls ?? 0);
      expect(after - before, `${at}: nothing shifts when the bar sticks`).toBeLessThan(0.01);

      // Sticky: right under the navbar after a long scroll, and the tabs stuck under it (scrolled to the tabs' section).
      await page.evaluate(() => {
        const root = document.querySelector('[role="tablist"][aria-label$=" information"]')!.parentElement!.parentElement!;
        window.scrollTo(0, root.getBoundingClientRect().top + window.scrollY + 120);
      });
      await page.waitForTimeout(300);
      const box = (await bar.boundingBox())!;
      expect(box.y, `${at}: the bar is under the navbar`).toBeGreaterThanOrEqual(HEADER - 1);
      expect(box.y + box.height, `${at}: the bar is inside its 4rem`).toBeLessThanOrEqual(HEADER + BAR + 1);

      // The sticky tabs are under the navbar and the bar, and tapping a tab never hides the title of its section.
      const tabs = page.locator('[role="tablist"][aria-label$=" information"]');
      const stuck = await tabs.evaluate((element) => element.parentElement!.getBoundingClientRect());
      expect(stuck.top, `${at}: the tabs are under the navbar and the bar`).toBeGreaterThanOrEqual(HEADER + BAR - 1);
      expect(stuck.top, `${at}: the tabs stick right under the bar`).toBeLessThanOrEqual(HEADER + BAR + 1);
      const names = await tabs.getByRole("tab").allInnerTexts();
      for (const name of names.slice(1)) {
        await tabs.getByRole("tab", { name }).click();
        await page.waitForTimeout(350);
        const view = await page.evaluate(() => {
          const bar = document.querySelector<HTMLElement>('[role="tablist"][aria-label$=" information"]')!;
          const tabsBottom = bar.parentElement!.getBoundingClientRect().bottom;
          const panel = bar.parentElement!.parentElement!.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])')!;
          const first = [...panel.querySelectorAll<HTMLElement>("h2, h3, p, li")].find((node) => { const box = node.getBoundingClientRect(); return box.width > 1 && box.height > 1 && !node.closest(".sr-only"); }) ?? panel;
          const rect = first.getBoundingClientRect();
          return { tabsBottom, top: rect.top, panelTop: panel.getBoundingClientRect().top, innerHeight: window.innerHeight };
        });
        expect(view.top, `${at}: the start of "${name}" is under the tabs, not hidden by them`).toBeGreaterThanOrEqual(view.tabsBottom - 1);
        expect(view.top, `${at}: the start of "${name}" is on screen`).toBeLessThan(view.innerHeight);
      }

      // Every in-page anchor of the page lands under the navbar and the bar (its scroll margin accounts for them).
      const anchors = await page.evaluate(() => {
        const ids = [...document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].map((link) => link.getAttribute("href")!.slice(1)).filter((id) => id && document.getElementById(id));
        return [...new Set(ids)].map((id) => {
          const target = document.getElementById(id)!;
          return { id, margin: parseFloat(getComputedStyle(target).scrollMarginTop) || 0, hidden: target.getBoundingClientRect().height === 0 };
        });
      });
      for (const anchor of anchors.filter((entryAnchor) => !entryAnchor.hidden)) expect(anchor.margin, `${at}: #${anchor.id} has a scroll margin for the navbar and the bar`).toBeGreaterThanOrEqual(HEADER + BAR - 1);
    }
  });

  test(`${entry.kind}: below 768 the reserve bar is the only fixed element at the bottom (the pill is at the top), and there is no row`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await openRoute(page, { name: entry.kind, path: `${entry.path}?${DATES}` });
    for (const width of [320, 360, 390, 767]) {
      await page.setViewportSize({ width, height: 800 });
      await page.evaluate(() => window.scrollTo(0, 1200));
      await page.waitForTimeout(250);
      const at = `${entry.kind} at ${width}px`;
      await expect(page.locator("[data-booking-bar]"), `${at}: the reserve bar`).toBeVisible();
      await expect(page.locator('form[aria-label="Quick search"]'), `${at}: no docked row`).toBeHidden();
      await expect(page.getByRole("button", { name: /^Edit search/ }), `${at}: the pill is there, at the top`).toBeVisible();
      const fixedAtBottom = await page.evaluate(() =>
        [...document.body.querySelectorAll<HTMLElement>("*")]
          .filter((element) => getComputedStyle(element).position === "fixed" && !element.closest("nextjs-portal"))
          .filter((element) => { const box = element.getBoundingClientRect(); return box.width > 0 && box.height > 0 && box.bottom >= window.innerHeight - 2 && getComputedStyle(element).visibility !== "hidden"; })
          .map((element) => element.hasAttribute("data-booking-bar") ? "bar" : element.tagName.toLowerCase())
          .filter((name) => name !== "bar"),
      );
      expect(fixedAtBottom, `${at}: another fixed element at the bottom`).toEqual([]);
    }
  });
}

test("hotel: below 768 the reviews grow with the page; from 768 the box scrolls inside and passes its scroll to the page at its end (wheel, touch), and is a named keyboard stop", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await openRoute(page, { name: "hotel", path: `${PAGES[0].path}` });
  await page.getByRole("tab", { name: "Reviews" }).click();
  const region = page.locator('div[role="region"][aria-label="Guest reviews"]');
  await expect(region).toBeVisible();
  // Load reviews until the list is long (at 390 it grows with the page; at 768 it would scroll inside).
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: "Load more reviews" }).click();
    await page.waitForTimeout(600);
  }
  for (const width of [320, 390, 767]) {
    await page.setViewportSize({ width, height: 800 });
    await page.waitForTimeout(250);
    const at = `reviews at ${width}px`;
    const box = await region.evaluate((element) => ({ overflowY: getComputedStyle(element).overflowY, maxHeight: getComputedStyle(element).maxHeight, scrolls: element.scrollHeight > element.clientHeight + 1 }));
    expect(box.overflowY, `${at}: no inner scroll box`).toBe("visible");
    expect(box.maxHeight, `${at}: no height limit`).toBe("none");
    expect(box.scrolls, `${at}: the list does not scroll inside`).toBe(false);
    expect(await region.getAttribute("tabindex"), `${at}: not a keyboard stop (it does not scroll)`).toBeNull();
    // The page scrolls through the whole list: a wheel over it moves the page.
    await region.scrollIntoViewIfNeeded();
    const y = await page.evaluate(() => window.scrollY);
    const at0 = (await region.boundingBox())!;
    await page.mouse.move(at0.x + at0.width / 2, Math.min(at0.y + 200, 700));
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => window.scrollY), `${at}: a wheel over the reviews scrolls the page`).toBeGreaterThan(y);
  }
  for (const width of [768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.waitForTimeout(250);
    const at = `reviews at ${width}px`;
    expect(await region.evaluate((element) => element.scrollHeight > element.clientHeight + 10), `${at}: the box scrolls inside`).toBe(true);
    expect(await region.evaluate((element) => getComputedStyle(element).overscrollBehaviorY), `${at}: overscroll-behavior auto (never trapped)`).toBe("auto");
    expect(await region.getAttribute("tabindex"), `${at}: a keyboard stop while it scrolls`).toBe("0");
    expect((await region.getAttribute("aria-label"))?.length, `${at}: a name`).toBeGreaterThan(0);
    await region.scrollIntoViewIfNeeded();

    // Wheel: to the end of the box, then some more: the page moves on.
    await region.evaluate((element) => { element.scrollTop = 0; });
    const box = (await region.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 200));
    for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 800);
    await page.waitForTimeout(200);
    expect(await region.evaluate((element) => element.scrollTop + element.clientHeight >= element.scrollHeight - 2), `${at}: the wheel reached the end of the box`).toBe(true);
    // A pause ends the wheel gesture that was latched to the box; the next one chains to the page.
    await page.waitForTimeout(1000);
    // Put the box near the top so the page has room to move (a long list can leave the page at its very bottom).
    await region.evaluate((element) => window.scrollBy(0, element.getBoundingClientRect().top - 100));
    const room = (await region.boundingBox())!;
    await page.mouse.move(room.x + room.width / 2, room.y + Math.min(room.height / 2, 200));
    const pageY = await page.evaluate(() => window.scrollY);
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 800);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.scrollY), `${at}: the wheel at the end of the box scrolls the page`).toBeGreaterThan(pageY);

    // Touch: a swipe up at the end of the box scrolls the page (Chromium).
    const session = await page.context().newCDPSession(page);
    await region.scrollIntoViewIfNeeded();
    await region.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    const inView = (await region.boundingBox())!;
    const pageYTouch = await page.evaluate(() => window.scrollY);
    await session.send("Input.synthesizeScrollGesture", { x: inView.x + inView.width / 2, y: Math.max(inView.y, 0) + Math.min(inView.height / 2, 200), yDistance: -500, gestureSourceType: "touch", speed: 1200 });
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.scrollY), `${at}: a touch swipe at the end of the box scrolls the page`).toBeGreaterThan(pageYTouch);

    // Keyboard.
    await region.evaluate((element) => { element.scrollTop = 0; });
    await region.focus();
    await page.keyboard.press("PageDown");
    await page.waitForTimeout(200);
    expect(await region.evaluate((element) => element.scrollTop), `${at}: PageDown scrolls the box`).toBeGreaterThan(0);
  }
});
