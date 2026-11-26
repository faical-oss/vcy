# Lifestyle vacations

Last updated: 2026-11-23

## Purpose
Five landing pages under the header's Lifestyle menu (Adventure, Golf, Meditation, Spa, Yoga), one data-driven template: hero, sticky sub-nav, intro, three photo rows, filterable package cards, a traveller quote, a magazine teaser, destination tiles, then the shared testimonials, #VacayouMoments and newsletter. The magazine and glossary themselves stay on vacayou.com; there are no article, author or category pages here.

## Routes
- `/lifestyle/<slug>` for `adventure | golf | meditation | spa | yoga`, built with `lifestyleVacation()` (`LIFESTYLE_SLUGS` in `src/constants/routes.ts`). Unknown slugs return 404 on the first request. `/lifestyle` itself is not a page: the breadcrumb shows "Lifestyle" without a link.
- Sub-nav anchors: `#why` (intro), `#find` (the photo rows), `#packages`. The hero's primary button scrolls to `#packages`, "Discover more" to `#why`.

## Data
- Types in `src/interfaces/lifestyle.ts` (`LifestylePageFixture`, `LifestylePageContent`, package refs). Fixtures in `src/mocks/fixtures/lifestyle/`: one file per page plus one shared package table (`packages.ts`); a page references packages by id and adds its own badge, label, filter chips, highlights and photos (the same package is on several pages).
- One access function: `getLifestylePage(slug)` (`src/features/lifestyle/get-lifestyle-page.ts`), plus `getLifestyleSlugs()` and `getLifestyleSitemapPaths()`. Testimonials, moments and the newsletter come from the Home content.
- Components: `src/components/sections/lifestyle/` (sub-nav, intro, rows, packages with filter chips, destinations) and the shared `ListingHero` (size `feature`, with `actions`), `PackageCard`, `DestinationCard`, `MagazineSection`, `EditorialBanner`, `TestimonialsSection`, `NewsletterSection`.
- Package cards link to the placeholder package page `/packages/p/<package id>` (`packageDetail()`; see [packages](packages.md)) and have no rating. `PackageCard` takes an optional `href`: without one it is a plain card. Every destination tile links to a destination page (`/destinations/<slug>`): the place itself, or the nearest country or region when it has none (Patagonia to Chile, Utah to USA, Nicaragua to Americas).

## Caching
- `"use cache"`, `cacheLife("hours")`, tags `lifestyle` and `lifestyle:<slug>` (both accepted by `/api/revalidate`). No prices or availability on these pages.

## SEO
- `urlPolicy` type `category`, canonical `/lifestyle/<slug>`, `pageSeo()` metadata with a unique title and description per page. Package filtering is client state only (all cards are in the server HTML, "All" active), so there are no filter URLs.
- One `h1` (the hero), visible breadcrumb Home > Lifestyle > page with matching BreadcrumbList JSON-LD. No other JSON-LD: there is no article, rating or price markup.
- Hero image `priority`, alt text on content photos, fixed aspect ratios. The five pages are in the sitemap (`getLifestyleSitemapPaths()`).
- External magazine links open in a new tab with `rel="noopener"` (`NavItemLink external`).

## Tests
- `src/features/lifestyle/get-lifestyle-page.test.ts` (content, chips, ratings, hosts, links), `src/components/sections/lifestyle/lifestyle.test.tsx` (filter chips, non-link cards, external magazine links), `src/constants/routes.test.ts`, `cache-tags.test.ts`; e2e through `e2e/dynamic-routes.ts` (`/lifestyle/[slug]`: soft-404 and rendered-HTML SEO checks).

## Decisions
- Scope is the five spec pages only; magazine and glossary stay external. See [PROJECT_DECISIONS.md](../PROJECT_DECISIONS.md#lifestyle-vacations-decided-2026-11-19).

## Open questions and mocks
- All copy, quotes (traveller names), counts ("90+ adventures"), prices and package details are mock (`TODO(api)`, `TODO(cms)`). The traveller quotes need real, consented stories.
- The photos are the prototype's stock images (its own assets and Unsplash), hotlinked; licensed images are needed (`TODO(cms)`).
- Package ratings were removed on purpose (the prototype's "4.9 (124)" was a placeholder).
- Golf has no experience category, so "View all golf vacations" opens the Active & Adventure group. Tiles for places without a destination page (Patagonia, Utah, Rishikesh, Bhutan...) open the nearest country or region page, so the page can show a different place than the tile.
- The docked search bar is built (see [search](search.md)); the Lifestyle sub-nav sits below it.
- Accessibility notes: the row eyebrows use the design's tan (`accent`, low contrast on white); the hero photo has its alt text but sits behind the h1. The sub-nav scrolls sideways on narrow screens. On desktop it sticks under the docked search bar while that shows (`--docked-search-h`, see [search](search.md)).
- The Yoga spec file says "3-column grid" but its screenshots and the README show the carousel: the carousel is built. The spec put the pull-quote photo under the magazine heading; it belongs to the quote band.
- The meditation spec assigns no card to the "Nature" chip; the Pisgah card was given it.

## Changelog
- 2026-11-23: Chip, pill, badge and tab rows are one scrolling line below 1024 (`ScrollRow`); see responsive-testing.md, Chip rows.
- 2026-11-23: One card grid for the site (`CardGrid`, `src/constants/grids.ts`): tiles 1/2/3/4 columns (560/768/1024), listing cards 1/2/3 (640/1280); see responsive-testing.md, Card grids.
- 2026-11-22: The packages carousel shows 1.4 cards on phones.
- 2026-11-19: The sub-nav sticks below the docked search bar (CSS variable offset); anchors reserve room for it.
- 2026-11-19: The package cards link to the real package pages (see [packages](packages.md)).
- 2026-11-19: External magazine links use `rel="noopener"` (was `noopener noreferrer`).
- 2026-11-19: Package cards link to the placeholder package page; every destination tile links to a destination or region page; the magazine cards show the author line right after the excerpt; the sub-nav links underline on hover and focus.
- 2026-11-19: Page, template, fixtures and sitemap entries created. The five Lifestyle Vacations menu links point to the new pages.
