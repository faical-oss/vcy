/**
 * The public routes the e2e suite covers, kept in one place and enforced by src/app/page-seo-contract.test.ts: a new page
 * cannot ship without being listed here.
 *  - DYNAMIC_ROUTES: every page.tsx below src/app/(site) with a [param] segment, keyed by route pattern. e2e/soft-404.test.ts
 *    requests an unknown slug on each (a real 404 on the FIRST request); e2e/html-seo.test.ts checks the rendered HTML of
 *    `sample`, a slug that exists in the catalog.
 *  - STATIC_ROUTES: every other indexable page. `type` is the url-policy type of the page.
 */
export interface DynamicRoute {
  path: (slug: string) => string;
  /** A slug that exists (mock catalog). */
  sample: string;
  type: "category" | "destination" | "detail";
}

export const DYNAMIC_ROUTES: Readonly<Record<string, DynamicRoute>> = {
  "/destinations/[slug]": { path: (slug) => `/destinations/${slug}`, sample: "bali-indonesia", type: "destination" },
  "/experiences/[category]": { path: (slug) => `/experiences/${slug}`, sample: "yoga-retreats", type: "category" },
  "/hotels/[category]": { path: (slug) => `/hotels/${slug}`, sample: "wellness-resorts", type: "category" },
  "/experiences/groups/[group]": { path: (slug) => `/experiences/groups/${slug}`, sample: "wellness", type: "category" },
  "/hotels/groups/[group]": { path: (slug) => `/hotels/groups/${slug}`, sample: "by-type", type: "category" },
  "/hotels/h/[slug]": { path: (slug) => `/hotels/h/${slug}`, sample: "azure-spa-and-wellness-resort-krabi", type: "detail" },
  "/packages/p/[slug]": { path: (slug) => `/packages/p/${slug}`, sample: "bali-soul-surf", type: "detail" },
  "/lifestyle/[slug]": { path: (slug) => `/lifestyle/${slug}`, sample: "adventure", type: "category" },
  "/experiences/e/[slug]": { path: (slug) => `/experiences/e/${slug}`, sample: "ubud-yoga-and-detox-retreat", type: "detail" },
};

/** A second slug for `/destinations/[slug]` that resolves to a region page instead of a country page. */
export const REGION_SAMPLE = "asia";

export const STATIC_ROUTES: Readonly<Record<string, { type: "home" | "static" | "destination" }>> = {
  "/": { type: "home" },
  "/destinations": { type: "destination" },
  "/support": { type: "static" },
  "/privacy": { type: "static" },
  "/terms": { type: "static" },
};
