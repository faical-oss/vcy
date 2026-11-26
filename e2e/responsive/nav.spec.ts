import { expect, openRoute, test } from "./helpers";

/*
 * Task 7, item 5. The header items open their dropdown and never navigate. It sets the widths itself (320, 360, 390, 768 mobile menu; 1024, 1280
 * desktop nav), so it runs once (in the 1280 project). The links in the server HTML are checked without JavaScript in e2e/nav-html.test.ts.
 *   Desktop: a click opens (a mouse click keeps what the hover opened) and never navigates; Enter, Space and ArrowDown open it and move focus in;
 *   arrows move between the links; Escape closes it and returns the focus; hovering opens it; "View all" goes to the section.
 *   Mobile: the items toggle their section, never navigate; the section ends with "View all"; the menu keeps working from 320 to 768.
 */
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "laptop-1280", "sets the widths itself: runs once");
});

const MENUS = ["experiences", "destinations", "hotels", "lifestyle"] as const;

for (const width of [1024, 1280]) {
  test(`desktop navigation at ${width}px: items open the dropdown and never navigate`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openRoute(page, { name: "home", path: "/" });
    const start = page.url();
    const nav = page.locator('nav[aria-label="Main"]');
    for (const id of MENUS) {
      const at = `${id} at ${width}px`;
      const trigger = nav.locator(`[data-nav-trigger="${id}"]`);
      const panel = page.locator(`[id="nav-panel-${id}"]`);
      expect(await trigger.evaluate((element) => element.tagName), `${at}: a button`).toBe("BUTTON");
      await expect(panel, `${at}: closed at first`).toBeHidden();

      // A click opens it, never navigates, and a second mouse click keeps it open (the hover had opened it).
      await trigger.click();
      await expect(panel, `${at}: a click opens it`).toBeVisible();
      await trigger.click();
      await expect(panel, `${at}: a mouse click keeps it open`).toBeVisible();
      expect(page.url(), `${at}: a click never navigates`).toBe(start);
      await page.keyboard.press("Escape");
      await expect(panel, `${at}: Escape closes it`).toBeHidden();
      await expect(trigger, `${at}: Escape returns the focus`).toBeFocused();

      // Keyboard: Enter, then Space, open it and move the focus in; arrows move between links.
      await page.mouse.move(5, 500);
      await page.waitForTimeout(250);
      await trigger.focus();
      await page.keyboard.press("Enter");
      await expect(panel, `${at}: Enter opens it`).toBeVisible();
      expect(await panel.evaluate((element) => element.contains(document.activeElement)), `${at}: Enter moves the focus into it`).toBe(true);
      expect(page.url(), `${at}: Enter never navigates`).toBe(start);
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      await page.keyboard.press(" ");
      await expect(panel, `${at}: Space opens it`).toBeVisible();
      expect(await panel.evaluate((element) => element.contains(document.activeElement)), `${at}: Space moves the focus into it`).toBe(true);
      expect(page.url(), `${at}: Space never navigates`).toBe(start);
      // Arrow keys move between the links (the focus changes and stays in the panel).
      const first = await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 80));
      await page.keyboard.press("ArrowDown");
      expect(await panel.evaluate((element) => element.contains(document.activeElement)), `${at}: ArrowDown keeps the focus in the panel`).toBe(true);
      expect(await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 80)), `${at}: ArrowDown moves to another item`).not.toBe(first);
      await page.keyboard.press("Escape");
      await expect(panel).toBeHidden();
      await expect(trigger).toBeFocused();
    }
    // Hovering opens it.
    await page.mouse.move(5, 500);
    await nav.locator('[data-nav-trigger="hotels"]').hover();
    await expect(page.locator('[id="nav-panel-hotels"]')).toBeVisible();
    await page.mouse.move(5, 500);

    // "View all" goes to the section.
    await nav.locator('[data-nav-trigger="destinations"]').click();
    await page.locator('[id="nav-panel-destinations"]').getByRole("link", { name: /View all destinations/ }).click();
    await expect(page).toHaveURL(/\/destinations$/);
  });
}

for (const width of [320, 360, 390, 768]) {
  test(`mobile menu at ${width}px: the items toggle their section and never navigate, each ends with "View all"`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await openRoute(page, { name: "home", path: "/" });
    const start = page.url();
    await expect(page.locator('nav[aria-label="Main"]'), `${width}px: the desktop navigation is hidden`).toBeHidden();
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Main menu" });
    await expect(menu).toBeVisible();
    for (const [name, viewAll] of [["Experiences", /View all experiences/], ["Destinations", /View all destinations/], ["Hotels", /View all hotels/]] as const) {
      const row = menu.getByRole("button", { name });
      await expect(row, `${width}px: ${name} is a button`).toBeVisible();
      expect(await menu.getByRole("link", { name, exact: true }).count(), `${width}px: ${name} is not a link`).toBe(0);
      await row.click();
      await expect(row, `${width}px: ${name} expands`).toHaveAttribute("aria-expanded", "true");
      expect(page.url(), `${width}px: ${name} never navigates`).toBe(start);
      await expect(menu.getByRole("link", { name: viewAll }), `${width}px: ${name} ends with a View all link`).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), `${width}px: no sideways scroll`).toBeLessThanOrEqual(1);
      await row.click();
      await expect(row, `${width}px: ${name} collapses`).toHaveAttribute("aria-expanded", "false");
    }
    await menu.getByRole("button", { name: "Destinations" }).click();
    await menu.getByRole("link", { name: /View all destinations/ }).click();
    await expect(page).toHaveURL(/\/destinations$/);
    await expect(page.getByRole("dialog", { name: "Main menu" }), `${width}px: the menu closes after a link`).toHaveCount(0);
  });
}
