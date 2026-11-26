# API and Mock Data

## Approach
Pages are server components that call a `features/` function, which calls a service (real or mock) and returns typed data to presentational components. `USE_MOCKS` (`src/lib/env.ts` `shouldUseMocks()`, true only when env equals `"true"`) selects mocks. Backend target: Trip Fusion (`TRIPFUSION_API_BASE_URL`, `TRIPFUSION_API_KEY`, `TRIPFUSION_API_VERSION` in `.env.example`; names are placeholders to align with API docs). Never put env values in docs.

## Home content today
`src/features/home/get-home-content.ts` (`"server-only"`) returns `homeFixture` from `src/mocks/fixtures/home/index.ts`. `app/(site)/page.tsx` passes slices to sections as props. This is the single seam to replace with real calls (keep the `HomeContent` return type).

### Fixture files (`src/mocks/fixtures/home/`)
| File | Exports | Type (`src/interfaces/home.ts`) |
|---|---|---|
| `experiences.ts` | `experienceFilters: string[]`, `experiences` (8) | `ExperienceCardData` |
| `packages.ts` | `packages` (8) | `PackageCardData` |
| `hotels.ts` | `hotels` (8) | `HotelCardData` |
| `destinations.ts` | `destinations` (8) | `DestinationSummary` |
| `magazine.ts` | `editorial`, `articles` (4; first is featured) | `EditorialQuote`, `MagazineArticle` |
| `testimonials.ts` | `testimonials` (3) | `Testimonial` |
| `moments.ts` | `moments` (8) | `Moment` |
| `popular-searches.ts` | `popularSearches` (6) | `PopularSearch` (**unused** since 2026-11-19: the Popular chips come from the search box fixture; kept, only `home-links.test.ts` reads it) |
| `assets.ts` | `unsplash()`, `local()`, shared galleries | helpers |
| `index.ts` | `homeFixture: HomeContent` | assembles all |

Card shapes share `id, title, location, rating, reviewCount, href, images[], price` (`price` is `Money` = `{ amount, currency }`, formatted at render time with `formatMoney`; the cached card shows an indicative "from" price); experiences add `category, provider, nights`; packages add `badge, category, provider, highlights[], nights`; hotels add `badge, stars, amenities[]`. Navigation menu data is served by `getNavigation()` (see "Navigation and catalog (mock)"; types in `interfaces/navigation.ts`).

Other fixtures: `mocks/services/search.mock.ts` implements `ISearchService` (`interfaces/search.ts`) over the catalog fixture, with tests (results, prices per dates, availability scenarios via `?mock=`, filters, facets; `TODO(api)`); `fixtures/search-results.ts` is the results page copy (`getSearchResultsContent()`). `fixtures/search.ts` also holds `searchBoxFixture` (the search box's tabs, type lists, destination groups and Popular chips), returned by `getSearchBoxContent()` (`src/features/search/`, `TODO(api)`; type `SearchBoxContent` in `interfaces/search.ts`).

## Replacing mock data with an API
1. Add a service in `src/services/<domain>.service.ts` (`import "server-only"`), implementing an interface from `src/interfaces`, using `createApiClient()` (`src/lib/api/client.ts`).
2. Mirror `services/index.ts` (`getSearchService`): return the mock when `shouldUseMocks()` else the real service.
3. Change `getHomeContent()` to call the services (possibly per section with `"use cache"`), keep `HomeContent` stable so components do not change.
4. Map API DTOs to the interfaces in the service layer, not in components.
5. Swap image URLs to Asset Zen (`i.assetzen.net` is already allowed in `next.config.ts`), then remove the Unsplash host and the `public/images/home` copies.
6. Delete or keep fixtures only for tests/`USE_MOCKS`.

## Conventions
- No content literals in reusable components (section headings/labels like "Featured Experiences" are currently in section components; acceptable until a CMS exists).
- Do not invent API fields: when a new field is needed, add it to the interface and fixture together and flag it to the user as an assumption.
- Image paths: local assets via `local("file")` (`/images/home/...`); remote via allowed hosts only.

## Auth (dev login)
- Contract: `src/interfaces/auth.ts` (`IAuthService`). Email-first two-step form like the original: step 1 email, step 2 password (8+ characters, `MIN_PASSWORD_LENGTH`) plus first name on sign-up; Google/Apple/Facebook sign in immediately. The mock checks the password length only and never stores it.
- Mock: `src/mocks/services/auth.mock.ts` stores a fake session in the httpOnly `vku_dev_session` cookie. It **throws `MockAuthInProductionError` when `SITE_ENV=production`** (checked on every call; covered by `auth.mock.test.ts`).
- `getAuthService()` / `getAccountService()` in `src/services/index.ts` are async and load the mock with a **dynamic import behind a build-time constant** (`process.env.USE_MOCKS`, set from `USE_MOCKS` in `next.config.ts`), so a build with mocks off does not bundle it. Otherwise they throw `AuthNotConfiguredError` (no real provider chosen yet, no Clerk).
- Server actions: `src/features/auth/actions.ts` (zod-validated). UI: `src/components/auth/` (`AuthProvider`, `AuthModal`); the header reads the session in `SessionHeader` inside `<Suspense>` in the `(site)` layout.
- Sign out: `signOutAction` clears the cookie and `redirect("/")`.

## Account (dev data)
Contract: `src/interfaces/account.ts`.

```ts
interface IAccountService {
  getSummary(): Promise<AccountSummary>;            // upcomingTrips, favoritesCount, tier (level, discountPercent, totalLevels, bookingsToNextLevel)
  listBookings(): Promise<Booking[]>;               // ASSUMED shape (prototype only shows the empty state)
  listFavorites(): Promise<Favorite[]>;             // { id, kind: experience|package|hotel, item: <public card data> }
  getPreferences(): Promise<TravelPreferences | null>; // null until first save
  savePreferences(p: TravelPreferences): Promise<void>;
  getProfile(): Promise<AccountProfile>;            // account, newsletter, connectedAccounts
  setNewsletter(subscribed: boolean): Promise<void>;
  setConnectedAccount(provider: AuthProvider, connected: boolean): Promise<void>; // DEV ONLY: flips a flag
  changePassword(input: PasswordChangeInput): Promise<PasswordChangeResult>;      // rules only; never stored or logged
  addFavorite(ref: FavoriteRef): Promise<void>;     // mock only, no UI wired yet
  removeFavorite(ref: FavoriteRef): Promise<void>;
}
```
- Mock: `src/mocks/services/account.mock.ts`. State lives in the httpOnly `vku_dev_account` cookie keyed by the session's user id (survives navigation and reloads). Defaults match the prototype: level 2, 10% discount, 9 bookings to level 3, 0 trips, 0 favorites, newsletter on, nothing connected. Same production guard as the auth mock. Methods throw `NotSignedInError` (`src/lib/account-errors.ts`) without a session.
- Server actions: `src/features/account/actions.ts` (zod; typed results). Reads: `src/features/account/queries.ts` (request-time, `cache()` per request, never cached across users). Guard: `requireSession()` in `src/features/account/require-session.ts`, called by `src/app/(site)/account/layout.tsx`.
- Option lists: `src/constants/preferences.ts` (one typed list per category, stable slug ids).

## Account routes
| Route | View |
|---|---|
| `/account` | Overview (stats, trips preview, favorites preview) |
| `/account/trips` | My trips |
| `/account/favorites` | Favorites |
| `/account/preferences` | 5-step wizard, then summary |
| `/account/profile` | Profile details, newsletter, connected accounts, password |

All are noindex. Signed-out visitors are redirected on the server to `/?auth=login` (the dialog opens, then goes to `/account` after sign-in).

## Navigation and catalog (mock)
Data layer for the data-driven header menus and the category/destination pages (spec: `docs/NAVIGATION_SPEC.md`). **Mock only**: no Trip Fusion endpoint is known, so none is invented. The header (desktop mega menu and mobile accordion) renders `getNavigation()`, called in the `(site)` layout and passed down as `menus`; the old `MAIN_NAV` constant and `MegaMenu`/`MainNavItem` types are gone.

### Files
| Path | Purpose |
|---|---|
| `src/interfaces/navigation.ts` | Added `NavLink.external`, `NavGroup`, `NavFeatured`, `NavMenu`, `NavMenuId`, `INavigationService` |
| `src/interfaces/catalog.ts` | `ExperienceCategory`, `HotelCategory`, `Destination`, `DestinationFacts`, `ExperienceListing`, `HotelListing`, `ExperienceGroupListing`, `HotelGroupListing`, `DestinationListing`, `ICatalogService` |
| `src/constants/routes.ts` | `experienceCategory`, `hotelCategory`, `destination(slug, { category? })`, `experienceDetail`, `hotelDetail`, `EXTERNAL_URLS` (Magazine, Glossary). `ROUTES` keys unchanged |
| `src/helpers/slugify.ts`, `seeded-pick.ts` | Slugs (now drops apostrophes: `editors-picks`, not `editor-s-picks`); FNV-1a hash and deterministic `seededPick` |
| `src/mocks/fixtures/navigation/index.ts` | The four menus (`navigationFixture`): labels from the shared groups, hrefs from the route helpers |
| `src/mocks/fixtures/catalog/` | `categories.ts` (menu groups, registries, budget ranges, top-up affinity), `destinations.ts` (54), `experiences.ts` (24), `hotels.ts` (18), `images.ts` (themed pools), `builders.ts`, `types.ts` (mock-internal tagged records), `index.ts` (`catalogFixture`) |
| `src/mocks/services/navigation.mock.ts`, `catalog.mock.ts` | `mockNavigationService`; `createCatalogService(data)` and `mockCatalogService` (matching, top-up) |
| `src/lib/catalog-errors.ts` | `CatalogNotConfiguredError` |
| `src/services/index.ts` | `getNavigationService()`, `getCatalogService()` (same build-time constant and dynamic import as `getAuthService`; throw `CatalogNotConfiguredError` when mocks are off) |
| `src/features/navigation/get-navigation.ts` | `getNavigation()`, cached |
| `src/features/catalog/get-catalog.ts`, `schemas.ts` | `getExperiencesByCategory(slug)`, `getHotelsByCategory(slug)`, `getDestination(slug, { category? })`, `getExperienceCategorySlugs()`, `getHotelCategorySlugs()`, `getExperienceGroup(slug, category?)`, `getHotelGroup(slug, category?)`, `getExperienceGroupSlugs()`, `getHotelGroupSlugs()`, `getRegion()`, `getDestinationIndex()`, `getRegionSlugs()`, `getDestinationPageSlugs()` (for `generateStaticParams`; derived from the cached header menu because `ICatalogService` has no list call); zod slug validation; cached |

### Shapes
```ts
NavLink     { label; href; external? }
NavGroup    { title; links: NavLink[] }
NavFeatured { title; subtitle?; eyebrow?; price?; priceUnit?; image; href }
NavMenu     { id: "experiences"|"destinations"|"hotels"|"lifestyle"; label; href?; groups: NavGroup[]; layout?: "columns"; featured?; footerLink? }
ExperienceListing  { category; items: ExperienceCardData[]; total }
HotelListing       { category; items: HotelCardData[]; total }
DestinationListing { destination: Destination; category: ExperienceCategory | null; items: ExperienceCardData[]; total }
```
Cards reuse `ExperienceCardData` / `HotelCardData` (Home interfaces unchanged). Tags live in mock-internal records (`fixtures/catalog/types.ts`), never in the public card shapes. Unknown slugs resolve to `null` (pages call `notFound()`).

### Routes
`/experiences/[category]`, `/hotels/[category]`, `/destinations/[slug]?category=<experience-category-slug>`; future details `/experiences/[category]/[slug]` and `/hotels/[category]/[slug]` (category = the item's primary category/type). Magazine and Glossary are external links (`external: true`, new tab). `/experiences/[category]` and `/hotels/[category]` are built (shared pieces in `src/components/sections/listing/`, copy and metadata templates in `src/features/catalog/listing-content.ts`); `/destinations/[slug]` is built too (`?category=` filter rendered on the server; chips are links; `getDestinationSlugs()` and `getDestinationFilterCategories()` read the cached header menu, same workaround as the category slugs). Only the detail routes are not.

### Regions, packages and the destination index (mock)
- **Group listings** (data layer only; pages come later): the left-hand rows of the Experiences and Hotels mega panels link to `/experiences/groups/<slug>` and `/hotels/groups/<slug>` (`experienceGroup()` / `hotelGroup()` in `constants/routes.ts`; the static `groups` segment beats `[category]`, and no category slug is "groups"). Group slug = `slugify(group title)`, derived from `EXPERIENCE_GROUPS` / `HOTEL_GROUPS`; the nav fixture sets it as `NavGroup.href` (Destinations groups still point to region pages). `getExperienceGroup(slug, category?)` / `getHotelGroup(...)` return `{ group: {slug, title}, chips (the group's categories, menu order), active, items, total }` or `null` (unknown, malformed, not configured). Unfiltered = union of each category's REAL matches (no per-category fillers), de-duplicated by card id, best rated first, topped up with `seededPick` (seed = group slug) only when under 3. A valid in-group `?category=` returns exactly the category page's cards; an unknown or out-of-group value is ignored. `getExperienceGroupSlugs()` / `getHotelGroupSlugs()` read the cached menu group hrefs for `generateStaticParams` (placeholder slug when empty). Copy helpers: `GROUP_CONTENT`, `groupCrumbs` (Home > group, no link to `/experiences` or `/hotels`), `experienceGroupMetadata`, `hotelGroupMetadata`, `groupChips` in `listing-content.ts`. Cached like the other reads (`hours`, tag `catalog`). Unfiltered totals: experiences wellness 13, active-and-adventure 13, mind-and-spirit 5, lifestyle-and-culture 8, health-and-fitness 3, curated-for-you 22; hotels by-type 18, by-experience 18, asia-and-pacific 7, europe 4, by-budget 18, curated-for-you 11.
- **Region** (`interfaces/catalog.ts`): `{ slug, name, intro?, bestTimeToVisit?, averageStay?, experienceCount, fromPrice?, heroImage, destinations: DestinationSummary[] }`. Six regions in menu order (`asia, europe, americas, africa-and-middle-east, oceania-and-pacific, indian-ocean`; slug = `slugify(label)`). Computed in `catalog.mock.ts` from the destination registry: `experienceCount` = sum of its destinations' counts (UI formats with `formatCount`, "1,435+"), `fromPrice` = minimum of the numeric prices (`CatalogData.destinationFromPrice`, built from the same rows as `Destination.fromPrice`), `heroImage` = hero of its biggest destination. Each destination has ONE region, so Indian Ocean holds only Seychelles, Mauritius, Réunion and Madagascar (100+), while Maldives, Sri Lanka (Asia) and Zanzibar (Africa & Middle East) count there; the menu still lists them under Indian Ocean too.
- **Hide, don't guess:** only Asia has editorial values (`regions.ts`, marked `ASSUMED/reference-prototype editorial mock`); the other regions have no `intro`, `bestTimeToVisit` or `averageStay` (keys omitted).
- **Packages:** `fixtures/catalog/packages.ts` wraps the 8 Home packages as `PackageRecord { card, destinationSlug }` (slug typed by hand, tested against the registry). A package's/hotel's region is derived from its destination, never stored.
- `getRegion(slug): RegionListing | null` = `{ region, destinations, packages, hotels }`, packages/hotels strictly in the region (no top-up, may be empty). `getDestinationIndex({ region? })` = `{ regions, groups, activeRegion }` (unknown region ignored; all regions always listed). `getRegionSlugs()` and `getDestinationPageSlugs()` (destinations from the menu + regions) feed `generateStaticParams` of `/destinations/[slug]`. Region slugs never equal destination slugs (tested), so `getDestination("asia")` is `null`. Cached like the other catalog reads (`hours`, tag `catalog`); soft-fail (null / empty) when no catalog is configured.
- **Nav:** `NavGroup.href?`: destination groups link to `/destinations/<region>` (`destinationRegion()`), experience and hotel groups have no `href` (the `/experiences` and `/hotels` index pages are not built).

### Matching and top-up
- Experiences: items tagged with the category slug (curated items such as `trending-now` are tagged collections). Hotels: tag match (type, experience, brand, property, curated) or nightly price in the range for the four budget slugs (min inclusive, max exclusive). Destination page: items located in the destination, restricted to `?category=` when it is a valid experience category.
- Fewer than 3 related matches (`MIN_RESULTS`): topped up from preference tiers (category page: items sharing a base category of the menu group, then any; destination page: same category and region, same category, same region, any). Within a tier the pick is `seededPick(candidates, seed, n)`: candidates sorted by id, start index and a coprime step both derived from FNV-1a of the seed (the slug, plus `?category=` on destination pages). Same slug, same cards, same order, whatever the fixture order. No `Math.random`.
- Matches are listed best rated first (id as tiebreaker); `total` equals `items.length` (matches plus top-up).

### Caching (Next.js 16 Cache Components, per `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md` and `04-functions/cacheLife.md`, `cacheTag.md`)
- `getNavigation()` is a function-level `"use cache"` with `cacheLife("days")` (revalidate 1 day, expire 1 week) and `cacheTag("navigation")`, so the header does not force routes dynamic. No cookies or headers are read inside it.
- Catalog reads: inner `"use cache"` functions with `cacheLife("hours")` (revalidate 1 hour, expire 1 day) and `cacheTag("catalog")` plus entity tags (`category:<slug>`, `destination:<slug>`, `hotel|experience|package:<card slug>`; see PROJECT_DECISIONS "SEO and caching foundation"). Cards carry indicative "from" prices, hence the shorter profile. Slugs are zod-validated (`^[a-z0-9]+(-[a-z0-9]+)*$`, max 100) before the cached scope so malformed values never create cache entries.
- Invalidate on demand with `revalidateTag("navigation")` / `revalidateTag("catalog")` (server action or route handler). Cache entries are per build and, on serverless, may not persist between requests (see the runtime caching table in the `use cache` doc).
- Tests mock `next/cache` (outside the Next runtime `cacheLife` cannot run).

### Not configured (mocks off)
With `USE_MOCKS` not `true` there is no navigation or catalog client yet, and the site still builds and renders (like auth, which fails soft):
- `getNavigation()` returns `[]` on `CatalogNotConfiguredError` only (other errors propagate), so the header shows logo and account button without menus. Configuration is checked before the `"use cache"` call (an error thrown inside the cached scope crosses the cache boundary and loses its class, found when building with mocks off), so nothing is cached for a missing service.
- `getExperiencesByCategory`, `getHotelsByCategory` and `getDestination` return `null` on that error only (the pages call `notFound()`, a 404). Same pre-check before the cached functions.
- `generateStaticParams` of the three listing routes never returns `[]` (Cache Components rejects it): with an empty menu the slug helpers return the single `PLACEHOLDER_STATIC_SLUG` (`not-configured`), which resolves to `null`, so that one prerendered page is a 404.
- If a menu has links but none matches `/<base>/<slug>` (href format changed), `readMenuEntries` throws `navigation menu <id> yielded no slugs under /<base>/` instead of silently prerendering nothing. External or other-shaped links in a menu that does have matches are still dropped.

### Swapping in Trip Fusion
Implement `INavigationService` and `ICatalogService` (service classes in `src/services/`, `import "server-only"`, mapping DTOs to these interfaces in one mapper per resource), return them from `getNavigationService()` / `getCatalogService()` when mocks are off, and keep the `features/` functions and return types. The mock keeps serving `USE_MOCKS=true` and the tests.

### ASSUMED (mock data and decisions, to confirm)
- Brands (Six Senses, Aman...) and properties (Chiva-Som, SHA...) are hotel categories for now; the hotel tagged "Chiva-Som Samui" is Chiva-Som in Hua Hin; Lanserhof, Longevity Hotel, Chenot Palace and Safari Lodges have no matching hotel (top-up only). Real brand names appear with invented locations, prices, ratings and amenities.
- Budget boundaries: under $150, $150 to under $300, $300 to under $600, $600 and up. "All-Inclusive" and "Value Packages" are tags.
- Destination facts (best time, stay, counts, prices, intros, subtitles) are placeholders. Only Bali (Indonesia · 240+, Apr – Oct, 10 nights, $899), Thailand (Southeast Asia · 310+, Nov – Apr, 9 nights, $749) and Italy (Europe · 190+, Apr – Jun, 8 nights, $749) use reference values. `experienceCount` is a marketing figure, not the length of the mock list.
- `Destination.region` is the menu region where the destination first appears (Maldives and Sri Lanka: Asia; Zanzibar: Africa & Middle East). Bali's name is "Bali" (menu label "Bali, Indonesia", slug `bali-indonesia`).
- Hero images reuse existing assets: the Home destination photo when one exists, otherwise a themed pick (hash of the slug). Photos are not the real places for most destinations, and no cycling-specific image exists (cycling items use countryside photos). Replace with Asset Zen images.
- Invalid or malformed `?category=` is ignored (renders all, `category: null`).
- The featured experience and hotel ("8-Day Mediterranean Wellness Retreat", "Azure Spa & Wellness Resort") exist in the pools and link to their future detail routes; the Bali featured card is a package, so it links to the destination page. These detail routes 404 until built.
- The Lifestyle menu has no `href` (no landing page in the reference).
- Content pools: 24 experiences (6 base categories x 4 over 8 destinations), 18 hotels (3 base types x 6 over 12 destinations), all with invented names, ratings, review counts (not the reference's constant 124), nights and prices. Each card's location ends with its destination's name.
