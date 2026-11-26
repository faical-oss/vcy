import { JSDOM } from "jsdom";
import nextEnv from "@next/env";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FILTERED_ROBOTS_HEADER, FILTER_PARAMS, PAGINATION_PARAM } from "@/constants/seo";
import { REQUIRED_FILTER_PARAMS } from "@/test-support/seo-expectations";
import { DYNAMIC_ROUTES, STATIC_ROUTES } from "./dynamic-routes";

/*
 * Filtered variants (?category=, ?region=, dates, sort, price, q) must answer `X-Robots-Tag: noindex, follow`, and their
 * clean URLs must not. This runs ALWAYS, with INDEXING_ENABLED on or off: the header comes from next.config.ts (page
 * metadata is static and cannot see the query), derived from the shared FILTER_PARAMS list.
 *
 * This replaces the filtered-variant robots check that html-seo.test.ts had skipped while indexing was off. That check
 * looked at the robots meta, which is static and the same as the clean page's, so it could never see the variant; the
 * header is the signal, and it can be verified now. html-seo.test.ts still checks the filtered variants' canonical.
 * It also checks the header does not turn the pages dynamic: they stay prerendered (x-nextjs-prerender: 1) with the
 * same Cache-Control as their clean URL.
 */
nextEnv.loadEnvConfig(path.resolve(import.meta.dirname, ".."));
const baseUrl = process.env.E2E_BASE_URL as string;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Clean pages: every static page, every dynamic sample, and a region page. */
const CLEAN_PATHS = [
  ...Object.keys(STATIC_ROUTES),
  ...Object.values(DYNAMIC_ROUTES).map((route) => route.path(route.sample)),
  DYNAMIC_ROUTES["/destinations/[slug]"].path("asia"),
];

/** A filter parameter on two representative pages, so each name is exercised on an index page and on a detail-like page. */
const HOTEL = DYNAMIC_ROUTES["/hotels/h/[slug]"].path(DYNAMIC_ROUTES["/hotels/h/[slug]"].sample);
const VARIANTS = [...new Set([...REQUIRED_FILTER_PARAMS, ...FILTER_PARAMS])].flatMap((name) => [`/destinations?${name}=x`, `/destinations/bali-indonesia?${name}=x`, `/hotels/wellness-resorts?${name}=x`, `${HOTEL}?${name}=x`]);

const head = (url: string) => fetch(`${baseUrl}${url}`, { redirect: "manual" });

describe("filtered variants are noindex,follow by response header", () => {
  it.each(VARIANTS)("%s", async (url) => {
    const response = await head(url);
    expect(response.status, `${url}: status`).toBe(200);
    expect(response.headers.get("x-robots-tag"), `${url}: X-Robots-Tag must be "${FILTERED_ROBOTS_HEADER}" (a parameter missing from FILTER_PARAMS or the header rule in next.config.ts?)`).toBe(FILTERED_ROBOTS_HEADER);
  });

  it("sends a single noindex,follow value when several filter parameters are present", async () => {
    const response = await head("/destinations/bali-indonesia?category=yoga-retreats&region=asia&sort=price&q=yoga");
    expect(response.headers.get("x-robots-tag")).toBe(FILTERED_ROBOTS_HEADER);
  });

  it("does not treat an empty filter value as a filter, like urlPolicy (Next does not match the rule on an empty value)", async () => {
    expect((await head("/destinations?region=")).headers.get("x-robots-tag")).toBeNull();
  });
});

describe("clean URLs do not get the header", () => {
  it.each(CLEAN_PATHS)("%s", async (url) => {
    const response = await head(url);
    expect(response.headers.get("x-robots-tag"), `${url}: a clean URL must not carry X-Robots-Tag`).toBeNull();
  });

  it("does not treat pagination or tracking parameters as filters", async () => {
    for (const url of [`/hotels/wellness-resorts?${PAGINATION_PARAM}=2`, "/hotels/wellness-resorts?utm_source=news"]) {
      expect((await head(url)).headers.get("x-robots-tag"), `${url}: must stay indexable`).toBeNull();
    }
  });

  it("does not noindex framework URLs that use a parameter named like a filter (/_next/image?q=75)", async () => {
    const response = await head("/_next/image?url=%2Fnope.png&w=64&q=75");
    expect(response.headers.get("x-robots-tag"), "/_next/image must not carry X-Robots-Tag").toBeNull();
  });
});

describe("the header keeps pages cached and the canonical clean", () => {
  it.each(["/destinations", "/destinations/bali-indonesia", "/hotels/wellness-resorts", HOTEL])("%s: filtered variant is served like its clean URL", async (clean) => {
    const filtered = await head(`${clean}?${FILTER_PARAMS[1]}=x`);
    const plain = await head(clean);
    expect(plain.headers.get("x-nextjs-prerender"), `${clean}: the clean page must be a prerendered page (x-nextjs-prerender: 1)`).toBe("1");
    expect(filtered.headers.get("x-nextjs-prerender"), `${clean}?…: the filtered variant must stay prerendered`).toBe("1");
    expect(filtered.headers.get("cache-control"), `${clean}?…: Cache-Control must equal the clean URL's`).toBe(plain.headers.get("cache-control"));
  });

  it.each(VARIANTS)("canonical of %s points to the clean URL", async (url) => {
    const html = await (await head(url)).text();
    const canonical = new JSDOM(html).window.document.querySelector('link[rel="canonical"]')?.getAttribute("href");
    const clean = url.split("?")[0];
    expect(canonical, `${url}: canonical must be the clean URL`).toBe(`${siteUrl}${clean}`);
  });
});
