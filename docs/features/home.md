# Home

Last updated: 2026-11-25

## Purpose
The landing page: hero video with the search box (see [search](search.md)), then experiences, popular destinations, packages, an editorial banner, magazine, hotels, testimonials and moments, and a newsletter block. It is built from fixtures and visually matched to the Figma reference.

## Routes
- `/` (`ROUTES.home`), `src/app/(site)/page.tsx`. Links inside the page use `ROUTES` and the catalog route helpers.

## Data
- `getHomeContent()` (`src/features/home/get-home-content.ts`) returns the `homeFixture` (`src/mocks/fixtures/home/`, type `HomeContent` in `src/interfaces/home.ts`). There is no service behind it yet: mock only.
- The hero's search box gets its lists from `getSearchBoxContent()` (`src/features/search/`, see [search](search.md)); `fixtures/home/popular-searches.ts` is no longer used by the page.
- Card prices are `Money` (`{ amount, currency }`), formatted at render time (`formatMoney`).
- Section copy and headings are partly hardcoded in the section components under `src/components/sections/home/` (see Open questions).

## Caching
- Nothing is cached in `getHomeContent()` (it returns a constant). The page is prerendered; the header's session part streams in behind `<Suspense>` in the `(site)` layout.

## SEO
- `urlPolicy` type `home`; metadata through `pageSeo()` with an absolute title (`SITE_NAME – SITE_TAGLINE`) and `SITE_DESCRIPTION`. In the sitemap (`STATIC_PATHS`). No JSON-LD builders are used.
- One `h1` is rendered by the hero (checked by `e2e/html-seo.test.ts`).

## Tests
- `src/mocks/fixtures/home/home-links.test.ts` (destination cards and the now-unused popular searches link to pages that exist).
- `e2e/html-seo.test.ts` (`/`: h1, title, description, canonical, robots).
- `src/app/page-seo-contract.test.ts`, `src/app/sitemap-guard.test.ts`.

## Decisions
- [Confirmed decisions](../PROJECT_DECISIONS.md#confirmed-decisions-explicitly-agreed-with-the-user) (assets, carousels, footer, hero video).
- [Known limitations](../PROJECT_DECISIONS.md#known-limitations--pending-work-confirmed-state).

## Open questions and mocks
- The hero search box only navigates to `/search?...` (a 404 until the results page exists); the newsletter form does nothing on submit (`newsletter-form.tsx` only calls `preventDefault`).
- Experience and hotel cards link to `ROUTES.experiences` and `ROUTES.hotels` (not pages), package cards to `packageDetail(id)` and the magazine cards to `EXTERNAL_URLS.magazine`; those index pages are not built and return 404.
- All ratings, review counts, prices and testimonials are fixtures. Images are Unsplash hotlinks plus local files (licences and hosting not decided).
- Headings and labels of the Home sections are hardcoded in components, not in fixtures.
- Mobile section heights of Experiences, Packages, Hotels and Footer are 22-42px taller than the original (cause not found, per PROJECT_DECISIONS).

## Changelog
- 2026-11-25: No card says "Select your dates to see prices" (a card without a price has no price text and keeps its height).
- 2026-11-24: The newsletter stacks below 640px (text, name, email, button at full width, 44px or more, visible labels), is a row from 640 and sits beside the text only from `xl` (1280).
- 2026-11-23: Chip, pill, badge and tab rows are one scrolling line below 1024 (`ScrollRow`); see responsive-testing.md, Chip rows.
- 2026-11-23: One card grid for the site (`CardGrid`, `src/constants/grids.ts`): tiles 1/2/3/4 columns (560/768/1024), listing cards 1/2/3 (640/1280); see responsive-testing.md, Card grids.
- 2026-11-22: Card carousels show 1.4 cards on phones (the next card peeks in); the moments strip is focusable.
- 2026-11-19: Hero placeholder and static Popular searches replaced by `SearchBar` (Popular chips now live inside it).
- 2026-11-19: The package cards link to their package pages; the "All packages" link was hidden (there is no listing page, `TODO(listing)`).
- 2026-11-19: The magazine cards, "Visit the magazine" and the editorial link go to the external magazine (new tab); they linked to `/magazine`, which is not a page.
- 2026-11-17: Doc created, backfilled from the source. Card hrefs now come from the route helpers; Home destination cards and popular searches link to real pages (they pointed at 404 paths such as `/destinations/asia/bali`); prices are `{ amount, currency }`. See [prices](../PROJECT_DECISIONS.md#seo-and-caching-foundation-decided-2026-11-17).
- 2026-11-11: Home fixtures folder created (file-system date). History before this date not documented (no git history).
