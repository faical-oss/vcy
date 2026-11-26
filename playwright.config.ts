// playwright.config.ts
import { defineConfig, devices, type Project } from '@playwright/test';

/*
 * Responsive suite. It only runs e2e/responsive/*.spec.ts: the older rendered-HTML suite (e2e/*.test.ts) is Vitest.
 *  PW_SET=quick (default) -> 375, 768 and 1280 in Chromium.   PW_SET=full -> the whole matrix (docs/features/responsive-testing.md).
 *  PW_MODE=prod -> `next start` on a build (run `npm run build` first); anything else -> `next dev`.
 *  PW_PORT (default 3001) must differ from E2E_PORT (the Vitest server, default 3199): e2e/global-setup.ts refuses to start on it.
 */
const port = Number(process.env.PW_PORT ?? 3001);
const prod = process.env.PW_MODE === 'prod';
const full = process.env.PW_SET === 'full';

type Size = { name: string; width: number; height: number; touch: boolean; browser?: 'webkit' | 'firefox'; quick?: boolean };

const SIZES: Size[] = [
  { name: 'phone-320', width: 320, height: 568, touch: true },
  { name: 'phone-360', width: 360, height: 740, touch: true },
  { name: 'phone-375', width: 375, height: 812, touch: true, quick: true },
  { name: 'phone-390', width: 390, height: 844, touch: true },
  { name: 'phone-412', width: 412, height: 915, touch: true },
  { name: 'phone-430', width: 430, height: 932, touch: true },
  { name: 'landscape-667', width: 667, height: 375, touch: true },
  { name: 'landscape-844', width: 844, height: 390, touch: true },
  { name: 'tablet-600', width: 600, height: 960, touch: true },
  { name: 'tablet-768', width: 768, height: 1024, touch: true, quick: true },
  { name: 'tablet-820', width: 820, height: 1180, touch: true },
  { name: 'tablet-1024', width: 1024, height: 768, touch: true },
  { name: 'laptop-1280', width: 1280, height: 800, touch: false, quick: true },
  { name: 'desktop-1440', width: 1440, height: 900, touch: false },
  { name: 'desktop-1920', width: 1920, height: 1080, touch: false },
  { name: 'desktop-2560', width: 2560, height: 1440, touch: false },
  { name: 'webkit-390', width: 390, height: 844, touch: true, browser: 'webkit' },
  { name: 'webkit-768', width: 768, height: 1024, touch: true, browser: 'webkit' },
  { name: 'webkit-1280', width: 1280, height: 800, touch: false, browser: 'webkit' },
  { name: 'firefox-1280', width: 1280, height: 800, touch: false, browser: 'firefox' },
];

const base = { chromium: devices['Desktop Chrome'], webkit: devices['Desktop Safari'], firefox: devices['Desktop Firefox'] };

const projects: Project[] = SIZES.filter((size) => full || size.quick).map((size) => ({
  name: size.name,
  testMatch: '**/*.spec.ts',
  use: {
    ...base[size.browser ?? 'chromium'],
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 1,
    hasTouch: size.touch,
    // Firefox has no mobile emulation flag.
    ...(size.touch && size.browser !== 'firefox' ? { isMobile: size.browser !== 'webkit' } : {}),
  },
}));

export default defineConfig({
  testDir: './e2e/responsive',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : prod ? 4 : 2,
  timeout: 60_000,
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'initial' } },
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/responsive.json' }]],
  snapshotPathTemplate: '{testDir}/__baselines__/{projectName}/{arg}{ext}',

  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },

  projects,

  webServer: {
    command: prod ? `npm run start -- -p ${port}` : `npm run dev -- -p ${port}`,
    url: `http://localhost:${port}`,
    // A reused server could be a dev server when a build was asked for: never reuse in prod mode.
    reuseExistingServer: !prod,
    timeout: 120_000,
  },
});
