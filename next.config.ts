import type { NextConfig } from "next";
import { EXTERNAL_URLS, LEGACY_PATHS, ROUTES } from "./src/constants/routes";
import { FILTERED_ROBOTS_HEADER, FILTER_PARAMS } from "./src/constants/seo";

// Fail the build (and dev start) when indexing is switched on next to mock data or outside production. Same rule as
// `indexingConflict` in src/lib/env.ts; duplicated here because the config cannot import app code.
if (process.env.INDEXING_ENABLED === "true") {
  if (process.env.USE_MOCKS === "true") throw new Error("INDEXING_ENABLED=true is not allowed while USE_MOCKS=true: mock data must never be indexed.");
  if (process.env.SITE_ENV !== "production") throw new Error("INDEXING_ENABLED=true is only allowed when SITE_ENV=production.");
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Off on purpose, and the dynamic-slug routes (destinations/[slug], experiences|hotels/[category], .../groups/[group])
  // must NOT have a loading.tsx: with partial prefetching (or a loading.tsx) the first request for a slug that was not
  // prerendered gets the App Shell with status 200, so an unknown slug is a soft 404 until the second request. Without
  // them the first request waits for the page and notFound() returns a real 404. e2e/soft-404.test.ts guards this
  // (`npm run build && npm run test:e2e`). Future detail pages: the catalog lookup and notFound() must run before any
  // streamed part (the live price lives inside its own Suspense, after the lookup). See docs/PROJECT_DECISIONS.md.
  partialPrefetching: false,
  poweredByHeader: false,
  // The dev-only "N" badge sat on top of the fixed booking bar's text. Dev only (it is never in a production build); errors still show.
  devIndicators: false,
  // Inlined at build time so the dev-only mock services are dead code (and not bundled) when mocks are off.
  env: { VKU_USE_MOCKS: process.env.USE_MOCKS === "true" ? "true" : "false" },
  images: {
    // Allowlist only the hosts we actually load images from.
    remotePatterns: [
      { protocol: "https", hostname: "i.assetzen.net" },
      // TODO: remove once the nav featured images move to Asset Zen.
      { protocol: "https", hostname: "images.unsplash.com" },
      // TODO(cms): the Lifestyle mock photos (hero, rows, some cards) are assets of the Figma prototype; remove with the mocks.
      { protocol: "https", hostname: "glad-red-27377678.figma.site", pathname: "/assets/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // TODO: Content-Security-Policy with nonces once GTM, Clerk, maps and the payment provider are known.
        ],
      },
      // Filtered variants (?category=, ?region=, dates, sort, price, q) are noindex,follow, ALWAYS (not only when indexing
      // is on). Page metadata is static and cannot see the query (reading searchParams in generateMetadata would make the
      // page dynamic), so the rule is a response header matched on the query string; the pages stay prerendered. One rule
      // per parameter because the `has` items of a rule are ANDed; where several match, the header is the same value.
      // The list is FILTER_PARAMS, shared with urlPolicy (src/features/seo/filter-params.test.ts keeps them in step). `?page=` is not
      // a filter. `_next/` and `api/` are excluded: `/_next/image?...&q=75` must not be noindexed.
      ...FILTER_PARAMS.map((key) => ({
        source: "/((?!_next/|api/).*)",
        has: [{ type: "query" as const, key }],
        headers: [{ key: "X-Robots-Tag", value: FILTERED_ROBOTS_HEADER }],
      })),
    ];
  },
  // `/magazine` is not a page of this site: old or typed links go to the external magazine. TEMPORARY (307), not permanent:
  // the final setup (a proxy or same-domain routing) is not decided yet, and a 308 would be cached by browsers for good.
  async redirects() {
    return [
      { source: LEGACY_PATHS.magazine, destination: EXTERNAL_URLS.magazine, permanent: false },
      // TEMPORARY (307): `/experiences` and `/hotels` have no index page yet, so they go to the default browse groups. Remove both
      // rules (and point `ROUTES.browseExperiences` / `browseHotels` at the real pages) once the index pages exist.
      { source: ROUTES.experiences, destination: ROUTES.browseExperiences, permanent: false },
      { source: ROUTES.hotels, destination: ROUTES.browseHotels, permanent: false },
    ];
  },
  // TODO: more redirects generated from seo/redirect-map.csv (the migration project).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
