# Destinations (index, country and region pages)

Last updated: 2026-11-23

## Purpose
`/destinations` lists every destination grouped by region; `/destinations/<slug>` is a country or island page (facts, intro, experience cards filtered by `?category=`) or a region page (facts, popular destinations). Country and region pages end with 3 packages and 4 hotels.

## Routes
- `ROUTES.destinations`, `destination(slug, { category })`, `destinationRegion(slug)` in `src/constants/routes.ts`. Region and country slugs share `/destinations/<slug>` and never collide (`resolvePlace` tries the destination first, then the region).
- Pages: `src/app/(site)/destinations/page.tsx` (index, `?region=`) and `.../[slug]/page.tsx`.
- Unknown or malformed slugs return a real 404 on the first request (no `loading.tsx` on these routes, `partialPrefetching: false`).

## Data
- `ICatalogService` (`src/interfaces/catalog.ts`): `getDestination`, `getRegion`, `getDestinationIndex`; types `Destination`, `DestinationListing`, `Region`, `RegionListing`, `DestinationIndex`. Mock only: `src/mocks/services/catalog.mock.ts`, fixtures in `src/mocks/fixtures/catalog/` (`destinations.ts`, `regions.ts`, `packages.ts`).
- A region's experience count and "from" price are computed from its destinations (the price is `Money`); `bestTimeToVisit`, `averageStay` and `intro` are editorial mock values and are hidden when missing.
- Packages carry an explicit `destinationSlug`. Each destination page lists 3 packages and 4 hotels (own first, then its region's, then any; `REGION_PACKAGE_COUNT`, `REGION_HOTEL_COUNT`).
- Copy lives in `src/features/catalog/listing-content.ts`. Details: [catalog](catalog.md).

## Caching
- Reads are `"use cache"` with `cacheLife("hours")` and tags `catalog`, `destination:<slug>`, plus card tags (`experience:`, `package:`, `hotel:`). Static params: regions first, then destinations, at most `STATIC_PARAMS_LIMIT`, seed list as fallback.
- `searchParams` (`?category=`, `?region=`) are read only inside `<Suspense>`, so the shell stays prerendered. Prices on cards are indicative "from" prices; there is no live price here.

## SEO
- `urlPolicy` type `destination`; metadata through `pageSeo()` (never reads `searchParams`, canonical is the clean URL). Filtered variants (`?category=`, `?region=`) get `X-Robots-Tag: noindex, follow` from `next.config.ts`.
- Breadcrumb JSON-LD (`BreadcrumbList`) comes from `ListingPageHero`, built from the same crumbs as the visible breadcrumb. No Offer or rating markup.
- Sitemap: the index plus every region and destination (`getCatalogSitemapPaths()`).

## Tests
- Unit: `src/features/catalog/get-catalog.test.ts`, `listing-content.test.ts`, `get-catalog-menu.test.ts`, `src/mocks/services/catalog.mock.test.ts`, `src/mocks/fixtures/catalog/catalog.fixtures.test.ts`, `src/components/sections/listing/listing.test.tsx`, `region-body.test.tsx`.
- e2e: `e2e/soft-404.test.ts`, `e2e/html-seo.test.ts`, `e2e/filtered-variants.test.ts`.

## Decisions
- [Soft 404](../PROJECT_DECISIONS.md#seo-and-caching-foundation-decided-2026-11-17), [filtered variants](../PROJECT_DECISIONS.md#filtered-variants-and-the-sitemap-guard-decided-2026-11-17), [prices](../PROJECT_DECISIONS.md#seo-and-caching-foundation-decided-2026-11-17).

## Open questions and mocks
- Region editorial values (best time, average stay, intro) are copied from the reference prototype and flagged `ASSUMED` in `regions.ts`; the reference shows different numbers than the computed ones (for example Asia).
- Maldives, Sri Lanka and Zanzibar are listed under two header-menu regions but belong to one region in the catalog (Maldives and Sri Lanka in Asia, Zanzibar in Africa & Middle East), so they appear under Asia on its region page and the Indian Ocean page lists only four places. Not decided.
- Because every region page always shows 3 packages and 4 hotels, thin regions are filled with items from other regions (deterministic top-up).
- Hero photos are the first card's photo, not curated; some do not match the place. The "All packages" and "All hotels" links point to `/packages` and `/hotels`, which are not built (404).
- Real API shape for destinations, regions and ratings is unknown (Trip Fusion).

## Changelog
- 2026-11-23: Chip, pill, badge and tab rows are one scrolling line below 1024 (`ScrollRow`); see responsive-testing.md, Chip rows.
- 2026-11-23: One card grid for the site (`CardGrid`, `src/constants/grids.ts`): tiles 1/2/3/4 columns (560/768/1024), listing cards 1/2/3 (640/1280); see responsive-testing.md, Card grids.
- 2026-11-22: The results skeleton is at least a screen tall (layout shift on tall screens).
- 2026-11-17: Doc created, backfilled from the source. Prices became `{ amount, currency }`; filtered variants noindexed by header; unknown slugs return a real 404 on the first request; breadcrumb JSON-LD added. See the decisions above.
- 2026-11-16: Region pages, the index, country-page packages and hotels, and the Destinations menu links were built (route folders and `src/features/catalog` created this day, file-system date; details in `docs/UI_QA_REPORT.md` and `docs/NAVIGATION_SPEC.md`). History before this date not documented (no git history).
