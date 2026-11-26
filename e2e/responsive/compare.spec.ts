import { mkdirSync } from "node:fs";
import path from "node:path";
import { DATES, SEARCH } from "./routes";
import { settle, signIn, test, viewportWidth } from "./helpers";

/*
 * Takes our version of every page that has a design screenshot ("vacayou mobile design" folder) at 390 and 430, so the two can be
 * looked at side by side. It does not compare pixels. Output: screenshots/responsive-check/design/<name>-<width>.png (not committed).
 * Run: npx playwright test compare.spec.ts --project=phone-390 --project=phone-430 (PW_SET=full).
 */
const OUT = path.resolve(__dirname, "../../screenshots/responsive-check/design");
mkdirSync(OUT, { recursive: true });

const SHOTS = [
  { name: "home", path: "/", account: false },
  { name: "search", path: SEARCH("experience"), account: false },
  { name: "experience", path: `/experiences/e/ubud-yoga-and-detox-retreat?${DATES}`, account: false },
  { name: "account", path: "/account", account: true },
];

test.beforeEach(({ }, testInfo) => test.skip(![390, 430].includes(viewportWidth()) || testInfo.project.name.startsWith("webkit"), "design widths only"));

for (const shot of SHOTS) {
  test(`design · ${shot.name}`, async ({ page }) => {
    if (shot.account) await signIn(page);
    await page.goto(shot.path, { waitUntil: "load" });
    await settle(page);
    await page.screenshot({ path: path.join(OUT, `${shot.name}-${viewportWidth()}.png`), fullPage: true, animations: "disabled", caret: "initial" });
  });
}

test("design · menu and search open", async ({ page }) => {
  await page.goto("/", { waitUntil: "load" });
  await settle(page);
  await page.getByRole("button", { name: "Open menu" }).tap();
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Lifestyle" }).tap();
  await page.screenshot({ path: path.join(OUT, `menu-${viewportWidth()}.png`), animations: "disabled", caret: "initial" });
  await page.goto(SEARCH("hotel"), { waitUntil: "load" });
  await settle(page);
  await page.getByRole("button", { name: /^Edit search/ }).tap();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `search-open-${viewportWidth()}.png`), fullPage: true, animations: "disabled", caret: "initial" });
});
