import { DATES } from "./routes";
import { expect, openRoute, test, viewportWidth } from "./helpers";

/*
 * Safe areas. Chromium cannot fake a notch, so this checks what can be checked: the page asks for the whole screen
 * (viewport-fit=cover) and the fixed booking bar keeps its padding. The real insets are on the hand-test list
 * (docs/features/responsive-testing.md).
 */
test("the viewport meta asks for viewport-fit=cover", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", /viewport-fit=cover/);
});

test("the booking bar and its footer room keep their padding below lg", async ({ page }) => {
  test.skip(viewportWidth() >= 1024, "the bar only exists below lg");
  await openRoute(page, { name: "hotel", path: `/hotels/h/azure-spa-and-wellness-resort-krabi?${DATES}` });
  const bar = page.locator("[data-booking-bar]");
  await expect(bar).toBeVisible();
  // The bar's bottom padding is the device's safe area (0 in Chromium, which cannot fake a notch), and the bar is 5rem plus it, in every state.
  const measured = await bar.evaluate((element) => {
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden;padding-bottom:env(safe-area-inset-bottom)";
    document.body.append(probe);
    const safe = parseFloat(getComputedStyle(probe).paddingBottom);
    probe.remove();
    return { padding: parseFloat(getComputedStyle(element).paddingBottom), safe, height: element.getBoundingClientRect().height, rem: parseFloat(getComputedStyle(document.documentElement).fontSize) };
  });
  expect(measured.padding).toBeCloseTo(measured.safe, 0);
  expect(measured.height).toBeCloseTo(5 * measured.rem + measured.safe, 0);
});
