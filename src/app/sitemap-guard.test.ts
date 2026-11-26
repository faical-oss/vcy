import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

import { absoluteUrl, isBuiltRoute } from "@/constants/routes";
import { getCatalogSitemapPaths } from "@/features/catalog/get-catalog";
import { isAllowlisted, sitePages } from "@/test-support/site-pages";
import { DYNAMIC_ROUTES } from "../../e2e/dynamic-routes";
import { getPackageSitemapPaths } from "@/features/packages/get-package";
import { getLifestyleSitemapPaths } from "@/features/lifestyle/get-lifestyle-page";
import sitemap from "./sitemap";

/*
 * Sitemap guard: every public page that can be indexed must be in the sitemap, and nothing else may be. A page is either
 * in the sitemap or on the noindex allowlist (src/test-support/site-pages.ts); there is no third state.
 */
const SITE_URL = "https://vacayou.example";

describe("sitemap covers every indexable page", () => {
  beforeEach(() => {
    vi.stubEnv("INDEXING_ENABLED", "true");
    vi.stubEnv("SITE_ENV", "production");
    vi.stubEnv("USE_MOCKS", "false");
    vi.stubEnv("USE_MOCKS", "false");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", SITE_URL);
  });
  afterEach(() => vi.unstubAllEnvs());

  const staticRoutes = sitePages().filter((page) => !page.route.includes("[") && !isAllowlisted(page.route));

  it.each(staticRoutes)("static page $route is in the sitemap", async ({ route, relative }) => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls, `${relative}: ${route} is neither in the sitemap nor on NOINDEX_ALLOWLIST. Add it to STATIC_PATHS in src/app/sitemap.ts (built with the routes.ts helpers), or to the allowlist in src/test-support/site-pages.ts if it must be noindex.`).toContain(absoluteUrl(route, SITE_URL));
  });

  it("lists only built, unique, clean URLs of the site, and no noindex section", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(new Set(urls).size, "duplicate sitemap URLs").toBe(urls.length);
    for (const url of urls) {
      expect(url.startsWith(SITE_URL), `${url} is not on the site URL`).toBe(true);
      const sitePath = new URL(url).pathname;
      expect(new URL(url).search, `${url} has a query string`).toBe("");
      expect(isBuiltRoute(sitePath), `${url} is not a built route`).toBe(true);
      expect(isAllowlisted(sitePath), `${url} is on the noindex allowlist but in the sitemap`).toBe(false);
    }
  });

  it("is empty when indexing is off", async () => {
    vi.stubEnv("INDEXING_ENABLED", "false");
    expect(await sitemap()).toEqual([]);
  });
});

describe("the catalog part of the sitemap covers every dynamic route (mock catalog)", () => {
  beforeEach(() => vi.stubEnv("USE_MOCKS", "true"));
  afterEach(() => vi.unstubAllEnvs());

  it.each(Object.keys(DYNAMIC_ROUTES))("%s has pages in the sitemap", async (pattern) => {
    const regex = new RegExp(`^${pattern.replace(/\[[^\]]+\]/g, "[a-z0-9]+(?:-[a-z0-9]+)*")}$`);
    // The Lifestyle pages are not catalog entities: the sitemap adds their paths next to the catalog's.
    const paths = [...(await getCatalogSitemapPaths()), ...getLifestyleSitemapPaths(), ...getPackageSitemapPaths()];
    expect(paths.some((entry) => regex.test(entry)), `no sitemap path matches the dynamic route ${pattern}: getCatalogSitemapPaths() in src/features/catalog/get-catalog.ts must include it`).toBe(true);
  });

  it("only returns clean, built, unique paths, and no seed fallback is needed", async () => {
    const paths = await getCatalogSitemapPaths();
    expect(new Set(paths).size).toBe(paths.length);
    for (const entry of paths) {
      expect(entry, entry).not.toContain("?");
      expect(isBuiltRoute(entry), `${entry} is not a built route`).toBe(true);
    }
  });
});
