# Architecture

## Stack (verified in `package.json`)
Next.js 16.4.6 (App Router, Turbopack, `cacheComponents`, `partialPrefetching`), React 19.3.0, TypeScript 5, Tailwind CSS 4.3.3 (`@tailwindcss/turbopack`), `class-variance-authority`, `clsx` + `tailwind-merge` (via `cn()`), `lucide-react`, `zod` 4 (env validation), `server-only`, Vitest 5, ESLint 9 (`eslint-config-next`). Fonts via `next/font/google` in `src/app/fonts.ts`. Node: `.nvmrc` = 22, `engines` >= 22.12.0. No state library yet; no Prettier.

## Folders (`src/`) — actual contents
| Folder | Purpose | Current contents |
|---|---|---|
| `app/` | Routes only | `(site)/layout.tsx` (header, `<main id="main">`, footer, skip link), `(site)/page.tsx` (Home), `layout.tsx`, `fonts.ts`, `globals.css`, `error.tsx`, `not-found.tsx`, `robots.ts`, `sitemap.ts` |
| `features/` | Feature-local, server-side orchestration | `home/get-home-content.ts`, `navigation/get-navigation.ts`, `catalog/get-catalog.ts` (cached reads), `search/get-search-box-content.ts`, `search/get-search-results-content.ts`, `search/search-results.tsx` (the results page controller), `search/results-loader.ts` |
| `components/` | Presentational UI (no data access) | `brand/`, `cards/`, `icons/`, `layout/`, `sections/home/`, `sections/listing/`, `sections/search/` (search box, docked bar, provider, `results/`), `ui/` (incl. `guest-fields.tsx`) |
| `services/` | Server-only data access; `index.ts` picks real vs mock | `search.service.ts`, `search-results.ts` (the browser call), `index.ts` (also `getNavigationService`, `getCatalogService`: mock only) |
| `interfaces/` | **All** TypeScript contracts (no `types/` folder) | `api-client`, `search`, `home`, `navigation`, `catalog`; barrel `index.ts` |
| `hooks/`, `store/` | Client hooks and client state | `use-favorites`, `use-stay`, `use-availability`; `favorites-store`, `stay-store`, `availability-store` (`styles/` is empty) |
| `constants/` | Config data | `routes.ts`, `site.ts`, `navigation.ts` (FOOTER_COLUMNS, LEGAL_LINKS), `grids.ts` (the two card grids), `trust-logos.ts` |
| `helpers/` | Pure functions + tests | `cn.ts`, `format.ts`, `slugify.ts`, `seeded-pick.ts`, `guest-rules.ts`, `search-box.ts`, `search-results.ts`, `fetch-timing.ts`, `docked-search.ts` |
| `lib/` | Server-only infra | `env.ts` (zod), `flags.ts`, `api/client.ts`, `api/errors.ts` |
| `mocks/` | Fixtures + mock services | `fixtures/home/*`, `fixtures/navigation/*`, `fixtures/catalog/*`, `fixtures/search.ts`, `services/search.mock.ts`, `navigation.mock.ts`, `catalog.mock.ts` |

Other: `public/images/home/` (downloaded original assets), `public/videos/hero.mp4`, `e2e/` (server-level Vitest suite, see README), design screenshots in the repo root.

## Layer rules (README + `eslint.config.mjs`)
- Direction: `app -> features -> services -> lib`. `helpers`, `constants`, `interfaces` import nothing from higher layers.
- `components/`, `hooks/`, `store/` must not import `@/services`, `@/lib`, `@/mocks`, `server-only`.
- `services/` and `lib/` start with `import "server-only"`.
- Components depend on `interfaces/`, never on a concrete service.
- Read request-time data inside `<Suspense>`; cache public data with `"use cache"`.
- Non-production builds are `noindex` (`SITE_ENV`, `src/app/layout.tsx`).

## Where new code goes
- **Page/route:** `src/app/(site)/<route>/page.tsx`; fetch data in the page via a `features/<name>/` function, pass props down.
- **Shared UI primitive** (button, pill, price, rating…): `src/components/ui/`. **Card:** `components/cards/`. **Home-only section:** `components/sections/home/`. **Listing pages (category, destination, hotels):** shared `components/sections/listing/` (`ListingHero` with a `size` variant, `ListingBreadcrumb`, `ResultsLine`, `CardGrid`, `ListingEmptyState`, `ListingSkeleton`, `ListingError`); page copy and metadata templates in `features/catalog/listing-content.ts`. Group listing routes `/experiences/groups/[group]` and `/hotels/groups/[group]` (menu group rows) have their data layer (`getExperienceGroup`, `getHotelGroup`, `get*GroupSlugs`) but no page yet. **Header/footer/nav:** `components/layout/`.
- **Interfaces/DTOs:** `src/interfaces/<domain>.ts` and export from `index.ts`.
- **Mock data:** `src/mocks/fixtures/<domain>/<section>.ts`; mock services in `src/mocks/services/`.
- **Client hooks:** `src/hooks/`; client state: `src/store/`.
- **Route paths / site copy / nav data:** `src/constants/`.
- **Design tokens:** only `src/app/globals.css` `@theme`.

## Routing
Per-feature docs (purpose, routes, data, caching, SEO, tests, open questions, changelog) are in `docs/features/`; where this file disagrees with a feature doc, the feature doc is newer.

App Router with a `(site)` route group for marketing pages (shared header/footer); checkout/account are expected to get their own groups later. `ROUTES` in `src/constants/routes.ts` is the single route map. Many hrefs (nav menus, information/partners slugs) are **provisional** and 404 today.

### Experience category page (`app/(site)/experiences/[category]/`)
`page.tsx` reads `params`, calls `getExperiencesByCategory` (null -> `notFound()`) and composes `ListingHero` + `ResultsLine` + `CardGrid` of `ExperienceCard`. `generateStaticParams` uses `getExperienceCategorySlugs()` (read from the cached header menu), so the 46 menu categories are prerendered. Unknown slugs return a real 404 on the first request (no `loading.tsx` on the dynamic-slug routes and `partialPrefetching: false`; see PROJECT_DECISIONS and `e2e/soft-404.test.ts`). The hero image is the first card's first photo (the catalog has no hero image). Metadata: `experienceCategoryMetadata()` (title `<Label>: N experiences to book`), canonical and Open Graph set in `generateMetadata`. Breadcrumb JSON-LD comes from `ListingPageHero`; see `docs/features/seo-and-caching.md`.

### Group pages (`app/(site)/experiences/groups/[group]/`, `app/(site)/hotels/groups/[group]/`)
The left-hand rows of the Experiences and Hotels header panels link to `experienceGroup(slug)` / `hotelGroup(slug)` (`/experiences/groups/<slug>`, `/hotels/groups/<slug>`; the static `groups` segment wins over `[category]`). Each page calls `getExperienceGroup` / `getHotelGroup` (null -> `notFound()`); `generateStaticParams` uses `getExperienceGroupSlugs()` / `getHotelGroupSlugs()`. Like `/destinations/[slug]`, the shell (`ListingHero` with `listingHeroImage` of the unfiltered group, breadcrumb Home > group via `groupCrumbs`) is static, and `?category=<slug>` is read only inside `<Suspense>`: `FilterChips` (links from `groupChips`, ALL first and clearing the param, `scroll={false}`), `ResultsLine`, then `CardGrid` of `ExperienceCard` / `HotelCard` (or `ListingEmptyState`). Metadata never reads `searchParams`; canonical is the unfiltered group URL. The header needs no group-specific code: any `NavGroup.href` makes the desktop row a link and adds "View all <group>" in the mobile accordion.

### Region pages and destination index (built; see `docs/features/destinations.md`)
`/destinations/[slug]` serves both destinations and regions (slugs are disjoint): `resolvePlace` calls `getDestination(slug)` then `getRegion(slug)`, `notFound()` otherwise; `generateStaticParams` uses `getDestinationPageSlugs()`. A region page is `ListingHero` (`breadcrumbVariant="back"`, `ornament`) + `RegionBody` (facts and intro hidden when undefined, "Popular destinations" `CardCarousel`, then `RegionSection`s for packages and hotels, omitted when their list is empty). `/destinations` (built) reads `getDestinationIndex({ region })` from `?region=` only inside `<Suspense>`: hero (`size="index"`) is prerendered, region chips (`FilterChips tone="soft"`, order in `REGION_CHIP_ORDER`) and `DestinationGroup`s stream in; unknown `?region=` means no filter; metadata is static and canonical is `/destinations`. See "Regions, packages and the destination index" in `docs/API_AND_MOCK_DATA.md`.

## State management
Local `useState` for filters, carousels and menus. Shared client state: `store/` (`favorites-store`, `stay-store`, `availability-store`, read through `hooks/`), and the search box state, a context + reducer (`SearchProvider` in `components/sections/search/`, mounted in the `(site)` layout so the hero box and the docked bar share it). Favorites are local-only until an API exists. See [docs/features/search.md](features/search.md).

## Home page composition (`src/app/(site)/page.tsx`)
Order: `Hero` (video + search slot holding `SearchBar`, which includes the Popular chips) → `ExperiencesSection` → `DestinationsSection` (Popular Destinations) → `PackagesSection` → `EditorialBanner` → `MagazineSection` → `HotelsSection` → `TestimonialsSection` (+ #VacayouMoments) → `NewsletterSection`. Header/footer come from the layout.

| Component | Notes |
|---|---|
| `layout/header.tsx`, `main-nav.tsx`, `mobile-menu.tsx`, `nav-item-link.tsx` | Sticky header (65px incl. border). Menus come from `getNavigation()` (cached, fetched in the `(site)` layout and passed down as `menus`, so the header does not make routes dynamic; only the session part sits in `<Suspense>`). Desktop: menus with several groups or a featured card open a mega panel (groups ↔ links of the active group ↔ featured card, optional `footerLink`); the rest (Lifestyle) open a small dropdown. Every item is a real link (`NavItemLink`: `next/link`, or `<a target="_blank" rel="noopener noreferrer">` with a hidden "(opens in a new tab)" for `external`). Mega panel group rows with an `href` (the Destinations regions and the Experiences/Hotels groups) are real links: hover/focus previews, click/Enter navigates and closes, on touch the first tap previews and the second navigates; groups without `href` stay buttons. The mobile accordion keeps toggling rows and adds a "View all <group>" link (`NAV_CONTENT.viewAll`) inside expanded groups that have an `href`. A trigger with `href` is a link (only Destinations), without `href` a button (Experiences, Hotels, Lifestyle). **Mouse:** opens on hover, closes 120ms after leaving, on link click, outside press, blur-out. **Keyboard:** Tab onto a trigger opens its panel; Enter follows a link trigger; ArrowDown (or Space on a link trigger, Enter/Space on a button trigger) moves focus into the panel; Tab then walks groups (roving tabindex: only the active group is a tab stop), its links, `footerLink`, the featured link, then the next trigger; ArrowUp/ArrowDown move between groups, ArrowRight enters the links, ArrowLeft returns to the group; Escape closes and refocuses the trigger (without reopening). **Touch:** first tap on a trigger opens the panel instead of navigating, a second tap follows the link, tapping outside closes. ARIA: `nav` "Main", triggers have `aria-expanded` and `aria-controls` (only while the panel exists), panels are `role="group"` labelled by the menu, the active group has `aria-current`; no `role=menu`. `<lg` uses the fullscreen accordion in `mobile-menu.tsx` from the same data (menu title links to `href`, chevron button toggles; menu → group → links; single-group menus list links directly; footer link and featured card as links; 44px hamburger and close buttons). |
| `sections/home/hero.tsx` | `public/videos/hero.mp4` (autoplay, loop, muted, playsInline), 260px mobile / 310px md+, `object-cover`, 40% black overlay, no background color behind the video (matches original). Search panel overlaps the bottom (`-translate-y-[30px] md:-translate-y-[50px]`). |
| `sections/search/search-bar.tsx` | The search box (`variant="hero"` here, `"docked"` in the layout's `DockedSearch`): tabs, type and destination comboboxes, dates and travellers popovers, Popular chips. Details: [docs/features/search.md](features/search.md). |
| `ui/card-carousel.tsx` | Scroll-snap carousel with prev/next. Card width = `(100% - (cols-1)*1.25rem)/cols` from `--cols` classes (`cols` prop; default 1/2/4 at base/sm/lg; packages 1/2/3) so only whole cards show; arrows move by the visible card count. Cards need `snap-start`; do not give them fixed widths. |
| `ui/image-carousel.tsx` | Fading photo gallery inside cards (arrows on hover, dots). |
| `cards/experience-card.tsx`, `package-card.tsx`, `hotel-card.tsx`, `destination-card.tsx` | Real data cards (see DESIGN_SYSTEM). Title link uses a stretched `after:` overlay; favorite button sits above it. |
| `magazine-section.tsx` | Featured card (3/4 image) + three 16:9 cards; author row follows the description (featured pins it to the bottom). |
| `testimonials-section.tsx` | Centered heading with `SunOrnament`, 3 quote cards (initials avatar), #VacayouMoments swipe strip (no arrows, snap, 8 tiles). |
| `layout/footer.tsx` | 4-column links, infinite right-to-left logo marquee (`animate-marquee`, pauses on hover, off for reduced motion) from `constants/trust-logos.ts`. |
| `brand/sun-ornament.tsx` | Shared sunrise ornament (hero, editorial banner, testimonials). Arc on top, rays up. |

## Assets
- Original photos/logos downloaded from the published site: `public/images/home/` (`exp-*`, `dest-*`, `mag-*`, `moment-*`, `trust-*`), referenced through `local()` in `mocks/fixtures/home/assets.ts`.
- Other photos still use the prototype's Unsplash URLs (`unsplash()` helper); `images.unsplash.com` is allowed in `next.config.ts` with a TODO to move to Asset Zen (`i.assetzen.net`, also allowed). `public/` is large (~21 MB images + 8 MB video): compress or host before production.
