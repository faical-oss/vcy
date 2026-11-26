import { existsSync } from "node:fs";
import { join } from "node:path";
import { DATES, SEARCH } from "./routes";
import { expect, settle, signIn, test, viewportWidth } from "./helpers";

/*
 * Regression baselines: full-page screenshots of the key pages at 375, 768 and 1280, made from the fixed result (mock data, fixed
 * 2099 dates). They guard against layout drift, they are not a design check. They are NOT committed (git-ignored): each developer makes a local set with `npm run test:responsive:baseline` before changing the UI, then `npm run test:responsive` compares against it. Update the same way
 * (production build, so Next's dev overlay is not in the picture). The date fields that show "today" are masked.
 */
const PAGES = [
  { name: "home", path: "/" },
  { name: "search-hotel", path: SEARCH("hotel") },
  { name: "hotel", path: `/hotels/h/azure-spa-and-wellness-resort-krabi?${DATES}` },
  { name: "experience", path: `/experiences/e/ubud-yoga-and-detox-retreat?${DATES}` },
  { name: "package", path: `/packages/p/bali-soul-surf?${DATES}` },
  { name: "account", path: "/account", account: true },
];

test.beforeEach(({ }, testInfo) => {
  test.skip(![375, 768, 1280].includes(viewportWidth()) || /^(webkit|firefox)/.test(testInfo.project.name), "baselines: Chromium at 375, 768 and 1280");
  // The baselines are not committed (they are about 22 MB): without a local set this spec skips; `npm run test:responsive:baseline` makes one.
  const generating = testInfo.config.updateSnapshots !== "none";
  test.skip(!generating && !existsSync(join(__dirname, "__baselines__", testInfo.project.name)), "no local baselines: run npm run test:responsive:baseline first");
});

for (const page of PAGES) {
  test(`baseline · ${page.name}`, async ({ page: browserPage }) => {
    if (page.account) await signIn(browserPage);
    await browserPage.goto(page.path, { waitUntil: "load" });
    await settle(browserPage);
    await expect(browserPage).toHaveScreenshot(`${page.name}.png`, { fullPage: true, mask: [browserPage.locator("[aria-haspopup=dialog]")] });
  });
}
