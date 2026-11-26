# Packages

Last updated: 2026-11-25

## Purpose
Packages are multi-night wellness trips made of one or several properties. Each has a detail page, built like the experience page: overview, itinerary, accommodation and reviews, with a booking card whose price (per person) appears once dates are chosen. There is no packages listing page yet.

## Routes
- `/packages/p/<package id>` (`packageDetail()`), 22 pages. Unknown slugs return 404 on the first request. `/packages` and `packageCategory()` are not pages and nothing links to them (`TODO(listing)`: the "All packages" links on Home and on the destination region pages were hidden until a listing exists).
- Package cards link to the page: Home, the destination and region pages, the Lifestyle pages and the "You might also like" row.

## Data
- One source, `src/mocks/fixtures/catalog/package-sources.ts` (22 packages): the 17 of the Lifestyle pages plus the 5 only Home showed. Home's Tuscany and Maldives cards use the Lifestyle ids (`tuscany-wellness`, `maldives-escape`). Badge and label come from the first Lifestyle page that lists the package, or the Home card; ratings exist only on the Home cards (placeholders).
- `PackageDetail` (`src/interfaces/package.ts`): the experience shape (about, highlights, included, itinerary, reviews, gallery, `includedInAll`, per-person `priceFrom`, `duration`, `groupSize`) with `stays` instead of one hotel. A stay has the property, its nights ("Nights 4–5"), an optional `hotelSlug` and its room types.
- Builder `package-detail-builder.ts`: reuses the experience builder's templates (picked from the package label), then sets the duration, badge, "Package includes" list and stays. Not polished: content is invented. Four packages have several stays (Scottish links 3, Patagonia 2, Kerala 2, Cyclades 2); one has a flexible duration (Tuscany, 3 to 7 nights); the group size is 1 to 12 for all (`PACKAGE_GROUP_SIZE`).
- `getPackage(slug)`, `getSimilarPackages(slug, 3)` (same label first), `getPackageSlugs()` and `getPackageSitemapPaths()` in `src/features/packages/get-package.ts` (`TODO(api)`). Copy, crumbs and metadata in `package-content.ts`.

## Date rule
`StayDuration` (`src/interfaces/detail.ts`): `{ type: "fixed", nights }` (start date only, the end follows) or `{ type: "flexible", minNights?, maxNights? }` (a range as on the hotel page; every date can be picked, and a range outside the minimum and maximum nights keeps the picker open with "Choose a stay of 3–7 nights." and starts no search). Hotels are always flexible. Helpers in `src/helpers/stay-duration.ts`; labels and hints come from the data. A fixed link whose end date is wrong is repaired from the start date (the URL is rewritten); a flexible range outside the limits is invalid (no-dates state). The same rule runs in the booking form, the controller, `GET /api/rooms/availability?type=package` and the checkout stub.

## Page
- Reused from the experience page: shell, gallery with modal, tabs, itinerary, reviews (with the review form and "Load more"), booking card and mobile bar, availability flow. Package wording: tab "Accommodation", "Package includes", "Book this package", "About this package".
- Accommodation: one property looks like the experience page (hotel card, room rows with per-person prices). Several properties: one card per stay in trip order (`PackageStays`), then the rooms under one heading per stay, with the same "From $X per person" or "Select your dates to see prices" as everywhere. A stay links to its hotel page only when that page exists.
- Rooms are display-only; they are chosen in checkout.

## Caching
- `"use cache"`, hours, tag `package:<slug>`. No price or availability in the cached shell.

## SEO
- `urlPolicy` type `detail`, canonical `/packages/p/<slug>`, unique title (title, place and duration label) and description, one h1, breadcrumb Home > Packages (no link) > title with BreadcrumbList JSON-LD, `Product` JSON-LD with no rating and no price. All 22 pages are in the sitemap (thin mock content: review before indexing is switched on).

## Tests
- `src/helpers/stay-duration.test.ts`, `availability-request.test.ts`, `experience-stay.test.ts`, `src/features/packages/get-package.test.ts`, `src/components/sections/package/package-stays.test.tsx`, `rooms-panel.test.tsx` (stays), `booking-flow.test.tsx` (fixed and flexible), `availability-controller.test.tsx` (repair); e2e `package-detail.test.ts`, `package-links.test.ts`, `soft-404.test.ts`, `html-seo.test.ts`.

## Decisions
- [Detail URL scheme](../PROJECT_DECISIONS.md#detail-urls-redirects-and-the-404-guard-decided-2026-11-17), [package page and the date rule](../PROJECT_DECISIONS.md#package-page-and-the-shared-date-rule-decided-2026-11-19).

## Open questions and mocks
- Everything is invented: content, stays, rooms, prices, reviews and the ratings of the Home cards (the review summary shows a mock rating like the experience pages; JSON-LD never does). Whether packages are a Trip Fusion entity, their fields and how a package is priced and checked for availability are unknown.
- How the price of a multi-property package is composed is undecided: its rooms show per-person prices like single-property ones.
- Slugs are the ids ("bali-soul-surf"), not "name + city".

## Changelog
- 2026-11-25: Task 10. Below `md` the photos are a 16:10 hero and one row of 4:3 thumbnails (it replaces the 1, 1, 2 mosaic; `--spacing-mosaic` is gone), and the header reads breadcrumb, Back, Favorite and Share side by side, then the title block (DOM, visual and focus order the same). The header's one column is `minmax(0,1fr)`, so the badge row can no longer stretch it and clip the action buttons. From `md` unchanged.
- 2026-11-25: Detail pages (hotel, experience, package) read header, gallery, tabs in DOM order at every width, with no CSS reordering of the blocks. Below `md` the header is Back, then Favorite and Share side by side, the breadcrumb, the title, the rating and review count, the location, the key facts, then the badges (this replaces the Task 6 gallery-first order; from `md` the badges still sit above the title and the rating at the end of the meta row). Below `md` the gallery is a 4-photo mosaic of 25rem (`h-mosaic`) in rows of 1, 1 and 2, with "View all N photos" on the last tile.
- 2026-11-25: The review list never traps the scroll (reverses the 2026-11-25 containment): below `md` it has no inner box and grows with the page; from `md` the box scrolls inside with `overscroll-behavior: auto` and is a keyboard stop only while it scrolls.
- 2026-11-25: No card (related cards included) says "Select your dates to see prices": a card without dates has no price text and keeps its height (`Price`). The skip-link target `#main` has a scroll margin for the navbar and the docked bar.
- 2026-11-24: Below `lg` the page reads gallery, header, tabs, and below `md` the header reads title, rating and review count, location, then the key facts (CSS `order`, the DOM keeps the header and its h1 first); the rating line wraps its review count below the score on a narrow screen. Task 6 of the Responsively review.
- 2026-11-24: The reserve bar below `lg` shows the dates, travellers and price like the booking card (hotels also the rooms chosen and the total), with an obvious change button; see availability-flow.md.
- 2026-11-24: The docked search bar (the pill from `md` to below `xl`, the row from `xl`) is on this page from the first pixel; the page reserves its 4rem, and the sticky tabs and booking box sit under it. See search.md.
- 2026-11-23: Chip, pill, badge and tab rows are one scrolling line below 1024 (`ScrollRow`); see responsive-testing.md, Chip rows.
- 2026-11-23: One card grid for the site (`CardGrid`, `src/constants/grids.ts`): tiles 1/2/3/4 columns (560/768/1024), listing cards 1/2/3 (640/1280); see responsive-testing.md, Card grids.
- 2026-11-22 (2): "Back to search results" when opened from a result card; compact "You might also like" cards; overlays keep the safe-area insets.
- 2026-11-22: Detail title is 24 px on phones (shared header); the footer gets room under the fixed booking bar.
- 2026-11-19: Removed the availability-only "Included in the package" rooms: every room shows "From $X per person" or "Select your dates to see prices". A flexible range no longer disables days: every date can be picked and the minimum and maximum nights are checked on the range.
- 2026-11-19: Package detail page built (replaces the placeholder), one source of 22 packages, the shared date rule (fixed or flexible), the Home, destination and Lifestyle cards link to it, "All packages" links hidden until a listing exists.
- 2026-11-19: Placeholder detail page `/packages/p/[slug]` added for the Lifestyle packages.
- 2026-11-17: The detail shell (`src/components/sections/detail/`) and `urlPolicy` type `detail` that packages will reuse were built with the hotel detail page ([hotel-detail](hotel-detail.md)).
- 2026-11-17: Doc created, backfilled from the source. Package prices became `{ amount, currency }`; `packageCategory` and `packageDetail` added to `routes.ts`.
- 2026-11-16: Explicit `destinationSlug` on package records (catalog fixtures created this day, file-system date). History before this date not documented (no git history).
