import type { Locator, Page } from "@playwright/test";
import { DATES, SEARCH } from "./routes";
import { expect, settle, test, viewportWidth } from "./helpers";

/*
 * Interaction checks for phones and tablets (touch projects): taps, not clicks. They use the real controls by their accessible
 * names, so a renamed control fails here as well as in the unit tests. Desktop projects skip them (hasTouch is off).
 */
test.beforeEach(({ }, testInfo) => test.skip(testInfo.project.use.hasTouch !== true, "touch projects only"));

const HOTEL = `/hotels/h/azure-spa-and-wellness-resort-krabi?${DATES}`;
const EXPERIENCE = `/experiences/e/ubud-yoga-and-detox-retreat?${DATES}`;

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: "load" });
  await settle(page);
}

const inside = (page: Page, locator: Locator) =>
  locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.left >= -1 && rect.right <= document.documentElement.clientWidth + 1;
  });

async function swipe(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [from] });
  for (let step = 1; step <= 6; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: from.x + ((to.x - from.x) * step) / 6, y: from.y + ((to.y - from.y) * step) / 6 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

test.describe("header menu", () => {
  test.beforeEach(() => test.skip(viewportWidth() >= 1024, "the full navigation replaces the menu from lg"));

  test("opens, traps focus, locks the page, closes with Escape and with its button, and gives focus back", async ({ page }) => {
    await open(page, "/");
    const trigger = page.getByRole("button", { name: "Open menu" });
    await trigger.tap();
    const menu = page.getByRole("dialog", { name: "Main menu" });
    await expect(menu).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow), "background scroll is locked").toBe("hidden");
    for (let press = 0; press < 14; press++) {
      await page.keyboard.press("Tab");
      expect(await menu.evaluate((element) => element.contains(document.activeElement)), `focus stays in the menu (Tab ${press + 1})`).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.tap();
    await page.getByRole("button", { name: "Close menu" }).tap();
    await expect(menu).toBeHidden();
    // The menu is a full-screen dialog: there is no overlay to tap outside of.
  });

  test("the accordion opens one section at a time and nothing overflows", async ({ page }) => {
    await open(page, "/");
    await page.getByRole("button", { name: "Open menu" }).tap();
    const nav = page.getByRole("navigation", { name: "Main" });
    const experiences = nav.getByRole("button", { name: "Experiences" });
    const hotels = nav.getByRole("button", { name: "Hotels" });
    await experiences.tap();
    await expect(experiences).toHaveAttribute("aria-expanded", "true");
    await hotels.tap();
    await expect(hotels).toHaveAttribute("aria-expanded", "true");
    await expect(experiences, "one section at a time").toHaveAttribute("aria-expanded", "false");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
});

test.describe("search box (home)", () => {
  test("the travellers selector keeps rooms at or below adults and asks for child ages", async ({ page }) => {
    await open(page, "/");
    await page.getByRole("button", { name: /^Who/ }).tap();
    const dialog = page.getByRole("dialog", { name: "Rooms and guests" });
    await expect(dialog).toBeVisible();
    expect(await inside(page, dialog), "the selector fits the screen width").toBe(true);
    const counts = () => dialog.evaluate((element) => [...element.querySelectorAll("[aria-live=polite]")].map((node) => Number(node.textContent)));
    await dialog.getByRole("button", { name: "More rooms" }).tap();
    const [rooms, adults] = await counts();
    expect(rooms, "a second room brings a second adult").toBe(2);
    expect(rooms, "rooms never above adults").toBeLessThanOrEqual(adults);
    await dialog.getByRole("button", { name: "Fewer adults" }).tap();
    const [roomsAfter, adultsAfter] = await counts();
    expect(roomsAfter, "rooms never above adults after removing an adult").toBeLessThanOrEqual(adultsAfter);
    await dialog.getByRole("button", { name: "More children" }).tap();
    await expect(dialog.getByRole("alert")).toHaveText("Select the age of each child.");
    await dialog.getByLabel("Child 1").selectOption("5");
    await expect(dialog.getByRole("alert")).toHaveCount(0);
  });

  test("the date picker opens, fits the width and a range can be chosen by touch", async ({ page }) => {
    await open(page, "/");
    await page.getByRole("button", { name: /^When/ }).tap();
    const picker = page.getByRole("dialog", { name: "Choose your dates" });
    await expect(picker).toBeVisible();
    expect(await inside(page, picker), "the picker fits the screen width").toBe(true);
    await picker.getByRole("button", { name: "Later months" }).tap();
    await picker.getByRole("button", { name: /^\w+, \w+ 10, 202\d/ }).first().tap();
    await picker.getByRole("button", { name: /^\w+, \w+ 14, 202\d/ }).first().tap();
    await expect(picker.getByText(/Check out/).locator("xpath=following-sibling::p[1]")).not.toHaveText(/^$/);
  });
});

test.describe("search results", () => {
  test.beforeEach(() => test.skip(viewportWidth() >= 1024, "phone and tablet layouts"));

  test("the summary bar expands the search (phones) and the filter drawer works (phones and tablets)", async ({ page }) => {
    await open(page, SEARCH("hotel"));
    if (viewportWidth() < 768) {
      await expect(page.getByRole("button", { name: "Edit search" })).toBeVisible();
      await page.getByRole("button", { name: "Edit search" }).tap();
      await expect(page.getByRole("tablist", { name: "What to search" })).toBeVisible();
      await page.getByRole("button", { name: "Close search" }).tap();
      await expect(page.getByRole("tablist", { name: "What to search" })).toBeHidden();
    }

    await page.locator("article").first().waitFor();
    await page.getByRole("button", { name: "Filters" }).tap();
    const drawer = page.getByRole("dialog", { name: "Filters" });
    await expect(drawer).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow), "background scroll is locked").toBe("hidden");
    await drawer.locator("label:has(input[type=checkbox])").first().tap();
    await expect(drawer.getByRole("button", { name: /^Show \d+ results?$/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(page.getByRole("button", { name: "Filters" })).toBeFocused();
  });

  test("a chosen filter shows as a chip that can be removed, sorting and paging work", async ({ page }) => {
    await open(page, SEARCH("hotel"));
    await page.locator("article").first().waitFor();
    // Below 1024 the filters are in the drawer, from 1024 in the sidebar.
    if (viewportWidth() < 1024) {
      await page.getByRole("button", { name: "Filters" }).tap();
      await page.getByRole("dialog", { name: "Filters" }).locator("label:has(input[type=checkbox])").first().tap();
      await page.getByRole("dialog", { name: "Filters" }).getByRole("button", { name: /^Show/ }).tap();
    } else {
      await page.locator("label:has(input[type=checkbox])").first().tap();
    }
    await expect(page).toHaveURL(/[?&](types|stars|places|amenities|board)=/);
    const remove = page.getByRole("button", { name: /^Remove/ }).first();
    await expect(remove).toBeVisible();
    await remove.tap();
    await expect(page).not.toHaveURL(/[?&](types|stars|places|amenities|board)=/);

    await page.getByRole("combobox", { name: "Sort results" }).selectOption("price-asc");
    await expect(page).toHaveURL(/sort=price-asc/);
    const pager = page.getByRole("navigation", { name: /pagination|pages/i });
    if (await pager.count()) {
      await pager.getByRole("button", { name: /^(Page )?2$|Go to page 2/ }).first().tap();
      await expect(page).toHaveURL(/page=2/);
    }
  });

  test("the list and grid toggle exists from md up, the results never overflow", async ({ page }) => {
    await open(page, SEARCH("hotel"));
    const toggle = page.getByRole("group", { name: "View" });
    if (viewportWidth() >= 768) {
      await expect(toggle).toBeVisible();
      await toggle.getByRole("button", { name: "Grid" }).tap();
      await expect(page).toHaveURL(/view=grid/);
    } else {
      await expect(toggle).toBeHidden();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
});

for (const [name, path] of [["hotel", HOTEL], ["experience", EXPERIENCE]] as const) {
  test.describe(`${name} details`, () => {
    test("the tabs scroll sideways inside their bar and do not widen the page", async ({ page }) => {
      await open(page, path);
      const tabs = page.getByRole("tablist").first();
      await expect(tabs).toBeVisible();
      const last = tabs.getByRole("tab").last();
      await last.tap();
      await expect(last).toHaveAttribute("aria-selected", "true");
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    });

    test("the booking bar stays at the bottom (below lg) and the footer's last line is reachable", async ({ page }) => {
      test.skip(viewportWidth() >= 1024, "the booking bar is below lg");
      await open(page, path);
      const bar = page.locator("[data-booking-bar]");
      await expect(bar).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const box = await bar.boundingBox();
      expect(box && Math.abs(box.y + box.height - (page.viewportSize()?.height ?? 0)), "the bar sits on the bottom edge").toBeLessThanOrEqual(1);
      const lastLink = page.locator("footer a").last();
      const link = await lastLink.boundingBox();
      expect(link && box && link.y + link.height <= box.y + 1, "the last footer link is above the bar").toBe(true);
    });

    test("the photos open in a gallery and a viewer that trap focus, swipe, close with Escape and give focus back", async ({ page, browserName }) => {
      await open(page, path);
      const trigger = page.getByRole("button", { name: /^Open all photos/ }).first();
      await trigger.scrollIntoViewIfNeeded();
      await trigger.tap();
      const gallery = page.getByRole("dialog", { name: /^Photos of/ });
      await expect(gallery).toBeVisible();
      const first = gallery.getByRole("button", { name: /^Open photo 1 of/ }).first();
      await first.tap();
      const viewer = page.getByRole("dialog", { name: /All photos/ });
      await expect(viewer).toBeVisible();
      await expect(viewer.getByText(/^1 \/ \d+$/)).toBeVisible();
      if (browserName === "chromium") {
        const size = page.viewportSize()!;
        const y = size.height / 2;
        await swipe(page, { x: size.width * 0.8, y }, { x: size.width * 0.2, y });
        await expect(viewer.getByText(/^2 \/ \d+$/), "a swipe to the left shows the next photo").toBeVisible();
        await swipe(page, { x: size.width * 0.2, y }, { x: size.width * 0.8, y });
        await expect(viewer.getByText(/^1 \/ \d+$/), "a swipe to the right goes back").toBeVisible();
      }
      for (let press = 0; press < 8; press++) {
        await page.keyboard.press("Tab");
        expect(await viewer.evaluate((element) => element.contains(document.activeElement)), `focus stays in the viewer (Tab ${press + 1})`).toBe(true);
      }
      await page.keyboard.press("Escape");
      await expect(viewer).toBeHidden();
      await expect(gallery).toBeVisible();
      await page.getByRole("button", { name: "Close photos" }).tap();
      await expect(gallery).toBeHidden();
      await expect(trigger).toBeFocused();
    });
  });
}

test.describe("forms and the on-screen keyboard", () => {
  test("the login dialog keeps the focused field above a half-height keyboard", async ({ page }) => {
    await open(page, "/?auth=login");
    const dialog = page.getByRole("dialog").first();
    await expect(dialog).toBeVisible();
    const size = page.viewportSize()!;
    // A keyboard takes about 45% of a phone screen: emulate it by shrinking the visible height.
    await page.setViewportSize({ width: size.width, height: Math.round(size.height * 0.55) });
    const fields = dialog.locator("input:visible");
    const count = await fields.count();
    expect(count, "the dialog has fields").toBeGreaterThan(0);
    for (let index = 0; index < count; index++) {
      await fields.nth(index).tap();
      await page.waitForTimeout(150);
      const box = await fields.nth(index).boundingBox();
      const view = page.viewportSize()!;
      expect(box && box.y >= 0 && box.y + box.height <= view.height, `field ${index + 1} is inside the visible area`).toBe(true);
    }
  });
});

test.describe("rotation", () => {
  for (const [name, path] of [["home", "/"], ["search", SEARCH("hotel")], ["hotel", HOTEL]] as const) {
    test(`${name}: portrait to landscape and back does not break the layout`, async ({ page }) => {
      await open(page, path);
      const { width, height } = page.viewportSize()!;
      for (const [w, h] of [[height, width], [width, height]]) {
        await page.setViewportSize({ width: w, height: h });
        await page.waitForTimeout(300);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `overflow at ${w}x${h}`).toBeLessThanOrEqual(1);
        await expect(page.getByRole("banner")).toBeVisible();
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      }
    });
  }
});
