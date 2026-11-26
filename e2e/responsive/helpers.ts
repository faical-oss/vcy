import { test as base, expect, type Page } from "@playwright/test";
import type { RouteCase } from "./routes";

/** The mock dev session cookie (src/mocks/services/auth.mock.ts): a base64url JSON session. Only works with USE_MOCKS=true. */
const SESSION_COOKIE = "vku_dev_session";
const session = Buffer.from(JSON.stringify({ userId: "pw-user", displayName: "Traveller", email: "traveller@gmail.com" })).toString("base64url");

const FREEZE_CSS = "*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;caret-color:transparent!important}nextjs-portal{display:none!important}";

export interface Issue {
  check: string;
  selector: string;
  detail: string;
}

export interface PageLog {
  errors: string[];
  failedRequests: string[];
  /** Hydration warnings are reported on their own, not as failures. */
  hydration: string[];
}

export const isTouch = () => test.info().project.use.hasTouch === true;
export const viewportWidth = () => test.info().project.use.viewport?.width ?? 0;

/** Waits until the page is hydrated and quiet: buttons have React props, fonts are ready, images are decoded. */
export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("load");
  await page.waitForFunction(() => [...document.querySelectorAll("button")].every((button) => Object.keys(button).some((key) => key.startsWith("__reactProps"))), undefined, { timeout: 20_000 }).catch(() => {});
  await page.addStyleTag({ content: FREEZE_CSS });
  // Pages that fetch in the browser (search) are ready when nothing is busy any more; the layout shift of the load is read here, before the scroll below (a visitor who scrolls while the skeleton shows is another story).
  await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"), undefined, { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(400);
  await page.evaluate(() => { (window as unknown as { __clsLoad: number }).__clsLoad = (window as unknown as { __cls?: number }).__cls ?? 0; });
  await page.evaluate(async () => {
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    await Promise.race([document.fonts.ready, wait(3000)]);
    // Walk down the page once so lazy images load (at most 80 screens, the page may grow while it loads), then come back.
    for (let step = 0, y = 0; y < document.documentElement.scrollHeight && step < 80; step++, y += window.innerHeight) {
      window.scrollTo(0, y);
      await wait(60);
    }
    window.scrollTo(0, 0);
    // An image that never answers must not hold the test: give them 6 seconds together.
    await Promise.race([Promise.all([...document.images].map((image) => (image.complete ? undefined : new Promise((resolve) => { image.onload = image.onerror = resolve; })))), wait(6000)]);
  });
  await page.waitForTimeout(250);
}

export async function signIn(page: Page): Promise<void> {
  await page.context().addCookies([{ name: SESSION_COOKIE, value: session, url: test.info().project.use.baseURL ?? "http://localhost:3001" }]);
}

/** Opens a route like a visitor would and settles it. Returns what the console and the network reported while it loaded. */
export async function openRoute(page: Page, route: RouteCase): Promise<PageLog> {
  const log: PageLog = { errors: [], failedRequests: [], hydration: [] };
  page.on("console", (message) => {
    const text = message.text();
    if (/hydrat|did not match|caret-color/i.test(text)) log.hydration.push(text.slice(0, 300));
    else if (message.type() === "error" && !/Failed to load resource/.test(text)) log.errors.push(text.slice(0, 300));
  });
  page.on("pageerror", (error) => log.errors.push(String(error).slice(0, 300)));
  page.on("requestfailed", (request) => !/_next\/webpack-hmr|\.map$/.test(request.url()) && log.failedRequests.push(`${request.failure()?.errorText} ${request.url()}`));
  page.on("response", (response) => response.status() >= 400 && !(route.notFound && response.request().isNavigationRequest()) && log.failedRequests.push(`${response.status()} ${response.url()}`));
  if (route.account) await signIn(page);
  // Layout shifts are collected from the first paint.
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as { hadRecentInput: boolean; value: number }[]) if (!entry.hadRecentInput) (window as unknown as { __cls: number }).__cls += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  const response = await page.goto(route.path, { waitUntil: "load" });
  expect(response?.status(), `${route.path} status`).toBe(route.notFound ? 404 : 200);
  await settle(page);
  return log;
}

export const test = base;
export { expect };
