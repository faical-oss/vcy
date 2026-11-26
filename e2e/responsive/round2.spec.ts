import type { Locator, Page } from "@playwright/test";
import { DATES, SEARCH } from "./routes";
import { expect, openRoute, test } from "./helpers";

/*
 * Task 9 (the second round of screenshots). It sets the widths itself, so each test runs once (in the 1280 project).
 *   A. Detail pages below 768 read: the breadcrumb, Back, then Favorite and Share side by side, the title block, the photos (a 16:10 hero and a
 *      row of three 4:3 thumbnails; Task 10 replaced the 1, 1, 2 mosaic), the tabs. The action row is never clipped. DOM, visual and focus order are the same. From 768 the desktop grid is unchanged.
 *   B. Reserve bar (hotel): the rooms chosen are one per line (two at most, then "+N more"); the bar is as tall as its content and
 *      `--booking-bar-h` follows it, so the footer is never covered.
 *   D. The search pill is on every page with a search entry, at every width below 1280, as wide as the container, never clipped, sticky.
 *   E. The room dialog's footer: the price at the start, the button at the far end; stacked and full width at 320.
 *   F. The search sheet is as tall as its content (a flat panel under the navbar, the same on phones and tablets), 90dvh at most.
 *   G. Search tabs: icon above the label below 400px, beside it from 400px; equal widths, 44px or more.
 *   H. The account menu below 768 is a 2-column card; from 768 the row and the sidebar are unchanged.
 * (The review box, item 3, is in detail-sticky.spec.ts.)
 */
const WIDTHS = [320, 360, 390, 400, 768, 1024, 1280];
const PAGES = [
  { kind: "hotel", path: "/hotels/h/azure-spa-and-wellness-resort-krabi" },
  { kind: "experience", path: "/experiences/e/ubud-yoga-and-detox-retreat" },
  { kind: "package", path: "/packages/p/bali-soul-surf" },
] as const;
const HEADER = 64;

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "laptop-1280", "sets the widths itself: runs once");
});

const rect = (locator: Locator) =>
  locator.first().evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, width: box.width, height: box.height };
  });
const resize = async (page: Page, width: number, height = 900) => {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(250);
};

for (const entry of PAGES) {
  test(`${entry.kind}: header order (breadcrumb, actions, title block, photos, tabs) with DOM, visual and focus order the same below 768, the action row unclipped, and the hero and three thumbnails`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await openRoute(page, { name: entry.kind, path: `${entry.path}?${DATES}` });
    const header = page.locator('[data-detail="header"]');
    const back = header.locator("a:has(svg.lucide-arrow-left)");
    const favorite = header.getByRole("button", { name: "Favorite" });
    const share = header.getByRole("button", { name: "Share" });
    const crumbs = header.locator("nav ol");
    const title = header.locator("h1");
    const gallery = page.locator('[data-detail="gallery"]');
    const tabs = page.locator('[data-detail="tabs"]');
    expect(await page.locator("h1").count(), "one h1").toBe(1);

    for (const width of WIDTHS) {
      await resize(page, width);
      const at = `${entry.kind} at ${width}px`;
      const r = { back: await rect(back), favorite: await rect(favorite), share: await rect(share), crumbs: await rect(crumbs), title: await rect(title), gallery: await rect(gallery), tabs: await rect(tabs) };
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${at}: sideways scroll`).toBeLessThanOrEqual(0);
      if (width < 768) {
        expect(r.crumbs.bottom, `${at}: the breadcrumb first`).toBeLessThanOrEqual(r.back.top + 1);
        expect(r.back.bottom, `${at}: then Back`).toBeLessThanOrEqual(r.favorite.top + 1);
        expect(Math.abs(r.favorite.top - r.share.top), `${at}: Favorite and Share side by side`).toBeLessThanOrEqual(1);
        expect(r.favorite.right, `${at}: Favorite left of Share`).toBeLessThanOrEqual(r.share.left + 1);
        expect(r.favorite.bottom, `${at}: then the title block`).toBeLessThanOrEqual(r.title.top + 1);
        expect(r.title.bottom, `${at}: then the photos`).toBeLessThanOrEqual(r.gallery.top + 1);
        expect(r.gallery.bottom, `${at}: then the tabs`).toBeLessThanOrEqual(r.tabs.top + 1);
        // Nothing of the action row is clipped at the right edge, and it is as wide as the column.
        for (const [name, box] of Object.entries({ back: r.back, favorite: r.favorite, share: r.share })) {
          expect(box.right, `${at}: ${name} ends inside the screen`).toBeLessThanOrEqual(width - 16 + 0.5);
          expect(box.left, `${at}: ${name} starts at or after the gutter`).toBeGreaterThanOrEqual(16 - 0.5);
        }
        expect(Math.abs(r.back.width - (r.share.right - r.favorite.left)), `${at}: Back is as wide as Favorite plus Share`).toBeLessThanOrEqual(1);
        // Focus order = DOM order = visual order: the breadcrumb, Back, Favorite, Share.
        await crumbs.locator("a").last().focus();
        await page.keyboard.press("Tab");
        await expect(back, `${at}: Tab goes from the breadcrumb to Back`).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(favorite, `${at}: then Favorite`).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(share, `${at}: then Share`).toBeFocused();

        // The photos: a 16:10 hero on the full width, then one row of three 4:3 thumbnails with the same gap.
        const grid = gallery.locator(":scope > div").first();
        const m = await grid.evaluate((element) => {
          const boxes = [...element.querySelectorAll("img")].filter((image) => image.getBoundingClientRect().height > 0).map((image) => image.parentElement!.getBoundingClientRect());
          const box = element.getBoundingClientRect();
          return { height: box.height, width: box.width, left: box.left, boxes: boxes.map((b) => ({ w: b.width, h: b.height, top: b.top, left: b.left, right: b.right, bottom: b.bottom })) };
        });
        expect(m.boxes, `${at}: four photos (a hero and three thumbnails)`).toHaveLength(4);
        const [hero, ...thumbs] = m.boxes;
        expect(Math.abs(hero.w - m.width), `${at}: the hero is the full width`).toBeLessThanOrEqual(1);
        expect(Math.abs(hero.w / hero.h - 1.6), `${at}: the hero is 16:10`).toBeLessThan(0.02);
        for (const thumb of thumbs) {
          expect(Math.abs(thumb.w / thumb.h - 4 / 3), `${at}: a thumbnail is 4:3`).toBeLessThan(0.02);
          expect(Math.abs(thumb.top - thumbs[0].top), `${at}: one row`).toBeLessThanOrEqual(1);
          expect(Math.abs(thumb.w - thumbs[0].w), `${at}: equal widths`).toBeLessThanOrEqual(1);
        }
        expect(Math.abs(thumbs[0].top - hero.bottom - 8), `${at}: the gap under the hero is the thumbnails' gap (8px)`).toBeLessThanOrEqual(1);
        expect(Math.abs(thumbs[1].left - thumbs[0].right - 8), `${at}: gap 8px`).toBeLessThanOrEqual(1);
        expect(Math.abs(thumbs[2].left - thumbs[1].right - 8), `${at}: gap 8px`).toBeLessThanOrEqual(1);
        expect(Math.abs(thumbs[2].right - hero.right), `${at}: the row fills the width`).toBeLessThanOrEqual(1);
        const viewAll = gallery.getByRole("button", { name: /View all \d+ photos/ });
        await expect(viewAll, `${at}: "View all N photos" is on the last thumbnail`).toBeVisible();
        const overlay = await rect(viewAll);
        expect(Math.abs(overlay.left - thumbs[2].left) + Math.abs(overlay.width - thumbs[2].w), `${at}: the overlay covers the last thumbnail`).toBeLessThanOrEqual(2);
        // White text on the scrim reads at 4.5:1 even over a white photo.
        const scrim = await viewAll.evaluate((element) => getComputedStyle(element).backgroundColor);
        const channels = scrim.match(/[\d.]+/g)!.map(Number);
        const alpha = channels[3] ?? 1;
        const behind = channels.slice(0, 3).map((value) => value * alpha + 255 * (1 - alpha));
        const luminance = (value: number) => ((value /= 255) <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
        const lum = 0.2126 * luminance(behind[0]) + 0.7152 * luminance(behind[1]) + 0.0722 * luminance(behind[2]);
        expect(1.05 / (lum + 0.05), `${at}: white on the scrim over a white photo`).toBeGreaterThanOrEqual(4.5);
      } else {
        expect(r.title.top, `${at}: the title is above the photos`).toBeLessThan(r.gallery.top);
        expect(r.gallery.bottom, `${at}: then the tabs`).toBeLessThanOrEqual(r.tabs.top + 1);
        expect(r.favorite.left, `${at}: the actions are beside the title from 768`).toBeGreaterThan(r.title.left + 100);
        const grid = await rect(gallery.locator(":scope > div").first());
        expect(Math.abs(grid.height - 355), `${at}: the desktop grid keeps its 355px`).toBeLessThanOrEqual(1);
      }
    }

    // "View all N photos" opens the viewer, which closes with Escape.
    await resize(page, 390);
    await gallery.getByRole("button", { name: /View all \d+ photos/ }).click();
    await expect(page.getByRole("dialog", { name: /Photos of/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: /Photos of/ })).toHaveCount(0);
  });
}

test("hotel reserve bar: the rooms are one per line (two, then +N more), the bar is as tall as its content, and --booking-bar-h and the footer follow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openRoute(page, { name: "hotel", path: `${PAGES[0].path}?checkIn=2099-10-14&checkOut=2099-10-21&adults=3&rooms=3` });
  await page.getByRole("tab", { name: "Rooms" }).click();
  // "Select room" on a room turns it into a stepper, so the first "Select room" left is always a room not chosen yet.
  const select = page.getByRole("button", { name: /^Select room/ });
  const bar = page.locator("[data-booking-bar]");
  const none = (await rect(bar)).height; // nothing chosen yet: the count line only
  await select.first().click();
  await expect(bar.locator("[data-booking-rooms]")).toBeVisible();
  await select.first().click();
  await select.first().click();
  for (const width of [360, 390, 400, 768]) {
    await resize(page, width, 844);
    const at = `reserve bar at ${width}px`;
    const rooms = bar.locator("[data-booking-rooms]");
    await expect(rooms, `${at}: the rooms list`).toBeVisible();
    const lines = await rooms.evaluate((element) => {
      const kids = [...element.children].map((kid) => { const b = kid.getBoundingClientRect(); return { top: b.top, left: b.left, text: kid.textContent!.trim() }; });
      return { kids, direction: getComputedStyle(element).flexDirection };
    });
    expect(lines.direction, `${at}: a column`).toBe("column");
    expect(lines.kids.length, `${at}: two rooms and "+1 more"`).toBe(3);
    expect(lines.kids[2].text, `${at}: the rest is counted`).toBe("+1 more");
    for (let i = 1; i < lines.kids.length; i++) {
      expect(lines.kids[i].top, `${at}: one room per line`).toBeGreaterThan(lines.kids[i - 1].top + 5);
      expect(lines.kids[i].left, `${at}: aligned`).toBeCloseTo(lines.kids[0].left, 0);
    }
    const sizes = await page.evaluate(() => {
      const bar = document.querySelector("[data-booking-bar]")!.getBoundingClientRect();
      const probe = document.createElement("div");
      probe.style.cssText = "position:absolute;visibility:hidden;height:var(--booking-bar-h)";
      document.body.append(probe);
      const variable = probe.getBoundingClientRect().height;
      probe.remove();
      window.scrollTo(0, document.documentElement.scrollHeight);
      const footerEnd = Math.max(...[...document.querySelector("footer")!.querySelectorAll<HTMLElement>("*")].filter((node) => node.getBoundingClientRect().height > 0).map((node) => node.getBoundingClientRect().bottom));
      return { bar: bar.height, top: bar.top, variable, footerEnd, summary: document.querySelector("[data-booking-summary]")!.scrollHeight - document.querySelector("[data-booking-summary]")!.clientHeight };
    });
    expect(Math.abs(sizes.bar - sizes.variable), `${at}: --booking-bar-h is the bar's height`).toBeLessThanOrEqual(1);
    expect(sizes.bar, `${at}: at least as tall as with no room chosen (the 5rem floor holds the rooms: the price is on the right)`).toBeGreaterThanOrEqual(none);
    expect(sizes.footerEnd, `${at}: the footer's last line is above the bar`).toBeLessThanOrEqual(sizes.top + 1);
    expect(sizes.summary, `${at}: nothing cut in the summary`).toBeLessThanOrEqual(1);
  }
  // The summary is still one button with its accessible name.
  const summary = bar.locator("[data-booking-summary]");
  expect(await summary.evaluate((element) => element.tagName), "one button").toBe("BUTTON");
  expect(await summary.evaluate((element) => element.textContent!.trim().endsWith("Change dates and guests")), "the name ends with the action").toBe(true);
});

const SEARCH_PAGES = [
  { name: "hotel detail", path: `${PAGES[0].path}?${DATES}`, scroll: 0 },
  { name: "experience detail", path: `${PAGES[1].path}?${DATES}`, scroll: 0 },
  { name: "package detail", path: `${PAGES[2].path}?${DATES}`, scroll: 0 },
  { name: "search results", path: SEARCH("hotel"), scroll: 0 },
  { name: "listing (hotel category)", path: "/hotels/wellness-resorts", scroll: 600 },
  { name: "destinations", path: "/destinations", scroll: 600 },
  { name: "home", path: "/", scroll: 900 },
];

for (const entry of SEARCH_PAGES) {
  test(`${entry.name}: the search pill is there at every width below 1280, as wide as the container, never clipped, sticky, and opens the sheet`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await openRoute(page, { name: entry.name, path: entry.path });
    for (const width of [320, 360, 390, 400, 768, 1024, 1279]) {
      await resize(page, width);
      const at = `${entry.name} at ${width}px`;
      await page.evaluate((y) => window.scrollTo(0, y), entry.scroll);
      await page.waitForTimeout(450);
      const pill = page.getByRole("button", { name: /^Edit search/ });
      await expect(pill, `${at}: the pill is visible`).toBeVisible();
      const box = await rect(pill);
      const viewport = await page.evaluate(() => document.documentElement.clientWidth);
      expect(box.right, `${at}: not clipped on the right`).toBeLessThanOrEqual(viewport + 0.5);
      expect(box.left, `${at}: not clipped on the left`).toBeGreaterThanOrEqual(-0.5);
      expect(Math.abs(box.left - (viewport - box.right)), `${at}: the same side padding on both sides`).toBeLessThanOrEqual(1);
      expect(box.left, `${at}: the page's side padding`).toBeLessThanOrEqual(24.5);
      expect(box.width, `${at}: the full width of the container`).toBeGreaterThanOrEqual(Math.min(viewport - 48, 1200) - 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${at}: sideways scroll`).toBeLessThanOrEqual(0);
      // Sticky: still right under the navbar after more scrolling.
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(300);
      expect(Math.abs((await rect(pill)).top - (HEADER + 8)) <= 12 || Math.abs((await rect(pill)).top - HEADER) <= 12, `${at}: sticky under the navbar`).toBe(true);
    }
    // Tapping it opens the same sheet; Escape closes it and gives the focus back.
    await resize(page, 390);
    const pill = page.getByRole("button", { name: /^Edit search/ });
    await pill.click();
    await expect(page.getByRole("dialog", { name: "Search" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Search" })).toHaveCount(0);
    await expect(pill, `${entry.name}: focus returns to the pill`).toBeFocused();
  });
}

test("room details dialog: the price at the start, the button at the far end (full width and stacked at 320)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openRoute(page, { name: "hotel", path: `${PAGES[0].path}?${DATES}` });
  await page.getByRole("tab", { name: "Rooms" }).click();
  for (const width of [320, 360, 390, 400, 768, 1024]) {
    await resize(page, width);
    const at = `room dialog at ${width}px`;
    await page.getByRole("button", { name: /view room details/ }).first().click();
    const dialog = page.getByRole("dialog", { name: /Room details|Deluxe|Suite|View|Room/ }).first();
    await expect(dialog).toBeVisible();
    const m = await dialog.locator("[data-room-footer]").evaluate((footer) => {
      const style = getComputedStyle(footer);
      const box = footer.getBoundingClientRect();
      const [price, action] = [footer.children[0] as HTMLElement, footer.children[1] as HTMLElement | undefined];
      const p = price.getBoundingClientRect();
      const a = action?.firstElementChild?.getBoundingClientRect();
      const padL = parseFloat(style.paddingLeft);
      const padR = parseFloat(style.paddingRight);
      return { direction: style.flexDirection, left: p.left - box.left - padL, right: a ? box.right - padR - a.right : null, actionWidth: a?.width ?? 0, content: box.width - padL - padR, aLeft: a ? a.left - box.left - padL : 0 };
    });
    expect(Math.abs(m.left), `${at}: the price starts at the content's left edge`).toBeLessThanOrEqual(1);
    expect(m.right, `${at}: the button is there`).not.toBeNull();
    expect(Math.abs(m.right!), `${at}: the button ends at the content's right edge`).toBeLessThanOrEqual(1);
    if (width < 400) {
      expect(m.direction, `${at}: stacked`).toBe("column");
      expect(Math.abs(m.actionWidth - m.content), `${at}: the button is full width`).toBeLessThanOrEqual(1);
    } else expect(m.direction, `${at}: one row`).toBe("row");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  }
});

test("the search sheet is as tall as its content: a flat panel under the navbar at every width (the same on tablets), 90dvh at most, the Search button under the last field", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openRoute(page, { name: "hotel", path: `${PAGES[0].path}?${DATES}` });
  for (const width of [320, 360, 390, 400, 768, 1024]) {
    const height = width < 768 ? 844 : 900;
    await resize(page, width, height);
    const at = `sheet at ${width}px`;
    await page.getByRole("button", { name: /^Edit search/ }).click();
    const dialog = page.getByRole("dialog", { name: "Search" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Close search" }), `${at}: a close button`).toBeVisible();
    await page.waitForTimeout(400); // the open animation (240ms) has ended
    const read = () => dialog.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const body = element.querySelector("[data-sheet-body]")!;
      const fields = element.querySelector('[role="tabpanel"]')!.getBoundingClientRect();
      const search = [...element.querySelectorAll("button")].find((button) => button.getAttribute("type") === "submit")!.getBoundingClientRect();
      return { radius: getComputedStyle(element).borderBottomLeftRadius, top: box.top, bottom: box.bottom, left: box.left, right: box.right, height: box.height, inner: window.innerHeight, innerWidth: window.innerWidth, gap: search.top - fields.bottom, searchBottom: search.bottom, scrolls: body.scrollHeight > body.clientHeight + 1 };
    });
    const closed = await read();
    expect(closed.height, `${at}: at most 90dvh`).toBeLessThanOrEqual(closed.inner * 0.9 + 1);
    expect(closed.height, `${at}: not a full-height sheet (content only)`).toBeLessThan(closed.inner * 0.8);
    expect(closed.gap, `${at}: Search is right under the last field`).toBeLessThanOrEqual(40);
    expect(closed.searchBottom, `${at}: Search is on screen`).toBeLessThanOrEqual(closed.inner);
    // The same flat panel on phones and tablets (no centred modal): under the navbar, full width, square corners.
    expect(closed.top, `${at}: directly under the navbar (64px)`).toBeCloseTo(64, 0);
    expect(closed.radius, `${at}: a flat panel, square corners`).toBe("0px");
    expect(closed.left + (closed.innerWidth - closed.right), `${at}: full width`).toBeLessThanOrEqual(1);
    // A field's panel opens in the card: it grows up to the maximum and scrolls inside.
    await dialog.getByRole("button", { name: /^When/ }).click();
    await page.waitForTimeout(300);
    const open = await read();
    expect(open.height, `${at}: grows with the panel`).toBeGreaterThan(closed.height);
    expect(open.height, `${at}: still 90dvh at most`).toBeLessThanOrEqual(open.inner * 0.9 + 1);
    expect(open.searchBottom, `${at}: Search stays on screen`).toBeLessThanOrEqual(open.inner);
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  }
});

test("search tabs: the icon above the label below 400px, beside it from 400px; equal widths, 44px or more (home hero and the sheet)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openRoute(page, { name: "home", path: "/" });
  for (const width of [320, 360, 399, 400, 401, 640, 768]) {
    await resize(page, width, 844);
    await page.evaluate(() => window.scrollTo(0, 0));
    const check = async (list: Locator, where: string) => {
      const tabs = await list.getByRole("tab").evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          const icon = element.querySelector("svg")!.getBoundingClientRect();
          const text = [...element.childNodes].find((node) => node.nodeType === 3 && node.textContent!.trim())!;
          const range = document.createRange();
          range.selectNodeContents(text);
          const label = range.getBoundingClientRect();
          return { width: box.width, height: box.height, direction: getComputedStyle(element).flexDirection, iconBottom: icon.bottom, iconRight: icon.right, labelTop: label.top, labelLeft: label.left };
        }),
      );
      expect(tabs, `${where} at ${width}px: three tabs`).toHaveLength(3);
      for (const tab of tabs) {
        expect(tab.height, `${where} at ${width}px: 44px or more`).toBeGreaterThanOrEqual(44);
        expect(Math.abs(tab.width - tabs[0].width), `${where} at ${width}px: equal widths`).toBeLessThanOrEqual(1);
        if (width < 400) {
          expect(tab.direction, `${where} at ${width}px: a column`).toBe("column");
          expect(tab.iconBottom, `${where} at ${width}px: the icon above the label`).toBeLessThanOrEqual(tab.labelTop + 1);
        } else {
          expect(tab.direction, `${where} at ${width}px: a row`).toBe("row");
          expect(tab.iconRight, `${where} at ${width}px: the icon beside the label`).toBeLessThanOrEqual(tab.labelLeft + 1);
        }
      }
    };
    await check(page.locator('form[aria-label="Search Vacayou"] [role="tablist"]').first(), "home hero");
  }
  for (const width of [320, 399, 400, 640]) {
    await resize(page, width, 844);
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: /^Edit search/ }).click();
    const list = page.getByRole("dialog", { name: "Search" }).getByRole("tablist");
    const tabs = await list.getByRole("tab").evaluateAll((elements) => elements.map((element) => ({ direction: getComputedStyle(element).flexDirection, height: element.getBoundingClientRect().height, width: element.getBoundingClientRect().width })));
    for (const tab of tabs) {
      expect(tab.direction, `sheet at ${width}px: ${width < 400 ? "column" : "row"}`).toBe(width < 400 ? "column" : "row");
      expect(tab.height, `sheet at ${width}px: 44px or more`).toBeGreaterThanOrEqual(44);
      expect(Math.abs(tab.width - tabs[0].width), `sheet at ${width}px: equal widths`).toBeLessThanOrEqual(1);
    }
    await page.keyboard.press("Escape");
  }
});

test("account menu: a 2-column card below 768 (items 44px or more, divider, Sign out on its own row); the row from 768 and the sidebar from 1024 are unchanged", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openRoute(page, { name: "account", path: "/account", account: true });
  for (const width of [320, 360, 390, 400, 767, 768, 1024]) {
    await resize(page, width);
    const at = `account menu at ${width}px`;
    const m = await page.locator('nav[aria-label="Account"] ul').evaluate((list) => {
      const style = getComputedStyle(list);
      const items = [...list.children].map((li) => {
        const target = (li.querySelector("a,button") as HTMLElement);
        const box = li.getBoundingClientRect();
        const t = target.getBoundingClientRect();
        return { top: box.top, left: box.left, width: box.width, height: t.height, text: target.textContent!.trim(), transform: getComputedStyle(target).textTransform, bg: getComputedStyle(target).backgroundColor, radius: parseFloat(getComputedStyle(target).borderTopLeftRadius), border: getComputedStyle(li).borderTopWidth };
      });
      return { display: style.display, columns: style.gridTemplateColumns.split(" ").length, items, listWidth: list.getBoundingClientRect().width, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    expect(m.overflow, `${at}: sideways scroll`).toBeLessThanOrEqual(0);
    if (width < 768) {
      expect(m.display, `${at}: a grid`).toBe("grid");
      expect(m.columns, `${at}: two columns`).toBe(2);
      const [overview, trips, favorites, preferences, profile, signOut] = m.items;
      expect(Math.abs(overview.top - trips.top), `${at}: Overview and My trips share a row`).toBeLessThanOrEqual(1);
      expect(Math.abs(favorites.top - preferences.top), `${at}: Favorites and Preferences share a row`).toBeLessThanOrEqual(1);
      expect(profile.top, `${at}: Profile is alone on the next row`).toBeGreaterThan(favorites.top + 20);
      expect(Math.abs(profile.left - overview.left), `${at}: in the first column`).toBeLessThanOrEqual(1);
      expect(signOut.width, `${at}: Sign out spans the whole row`).toBeGreaterThanOrEqual(m.listWidth - 1);
      expect(signOut.top, `${at}: Sign out is below Profile`).toBeGreaterThan(profile.top + 20);
      expect(signOut.border, `${at}: a divider above Sign out`).not.toBe("0px");
      for (const item of m.items) {
        expect(item.height, `${at}: ${item.text} is 44px or more`).toBeGreaterThanOrEqual(44);
        expect(item.transform, `${at}: ${item.text} is uppercase`).toBe("uppercase");
      }
      expect(overview.bg, `${at}: the active item has the light blue background`).toBe("rgb(233, 241, 251)");
      expect(overview.radius, `${at}: with rounded corners`).toBeGreaterThan(0);
    } else expect(m.display, `${at}: a row (and the sidebar from 1024), not the grid`).toBe("flex");
  }
});

test("the search sheet animates open and closed (below 768 it slides from under the navbar), and does not under reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openRoute(page, { name: "hotel", path: "/hotels/h/azure-spa-and-wellness-resort-krabi" });
  // openRoute freezes every animation for stable screenshots: take that style away for this test.
  await page.evaluate(() => [...document.querySelectorAll("style")].filter((style) => style.textContent?.includes("animation:none!important")).forEach((style) => style.remove()));
  const dialog = page.getByRole("dialog", { name: "Search" });
  const opener = page.getByRole("button", { name: /^Edit search/ });
  await opener.click();
  await expect(dialog).toBeVisible();
  const name = await dialog.evaluate((element) => getComputedStyle(element).animationName);
  expect(name, "opens with an animation").toBe("sheet-in");
  await page.waitForTimeout(400);
  await dialog.getByRole("button", { name: "Close search" }).click();
  // Still in the page while it plays its exit, then gone.
  await expect(dialog).toHaveAttribute("data-state", "closed");
  expect(await dialog.evaluate((element) => getComputedStyle(element).animationName), "closes with an animation").toBe("sheet-out");
  await expect(dialog).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await opener.click();
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => getComputedStyle(element).animationName), "no animation under reduced motion").toBe("none");
});
