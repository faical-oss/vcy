# Hotels and experiences (category and group pages)

Last updated: 2026-11-18

## Purpose
Listing pages for the header menus: one page per category (46 experience categories, 43 hotel categories) and one per menu group (6 experience groups, 6 hotel groups). Each shows a hero, a results line and a grid of cards. Hotel detail pages exist; experience detail pages do not. There are no filter chips.

## Routes
- Category: `experienceCategory(slug)` `/experiences/<category>`, `hotelCategory(slug)` `/hotels/<category>`. Group: `experienceGroup(slug)` `/experiences/groups/<group>`, `hotelGroup(slug)` `/hotels/groups/<group>` (the static `groups` segment wins over `[category]`; no category slug is `groups`).
- Pages: `src/app/(site)/experiences/[category]`, `.../groups/[group]`, `src/app/(site)/hotels/[category]`, `.../groups/[group]`.
- Detail URLs: hotels are built (`hotelDetail(slug)` `/hotels/h/<slug>`, see [hotel-detail](hotel-detail.md)); `experienceDetail(slug)` `/experiences/e/<slug>` is decided but not built (provisional scheme, only in `routes.ts`). `/experiences` and `/hotels` themselves are not pages (404), so the breadcrumb is Home > Experiences|Hotels (plain text) > title.
- Unknown slugs return a real 404 on the first request.

## Data
- `ICatalogService`: `getExperiencesByCategory`, `getHotelsByCategory`, `getExperienceGroup`, `getHotelGroup` (types `ExperienceListing`, `HotelListing`, `ExperienceGroupListing`, `HotelGroupListing`, cards `ExperienceCardData`, `HotelCardData`). Mock only (`catalog.mock.ts`, fixtures `experiences.ts`, `hotels.ts`, `categories.ts`).
- Matching: experiences by category tag; hotels by tag, brand or nightly price range; a result with fewer than `MIN_RESULTS` (3) is topped up with related items. Card prices are `Money`.
- Copy and metadata: `src/features/catalog/listing-content.ts`. Details: [catalog](catalog.md).

## Caching
- `"use cache"`, `cacheLife("hours")`, tags `catalog`, `category:<slug>` and one `hotel:`/`experience:<slug>` tag per card (capped at 100 per entry). Static params come from the header menu (first `STATIC_PARAMS_LIMIT`, seed list as fallback). Prices are indicative "from" prices; no live price or availability yet.
- The group and category pages read no `searchParams` (the pill filters were removed).

## SEO
- `urlPolicy` type `category`; `pageSeo()` in `generateMetadata`; Open Graph with the first card's image. Breadcrumb JSON-LD through `ListingPageHero`. No Offer or rating markup yet.
- Sitemap: every category and group page (`getCatalogSitemapPaths()`).

## Tests
- Unit: `src/features/catalog/get-catalog.test.ts`, `get-catalog-menu.test.ts`, `listing-content.test.ts`, `src/mocks/services/catalog.mock.test.ts`, `src/mocks/fixtures/catalog/catalog.fixtures.test.ts`, `src/features/navigation/get-navigation.test.ts` (every menu link resolves to a page), `src/components/sections/listing/listing.test.tsx`.
- e2e: `e2e/soft-404.test.ts`, `e2e/html-seo.test.ts`, `e2e/filtered-variants.test.ts`.

## Decisions
- [Group listing routes](../PROJECT_DECISIONS.md#group-listing-routes).
- [Detail URL scheme and redirects](../PROJECT_DECISIONS.md#detail-urls-redirects-and-the-404-guard-decided-2026-11-17), [soft 404](../PROJECT_DECISIONS.md#seo-and-caching-foundation-decided-2026-11-17).

## Open questions and mocks
- Catalog, ratings, review counts, prices, photos and descriptions are all invented mock data; the real Trip Fusion shapes are unknown. Photos are Unsplash/local, licences not decided.
- Detail pages, the `/experiences` and `/hotels` index pages and the search results page are not built; links to them (Home, region pages) return 404.
- Top-up fillers mean a thin category shows unrelated items; whether that should stay is not decided.
- The final URL scheme may change once the old site's URL data is available.

## Changelog
- 2026-11-18: Experience detail pages are built (`/experiences/e/<slug>`, see [experience-detail](experience-detail.md)); experience cards link to them.
- 2026-11-17: Hotel detail pages are built (`/hotels/h/<slug>`, see [hotel-detail](hotel-detail.md)); hotel cards now link to them and the card URL uses the name-plus-place slug. Experience detail pages are still not built.
- 2026-11-17: Doc created, backfilled from the source. Detail URL scheme (Option A) added to `routes.ts`; prices became `{ amount, currency }`; real 404 on the first request; entity cache tags; breadcrumb JSON-LD; the pill filters on category and group pages had been removed earlier. See the decisions above.
- 2026-11-16: Category pages, group pages and the menu links were built (route folders created this day, file-system date; see `docs/NAVIGATION_SPEC.md`). History before this date not documented (no git history).
