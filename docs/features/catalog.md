# Catalog (shared data layer)

Last updated: 2026-11-19

## Purpose
The public catalog reads behind the destination, hotel and experience pages: one `ICatalogService`, cached getters with entity tags, the static-params and sitemap lists, and the secured revalidation endpoint. Page-level behaviour is in [destinations](destinations.md), [hotels-and-experiences](hotels-and-experiences.md) and [packages](packages.md).

## Routes
- No pages. Route helpers for everything the catalog links to live in `src/constants/routes.ts` (`destination`, `destinationRegion`, `experienceCategory`, `hotelCategory`, group and detail helpers, `packageCategory`, `packageDetail`).
- `POST /api/revalidate` (`src/app/api/revalidate/route.ts`): header `x-revalidate-secret` must equal `REVALIDATE_SECRET` (the endpoint is closed when it is unset); body `{ "tags": [...], "immediate"?: true }`; accepts only `catalog`, `navigation` and well-formed entity tags.

## Data
- Contract: `ICatalogService` and the listing types in `src/interfaces/catalog.ts`. `getCatalogService()` in `src/services/index.ts` returns the mock only when `USE_MOCKS=true`; otherwise it throws `CatalogNotConfiguredError`, which the feature functions turn into `null` (pages 404, nothing cached).
- Mock: `src/mocks/services/catalog.mock.ts` with fixtures in `src/mocks/fixtures/catalog/`. Slugs are validated with zod (`src/features/catalog/schemas.ts`) before any cached scope.
- Prices are `Money` (`{ amount, currency }`), formatted by `formatMoney`; there is no formatted price string in the catalog.

## Caching
- `src/features/catalog/get-catalog.ts`: `"use cache"`, `cacheLife("hours")` (safety net), tags `catalog` plus entity tags `category:<slug>`, `destination:<slug>`, `hotel:`, `experience:`, `package:<slug>` (`cache-tags.ts`, at most 100 per entry).
- `generateStaticParams`: the first `STATIC_PARAMS_LIMIT` (100) slugs of the header menu (regions first for destinations), or `STATIC_PARAMS_SEED` when the list is empty or unreadable; it never throws and never returns an empty list.
- `getCatalogSitemapPaths()` builds the sitemap entries with the route helpers and has no seed fallback.
- Live data: none yet. Prices and availability must never go inside the cached shell (see [seo-and-caching](seo-and-caching.md)).

## SEO
- The getters feed `generateMetadata` and the sitemap; the rules are in [seo-and-caching](seo-and-caching.md).

## Tests
- `src/features/catalog/get-catalog.test.ts`, `get-catalog-menu.test.ts`, `cache-tags.test.ts`, `schemas.test.ts`, `listing-content.test.ts`; `src/mocks/services/catalog.mock.test.ts`; `src/mocks/fixtures/catalog/catalog.fixtures.test.ts`; `src/app/api/revalidate/route.test.ts`; `src/app/sitemap-guard.test.ts`.

## Decisions
- [SEO and caching foundation](../PROJECT_DECISIONS.md#seo-and-caching-foundation-decided-2026-11-17) (flag, static params, tags, revalidation, prices).
- Older notes: `docs/API_AND_MOCK_DATA.md`, section "Navigation and catalog (mock)".

## Open questions and mocks
- There is no Trip Fusion client for the catalog; the real endpoints, response shapes and how prices and availability are fetched are unknown. Mock data is invented (ratings, review counts, prices, descriptions, photos).
- Who calls `/api/revalidate` (Trip Fusion webhook or a schedule) is not decided.
- The slug lists come from the header menu because the service has no "list" calls yet (workaround).

## Changelog
- 2026-11-19: Package ids of Home's Tuscany and Maldives cards changed to `tuscany-wellness` and `maldives-escape`; region pages show no "All packages" link until a packages listing exists.
- 2026-11-17: Hotel detail reads added (`getHotel`, `getSimilarHotels`, `listHotelSlugs`, `getHotelSlugs`) with `hotel:<slug>` and `category:` tags; hotel slugs are now `detailSlug(name, place)` and the sitemap lists hotel pages. See [hotel-detail](hotel-detail.md).
- 2026-11-17: Doc created, backfilled from the source. Entity cache tags and the revalidation route; static params limited to 100 with a seed fallback; prices changed from strings to `{ amount, currency }`; sitemap paths from the catalog. See the decisions above.
- 2026-11-16: `src/features/catalog` and the catalog fixtures created (file-system date). History before this date not documented (no git history).
