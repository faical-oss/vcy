# SEO and caching foundation

Last updated: 2026-11-22

## Purpose
The rules and code that keep mock data out of search engines and every public page indexable in a controlled way: the indexing flag, the URL policy, JSON-LD builders, the sitemap, cache tags and revalidation, soft-404 protection and the redirect-map launch check. The checklist pages must follow is in CLAUDE.md ("SEO definition of done").

## Routes
- `/robots.txt` (`src/app/robots.ts`), `/sitemap.xml` (`src/app/sitemap.ts`), `POST /api/revalidate` (see [catalog](catalog.md)). All URLs come from `src/constants/routes.ts` (`ROUTES`, helpers, `absoluteUrl`, `isBuiltRoute`).

## Data
- Indexing: `INDEXING_ENABLED` is the only switch, read through `isIndexingEnabled()` in `src/lib/env.ts`. It is refused (build and dev start fail in `next.config.ts`; the function throws) when `USE_MOCKS=true` or `SITE_ENV` is not `production`. Read at build time.
- `urlPolicy` / `pageSeo()` (`src/features/seo/url-policy.ts`): URL type to canonical and robots. `FILTER_PARAMS` (`src/constants/seo.ts`) lists the filter parameters; filtered variants are noindex,follow.
- JSON-LD: pure builders in `src/features/seo/json-ld.ts` (`breadcrumbListJsonLd`, `lodgingJsonLd`, `productJsonLd`), the `<JsonLd>` component, and `ListingPageHero` (`src/features/seo/listing-page-hero.tsx`) which renders the visible breadcrumb and its BreadcrumbList from the same crumbs. Prices come only from `Money`; ratings are dropped while `USE_MOCKS=true`.
- Redirects: `src/features/seo/redirect-map.ts` validates `../vku-migration/seo/redirect-map.csv` (which has only its header today).

## Caching
- Pages are prerendered shells with a streamed session header, so HTML responses are `Cache-Control: private, no-store` with `x-nextjs-prerender: 1` (measured on the built server). The catalog and navigation reads are `"use cache"` with tags; `generateStaticParams` is limited to `STATIC_PARAMS_LIMIT` with a seed fallback. On-demand revalidation by tag: `POST /api/revalidate`.
- Unknown slugs return a real 404 on the first request because `partialPrefetching` is off and the dynamic-slug routes have no `loading.tsx` (see `next.config.ts`).
- Filtered variants get `X-Robots-Tag: noindex, follow` from `next.config.ts` headers (one rule per `FILTER_PARAMS` entry, not on `/_next/` or `/api/`), always, independent of the flag. This does not change prerendering.

## SEO
- Sitemap: empty unless indexing is on; then the five static pages plus `getCatalogSitemapPaths()` (no seed fallback). `robots.txt`: `Disallow: /` unless indexing is on.
- Account, checkout and search are noindex (allowlist in `src/test-support/site-pages.ts`).

## Tests
- Unit: `src/lib/env.test.ts`, `src/features/seo/url-policy.test.ts`, `filter-params.test.ts`, `json-ld.test.ts`, `redirect-map.test.ts`, `src/components/seo/json-ld.test.tsx`, `src/constants/routes.test.ts`, `src/constants/no-hardcoded-paths.test.ts`, `src/app/page-seo-contract.test.ts`, `src/app/sitemap-guard.test.ts`, `src/app/api/revalidate/route.test.ts`.
- e2e (`npm run build && npm run test:e2e`): `e2e/soft-404.test.ts`, `e2e/html-seo.test.ts`, `e2e/filtered-variants.test.ts`; routes in `e2e/dynamic-routes.ts`.
- Docs: `src/features/feature-docs.test.ts` and `npm run docs:check` (see [README](README.md)).

## Decisions
- [SEO and caching foundation](../PROJECT_DECISIONS.md#seo-and-caching-foundation-decided-2026-11-17), [detail URLs, redirects and the 404 guard](../PROJECT_DECISIONS.md#detail-urls-redirects-and-the-404-guard-decided-2026-11-17), [filtered variants and the sitemap guard](../PROJECT_DECISIONS.md#filtered-variants-and-the-sitemap-guard-decided-2026-11-17).

## Open questions and mocks
- The redirect map and URL inventory are empty (old site data pending). The redirect check blocks the build only with `INDEXING_ENABLED=true`.
- No page renders Hotel or Product JSON-LD yet (no detail pages); the builders are tested but unused. Ratings and prices for markup do not exist as real data.
- The sitemap is not split into an index (`generateSitemaps`) yet; do it before 50,000 URLs.
- Who triggers revalidation (webhook or schedule) and the production domain (`NEXT_PUBLIC_SITE_URL`) are undecided. No CI pipeline exists to run the e2e suite.
- HTML is not CDN-cacheable until the session leaves the layout (postponed until real auth).

## Changelog
- 2026-11-22: `FILTER_PARAMS` gained `types`, `stars`, `places`, `amenities`, `board`, `rating` and `view` (the results page filters). See [search](search.md).
- 2026-11-19: `FILTER_PARAMS` gained `type` and `destination` (the search box's tab and picked destination; `q` and `category` were already there). See [search](search.md).
- 2026-11-19: New 404 page (`src/app/not-found.tsx`, `(site)/not-found.tsx`): heading, Back to home, links to the four main sections; unmatched URLs render it with the site header and footer; `/magazine` is a temporary (307) redirect to the external magazine, not a page and not in the sitemap. e2e: `e2e/not-found.test.ts`, `e2e/magazine-redirect.test.ts`.
- 2026-11-17: `lodgingJsonLd` gained description, address and a mock-gated offer (`priceAllowed()`); `FILTER_PARAMS` gained `rooms`, `adults`, `children`, `flex`; `PageBreadcrumb` added for white-background detail pages; the hotel detail route joined the e2e route list.
- 2026-11-17: Doc created, backfilled from the source and from PROJECT_DECISIONS. The same day: indexing flag and build guard, cache tags and revalidation route, seed-fallback static params, real 404s on the first request, `Money` prices, `urlPolicy`, JSON-LD builders and breadcrumb markup, rendered-HTML and filtered-variant e2e checks, sitemap guard, hardcoded-path guard, redirect-map check.
- 2026-11-12: `src/proxy.ts`, `robots.ts` and `sitemap.ts` (Home only) existed with the `SITE_ENV`-based noindex (file-system date). History before this date not documented (no git history).
