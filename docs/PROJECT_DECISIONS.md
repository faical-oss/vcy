# Project Decisions, Lessons and Open Questions

Per-feature docs (what each feature is and does today, with a changelog) are in [features/README.md](features/README.md); this file is the decisions log.

## Confirmed decisions (explicitly agreed with the user)
- **Scope:** Home page only until told otherwise. Do not modify other pages.
- **Architecture rules** (see README/ESLint) are strict; there is no `types/` folder and no i18n. All contracts in `src/interfaces`.
- **Source of truth:** the published Figma site and local screenshots. Match computed values, not approximations. Figma MCP was skipped by choice (rate limit).
- **Placeholders kept at the time:** the white "Search section" panel remains a placeholder (replaced by the search box on 2026-11-19, see "Search box" below). (The empty white Experience/Package/Hotel cards were later replaced by real cards on the user's request.)
- **Real assets:** use the original site's assets (hero video, photos, footer logos) rather than stock or substitutes; they were downloaded into `public/`.
- **Mock data** is organized per section in `src/mocks/fixtures/home/` and consumed only via props (architecture requirement from the user).
- **Packages and hotels have 8 cards each; experiences 8.** Carousels must never show cut cards (whole-card widths via `--cols`).
- **Moments strip** has no arrows (swipe/scroll only).
- **Magazine/testimonial avatars:** magazine uses a user icon; testimonials show initials (e.g. "RT").
- **Footer logos** scroll as an infinite right-to-left marquee and pause on hover.
- **Hero video** has no background color behind it (original has none).
- **SunOrnament** is rotated so the arc is on top with rays rising (applies everywhere via the shared component).
- **Text colors** were audited against the original (header, main, footer) and match; footer hovers follow the original (white / opacity 60%).
- **No shared white-label UI package** is used; only components Home needs were built.

## Problems already hit (do not repeat)
- `cn()` dropping custom `text-*` size tokens (chips rendered at 16px). Register tokens in `cn.ts`.
- Dev server stale CSS after theme edits; restart it.
- Running `next build` alongside `next dev` conflicts; stop dev first.
- Measuring only heights hid typography errors: compare computed text styles element by element.
- A stray broken edit in `src/components/cards/destination-card.tsx` (invalid `useState` line and client hook imports in a server component) broke the page; it was removed with the user's approval. Re-read files before editing; ask before removing unexpected user edits.
- Hovering and animation cannot be fully verified in the browser pane; ask the user to confirm.
- Port 3000 was occupied; dev ran on 3001.

## Known limitations / pending work (confirmed state)
- Search widget and the fixed secondary bar under the header: built 2026-11-19 (hero search box, docked bar); the `/search` results page is not built.
- Auth (Clerk), CSP, redirects from the SEO map (launch blocker: `vku-migration/seo/redirect-map.csv` is still empty), sitemap index split, Playwright e2e: not done.
- With mocks off, navigation returns no menus and catalog pages 404 instead of failing the build (see API_AND_MOCK_DATA.md, "Not configured").
- Menu hrefs (from the navigation fixture) and footer/information/partner routes are provisional; most targets do not exist. Lifestyle links in the original point to vacayou.com magazine/glossary; the header now uses those external URLs (new tab).
- Images: ~21 MB local + Unsplash hotlinks; move to Asset Zen and optimize. Hero video is 8 MB.
- Mobile section heights for Experiences/Packages/Hotels/Footer are 22-42px taller than the original (cause not found).
- Home headings and labels are hardcoded in section components (fixtures hold card/magazine/testimonial/moment data).

## Open questions / suggestions (not decided)
- Account button label: "Traveller" (screenshots) vs "My Account" (original markup).
- Desktop nav breakpoint: `lg` (current) vs the original's `md` (does not fit at 768px).
- Where/how brand color `#000000` is used (no token; the UI uses `#002C36`).
- Real routes/hrefs, real API shapes (Trip Fusion), final image hosting, real profile URLs for footer social icons.
- Whether tablet should show the full nav; whether hover states need exact verification with the user.

## Group listing routes
- `/experiences/groups/<group>` and `/hotels/groups/<group>` are built (one per header menu group; the `?category=` pill filter was removed later, so a group page is now a plain listing). `/experiences` and `/hotels` themselves are not pages, so the breadcrumb is Home > Experiences|Hotels (plain text) > group.
- Desktop panel group rows are links (hover previews, click navigates and closes); on mobile the row toggles and "View all <group>" links to the group page.

## Routes linked from the header, footer and Home but not built yet
`/destinations` (index) and `/destinations/<slug>` (countries and regions, flat, not `<region>/<country>`) are BUILT.
These return 404 until their pages exist (provisional paths, see `src/constants/routes.ts`):
`/experiences` (and `?type=` filters), `/hotels`, `/packages`, `/magazine`, `/glossary`,
`/information/about-us`, `/information/why-book-with-vacayou`, `/information/travel-insurance`,
`/partners/resorts-and-retreats`, `/partners/tour-providers`, `/partners/hotels-and-spas`, `/partners/list-your-experience`, `/experiences` is the target of every "Explore experiences" / "Browse more" button in the account area.
Built: `/`, `/support` (also serves "Contact us"), `/privacy`, `/terms`, `/account` and its four sub-pages (see API_AND_MOCK_DATA.md).

## Account area: decisions and assumptions (not shown in the prototype)
- Prototype login is **email, then password** (not passwordless); social buttons are UI-only in the mock.
- Each account view is a real route with a shared layout; the layout guard runs on the server. Because the session cookie is request-time data inside `<Suspense>`, the guard's redirect is streamed (HTTP 200 + client-side navigation) rather than a 307; only a skeleton is sent first, never account content. A true 307 would need `src/proxy.ts`.
- ASSUMED (prototype showed only mobile and empty states): desktop layout (vertical sidebar from `lg`, 240px), non-empty `BookingCard`, favorites grid (reuses public cards; heart on public cards is not wired), "Cancel" on edit-preferences (an escape from the wizard), sign-out behaviour (clear cookie, go to Home), category icons in the wizard, edit-preferences entry point, the `?auth=login` deep link and its after-sign-in redirect to `/account`.
- Profile: first name, email and sign-in method are read-only. Connected accounts are a dev-only flag toggle. The mock cannot verify the current password.
- Gold text on white (the "10% discount" label, like the gold CTAs) is below WCAG AA contrast: a brand decision to revisit.

## SEO and caching foundation (decided 2026-11-17)
- **Indexing flag:** `INDEXING_ENABLED=true` is the only switch (meta robots, robots.txt, sitemap, `urlPolicy`), read only through `isIndexingEnabled()` in `src/lib/env.ts`. Off = noindex/nofollow + `Disallow: /` + empty sitemap. It is refused (the build/dev start fails in `next.config.ts`, and `isIndexingEnabled()` throws) when `USE_MOCKS=true` or `SITE_ENV` is not `production`. Build time: going live means a rebuild. `SITE_ENV` no longer controls indexing.
- **Static params:** `STATIC_PARAMS_LIMIT = 100` and `STATIC_PARAMS_SEED` in `src/constants/site.ts`. `staticSlugs()` (get-catalog.ts) returns the first N slugs, or the seed list when the list is empty/unreadable; it never throws and never returns `[]`. Seed slugs are NOT used by the sitemap (`getCatalogSitemapPaths()` has no fallback).
- **Cache tags:** `catalog` and `navigation` (broad) plus entity tags `hotel:<slug>`, `experience:<slug>`, `package:<slug>`, `destination:<slug>`, `category:<slug>` (`src/features/catalog/cache-tags.ts`, max 100 per entry). `cacheLife("hours")` stays as the safety net. `POST /api/revalidate` (header `x-revalidate-secret` = `REVALIDATE_SECRET`; closed when unset) calls `revalidateTag(tag, "max")`, or `{ expire: 0 }` with `"immediate": true`. Who calls it (Trip Fusion webhook vs a schedule) is still open.
- **Soft 404:** with Cache Components the first request for a slug that was not prerendered gets the App Shell with status 200 when `partialPrefetching` is on (the 404 only appears from the second request). `partialPrefetching: false` plus no `loading.tsx` on the dynamic-slug routes makes the first request wait for the page, so `notFound()` returns a real 404 (verified with `curl -I`, guarded by `e2e/soft-404.test.ts`). No proxy needed. Cost: the client prefetches per link instead of one App Shell per route.
- **Prices:** cards and destination/region facts carry `Money` (`{ amount, currency }`); `formatMoney()` formats at render time (`Price`, `destinationStats`, metadata). Header-menu featured cards still use pre-formatted strings (navigation content, not catalog data).
- **`urlPolicy`** (`src/features/seo/url-policy.ts`): URL type -> canonical + robots; every `generateMetadata` uses `pageSeo()`. Filtered variants: canonical = clean path, noindex+follow.
- **Header fallback:** the Suspense fallback is the signed-out header; the account pill has `min-w-40` so the swap does not shift the layout.

## Detail URLs, redirects and the 404 guard (decided 2026-11-17)
- **Detail URL scheme (Option A, provisional):** `/hotels/h/<slug>`, `/experiences/e/<slug>`, `/packages/p/<slug>`. Built ONLY by `hotelDetail`, `experienceDetail` and `packageDetail` in `src/constants/routes.ts` (the markers live in `DETAIL_MARKERS`), so changing the scheme once the old site's URL data is known means editing that section. Slugs: lowercase, readable "<name>-<city>" (`detailSlug()` in `src/helpers/slugify.ts`), unique per kind (fixture tests check format and uniqueness; the existing mock ids are not name+city yet). The detail pages are not built.
- **Redirect map = launch blocker, only when `INDEXING_ENABLED=true`:** `src/features/seo/redirect-map.test.ts` runs as `prebuild` and fails the build when the map (default `../vku-migration/seo/redirect-map.csv`, override `REDIRECT_MAP_PATH`) is missing, has no rows, or has rows that are not 301s to a built page (duplicates, chains, self-redirects, queries). With `E2E_BASE_URL` set it also checks each old URL against a running server (301, then 200 on the target). With indexing off it is skipped. `scripts/build-redirects.ts` is unchanged (still a TODO, waiting for the old URL data); `vku-migration/seo/*.csv` are empty today.
- **404 guard:** `e2e/soft-404.test.ts` (`npm run build && npm run test:e2e`) starts the built server on `E2E_PORT` (default 3199), requests a fresh bad slug on each dynamic route (destination, region, experience and hotel category, experience and hotel group, malformed slug) and expects 404 on the FIRST request. Verified to fail (7 failures) when `partialPrefetching` is switched back on. Future detail pages: the catalog lookup and `notFound()` run before any streamed part; the live price streams in its own Suspense afterwards.
- **Unused components kept for later cleanup:** `DestinationSkeleton` (`src/components/sections/listing/destination-skeleton.tsx`, only its own test uses it) and `ListingSkeleton` (`src/components/sections/listing/listing-skeleton.tsx`, same; `ResultsSkeleton` in that file IS used by the destination page). Both are exercised by `listing.test.tsx`; remove the components and those tests together.

## Filtered variants and the sitemap guard (decided 2026-11-17)
- **Filtered variants are noindex,follow by `X-Robots-Tag` header, always** (independent of `INDEXING_ENABLED`): `headers()` in `next.config.ts` has one rule per parameter of `FILTER_PARAMS` (`src/constants/seo.ts`, the single list also used by `urlPolicy`), matched with `has: [{ type: "query", key }]`, on every path except `/_next/` and `/api/` (`/_next/image?q=75` must not be noindexed). Page metadata stays static (reading `searchParams` in `generateMetadata` would make pages dynamic); the header does not change prerendering or Cache-Control (checked in `e2e/filtered-variants.test.ts`). `?page=` and tracking parameters are not filters. An empty value (`?region=`) is not a filter (Next does not match the rule on an empty value; `urlPolicy` agrees). Add new filter parameters to `FILTER_PARAMS` only (it includes the search parameters `q`, `type`, `destination`); `REQUIRED_FILTER_PARAMS` in `src/test-support/seo-expectations.ts` pins the set so a removal fails a test.
- **Sitemap guard:** `src/app/sitemap-guard.test.ts`: every static public page is in the sitemap or on `NOINDEX_ALLOWLIST` (`src/test-support/site-pages.ts`), every dynamic route has pages in the catalog part, and the sitemap holds only clean, built, unique URLs.
- **Known baseline:** every page response is `Cache-Control: private, no-cache, no-store` with `x-nextjs-prerender: 1` and `x-nextjs-postponed: 1`, because each page has a dynamic hole (the session header). The shell is prerendered, but the HTML is not CDN-cacheable until the session moves out of the layout (see the cookie-free layout decision).

## Hotel detail page (decided 2026-11-17)
- **Shell and routes:** `/hotels/h/[slug]` uses a generic `DetailShell` (header, gallery, tabs, sticky aside, similar row); packages and experiences reuse it. The URL policy type is the existing `detail` (not a new `hotel` type). Hotel slugs are `detailSlug(name, place)`; card ids are kept only for favorites.
- **Tabs:** all four panels are rendered in the HTML (content is indexable) and the active one follows the URL hash; they are not separate URLs.
- **Stay in the URL, price outside the shell:** `checkIn`, `checkOut`, `rooms`, `adults`, `children`, `flex` are read only inside `<Suspense>` (`AvailabilityPanel`, `RoomLivePrice`, `BookingForm`); the page shell stays prerendered. They are in `FILTER_PARAMS`: dated URLs are noindex,follow by header with the clean canonical.
- **Live price cache:** 60 seconds, `cacheLife({ revalidate: 60, expire: 61 })` (a plain TTL: `expire` must be longer than `revalidate`), no tags, key = function arguments (hotel, dates, rooms, adults, children, flexibility, currency; finer than the requested hotel + dates + travellers + currency because the price depends on them). Only fetched for a valid stay (`parseStayParams`). `liveRecheck()` is the uncached call checkout will use; It is not called yet. RESERVE NOW is enabled only with valid dates and a live price and links to a noindex checkout stub, behind `FEATURE_CHECKOUT_STUB` (mocks, not production; otherwise disabled and `/checkout` is a 404).
- **Review form:** a server action behind `isReviewFormEnabled()`: `FEATURE_REVIEW_FORM=true`, mocks on and not production. Off otherwise, and never in production until a reviews API exists. The flag is read when the page is built. Valid submissions are rate-limited (3 per visitor per 10 minutes, in memory per instance: a shared store is required before launch).
- **JSON-LD:** BreadcrumbList and Hotel; no `aggregateRating`, Review or price while `USE_MOCKS=true` (`ratingAllowed()` and `priceAllowed()`).
- **Images:** the first gallery photo is `loading="eager"` + `fetchPriority="high"` because `priority` is deprecated in Next 16.
- **Product decisions (2026-11-17):** the map stays a static placeholder with an "Open in Maps" link; "Watch video" is hidden without a video URL; the back button uses browser history, else `/hotels` (not a page yet); the flexibility chips are hidden; below `lg` the booking box is a sticky bottom bar plus a sheet.
- **Not decided (see the feature doc):** map provider, flexibility semantics, real checkout, real reviews.
- **Hotel detail design match (2026-11-17):** the page follows the Figma prototype screenshots. Prototype copy is used for UI labels; hotel content stays per-hotel mock data. "Free cancellation on most rooms · No prepayment needed" is shown as the prototype has it but is a claim that must come from the API before launch. The flexibility row stays hidden. See the "Design match" section of `docs/features/hotel-detail.md` for token gaps and assumptions.

## Experience detail page (decided 2026-11-18)
- **Route and tabs:** `/experiences/e/<slug>` with the tab in the URL hash, like hotels (the Figma Make spec suggested `/experiences/[slug]?tab=`; we kept the project's detail URL scheme). The slug is the card id. Every tab panel is rendered in the server HTML.
- **Rules:** price per person, fixed duration (a start date sets the end date), group size in one constant (`EXPERIENCE_GROUP_SIZE`): the maximum is enforced, the minimum is a note only. One primary button, "Check availability". Rooms use the hotel page's steppers; the total splits the guests over the chosen rooms (mock rule, `TODO(api)`).
- **Spec deviations:** normal two-click range replaced by one start click (fixed nights); the calendar starts at the current month; keyboard support in the lightbox; Share copies the link or opens the share sheet; the fake video player is a native `<video>` in a modal.

## Rooms are chosen in checkout on experience pages only (decided 2026-11-18, Figma change; hotels excluded)
- **Decision:** experience detail pages do not select rooms; hotel pages still do (steppers, sticky bar, RESERVE NOW gate), as before. Everything below applies to experiences. The booking card (dates, travellers with rooms/adults sync, children with required ages) has one primary button, "Check availability", that opens the checkout route with the stay in the query string. Rooms are chosen in checkout. The Rooms tab shows room cards for information; an optional "Select room" shortcut opens checkout with `roomId` preselected.
- **Prices:** "From $X per night" (hotel) and "From $X per person" (experience). No total depends on a room selection on the page.
- **Shared with hotels:** the room-selection components, helpers and store (`RoomPicker`, `RoomsSummaryBar`, `ReserveGate`, `room-selection`, `guest-rules`, `stay-store`) are rendered on the hotel page; `ExperienceBookingPrice` and `experience-pricing` are exported and tested for checkout.
- **Checkout parameters** (`src/helpers/checkout-params.ts`): `type`, `id`, `checkIn`, `checkOut`, `rooms`, `adults`, `children`, `childAges`, `flex`, optional `roomId`, and for hotels `selection` (rooms chosen on the page). See the feature docs for the table.
- **Server HTML:** every tab panel stays in the HTML for SEO.
- **e2e harness:** `e2e/global-setup.ts` starts `next start` with `NODE_ENV=production`; under vitest's `NODE_ENV=test` Next adds a second `<meta name="robots" content="noindex">` to every page.

## Photo gallery modal (decided 2026-11-18)
- Hotels and experiences share one full-screen gallery modal with groups (`GalleryGroup`), opened from any page photo or "+N more", living in the `#photos` hash (back button closes it) and opening the existing lightbox per photo. Groups are mock data until the API groups images by category. See the "Photo gallery modal" section of the feature docs.

## Availability flow on hotel and experience pages (decided 2026-11-18, reverses on-page room selection)
- **Prices after dates:** no price is shown (booking card, mobile bar, room rows, related cards, JSON-LD offers) until the visitor has a complete, valid search: the booking card and the rows say "Select your dates to see prices"; **a card never does** (decided 2026-11-25): a card without a price has no price text and keeps its height. `fromPrice`/`priceFrom` are optional.
- **One button:** "Check availability" (opens the dates, no call) then "Reserve now" (checkout with the stay) once rooms are available; disabled while loading, none or error (Retry).
- **Reversal:** hotel rooms are no longer selected on the page (steppers, sticky bar, selection gate): the Rooms tab is display-only on both pages, rooms are chosen in checkout. The legacy components stay exported, unused.
- **Client only:** availability is fetched in the browser after hydration (URL search, then the saved stay), never on the server, so the page HTML is identical for every search; canonical is the clean URL and dated URLs are noindex by header. Debounce 400 ms, flush when the travellers dropdown closes, abort stale, cache per request.
- **Mock:** `getRoomAvailability` behind a small `no-store` route; `?mock=available|partial|none|error` in dev only. `TODO(api)` real contract. See `docs/features/availability-flow.md`.

## Availability flow follow-ups (decided 2026-11-18)
- **Picker:** the date picker closes when the range is complete (experiences: after the start date). On mobile the booking sheet stays open and the Rooms tab switch waits until it closes.
- **One state for both buttons:** the booking card and the mobile bar share `useBookingState`; the bar's price area also opens the sheet.
- **No default child age:** "Select age"; a missing age is invalid (no fetch, inline message), in the URL too.
- **Experience adults:** up to the group maximum (12); hotels stay at 9.
- **Sold-out rows:** badge under the name, 4.5:1 text. The pre-hydration flash of the no-dates state is accepted (the server HTML is the same for every search).

## Hotel room selection returns; availability asked on commit (decided 2026-11-18)
- **When to ask:** availability loads when the dates or travellers panel closes (Done, outside click, Escape, or the picker closing itself), not on each change. No debounce is needed.
- **Hotels choose rooms on the page** once rooms are priced (Select room on each available room, stepper, quantities add up to the rooms searched); the booking card shows the rooms chosen and the total instead of "Prices for your dates. Rooms are confirmed at checkout."; Reserve now waits for the choice and the checkout link carries it. This reverses the display-only decision for hotels only. Experiences stay display-only with the checkout note.
- Priced rooms show "From $X per night / per person".


## Lifestyle vacations (decided 2026-11-19)
- **Scope:** the five spec pages at `/lifestyle/<slug>` only. The magazine and glossary stay on vacayou.com (external links, new tab); there is no `/lifestyle` hub, no article, author or category page, and so no Article JSON-LD. The breadcrumb's "Lifestyle" crumb is unlinked, like the group listings' parents.
- **Package cards link to a placeholder page** `/packages/p/<id>` (breadcrumb, title, "coming soon"; updated 2026-11-19, it was first non-clickable). `PackageCard` still takes an optional `href`. Ratings are optional on packages and left out of these cards; the prototype's "4.9 (124)" was a placeholder.
- **Destination tiles** all link to a destination or region page, the nearest one when the place has none (updated 2026-11-19, it was exact matches only). Tile photos are all different.
- **Traveller story band** (not "From the Vacayou Magazine"): no link, because the "story" it pointed to does not exist. The unsourced "24 million Americans play every year" claim was removed from the Golf intro.
- **Filters** are client state (no URL parameter, so no variants to noindex); every card is in the server HTML.
- **Site tokens, not the prototype's:** heading weight 500, `surface`, `surface-blue`, `primary`, `accent`.
- **Gotcha (fixed 2026-11-19):** the Home magazine block linked to `/magazine`, which is not a page. See the next entry.

## Reviews, 404 page, external magazine (decided 2026-11-19)
- **Review form:** one `ReviewForm` for hotels and experiences with a star radio group (`StarRatingInput`). It stays open to everyone: it never asked for a login, and the Favorite-button login pattern was not applied. Fields: rating (required), optional title (max 100), text (20 to 2000). Server-side rules and the rate limit (3 per 10 minutes per IP) are unchanged and repeat the client checks. A submitted review is never added to the list, the aggregate or the JSON-LD.
- **404 page:** one design for the whole site. Unknown slugs use `(site)/not-found.tsx` (inside the site layout); URLs that match no route use the root `not-found.tsx`, which renders the site layout itself. The section links come from the navigation data (`sectionLinks`), so they are always pages the header links to. The first response for an unknown slug is a real 404 as before; for the dynamic routes it is Next's error shell, so the page's h1, header and footer appear when the browser hydrates, not in the raw HTML (unchanged behaviour).
- **Magazine:** lives on vacayou.com. `EXTERNAL_URLS.magazine` and `.glossary` are the only links (header, footer, Home, Lifestyle); `ROUTES.magazine` and `ROUTES.glossary` were removed. External links open in a new tab with `rel="noopener"` (not `noreferrer`, so vacayou.com still sees the referrer) and an "opens in a new tab" hint. `/magazine` has a temporary 307 redirect in `next.config.ts` (`LEGACY_PATHS`), because the final setup (proxy or same-domain routing) is undecided; it is not in the sitemap and there is no local page.
- **Load more reviews (2026-11-19):** the review list is a client component fed with the reviews in the server HTML (the SEO-relevant ones stay there; the aggregate rating and JSON-LD are untouched). Each click asks a server action for the next 10 after the ones shown; reviews made up by the mock service are never in the HTML or JSON-LD. Button and count only exist with mocks outside production until a reviews API exists.

## Package page and the shared date rule (decided 2026-11-19)
- **One date rule for every product:** `StayDuration` = fixed (start date only, end = start + nights) or flexible (range within optional min and max nights). Hotels are always flexible. A fixed link with the wrong end date is **repaired** from the start date, for every fixed product (experiences used to treat it as invalid). A flexible range outside its limits is invalid: every date can be picked (nothing is disabled), the form says "Choose a stay of 3–7 nights." and no search starts.
- **Packages:** `/packages/p/<id>`, one source of 22 (Lifestyle's 17 plus Home's 5 extra; Home's Tuscany and Maldives moved to the Lifestyle ids). Group size 1 to 12 as a per-package value. Flexibility +/- days is kept for fixed and flexible packages.
- **Accommodation:** one property looks like the experience page; several properties get one card and one room list per stay, with the same per-person prices as every page ("From $X per person", or "Select your dates to see prices"). (Updated 2026-11-19: an availability-only mode was tried and removed.) A stay links to its hotel page only when it exists.
- **No packages listing page:** the "All packages" links on Home and on the destination region pages are hidden (`TODO(listing)`), nothing links to `/packages`.
- **Ratings:** packages have no rating in JSON-LD. The review summary on the page is mock content, as on the experience page.
- **Hidden coupling kept, extended:** guest limits still come from the page path (`guestLimitsForPath`): experience and package pages take the group maximum, everything else the hotel limits.

## Search box (decided 2026-11-19)
- **Out of scope:** the `/search` results page. The Search button navigates to `/search?...` through one helper (`SEARCH_TARGET`), so the target changes in one place.
- **URL:** `type` = tab, `category` = picked type, `destination`, `q` = free text, plus the repo's stay names. `type` and `destination` joined `FILTER_PARAMS` (noindex + X-Robots-Tag), like the other filters. `readSearchFromSearch` only accepts `type` = experience|package|hotel.
- **State:** a context + reducer (`SearchProvider`) in the site layout, not `stay-store` (that one is per page and cannot hold tab, type or destination). Switching tab resets all fields. Child age has no default (repo rule), overriding the spec's "2 yrs"; default is 1 adult, 1 room.
- **Dates (2026-11-19):** never empty. Default check-in tomorrow, check-out +2 nights, set in the browser after mount; the search URL always carries both. Destination results come after a 0.5 s skeleton (fake latency until the API exists) and match the start of a word.
- **Also (2026-11-19):** `SearchUrlPrefill` fills the bar from `/search` URLs (the URL wins over held state). Each bar shows the empty state until it has hydrated, because a bar inside Suspense can hydrate after the provider changed. The travellers popover uses the shared hotel limits on every tab (the spec suggests 9 adults, 6 children, 5 rooms; we kept 8 rooms).
- **Docked bar (2026-11-19):** a deny-list (`showsDockedSearch`), not an allow-list: new pages get the bar by default. 404s follow their pathname (no layout flag). Visibility is one mechanism (scroll > 320 px; `/search` from the top). One CSS variable (`--docked-search-h`) offsets sticky elements below it.
- **Popovers:** hand-built (no Radix, Floating UI or react-day-picker); Esc is handled on `document` because Safari does not focus a button on click. Mobile: fields stack, docked bar hidden below `md`.

## Search results page (decided 2026-11-22)
- **Source:** the Figma prototype (`search-results-spec`) is the Vacayou design: used for layout and behaviour, with our tokens and cards for the visuals. Its bugs were not copied (checkboxes that filter nothing, a fake pager, a map with invented counts, "per night" and "per person" for the same price, the tag and stars shown twice).
- **Not built:** Map view (placeholder with invented numbers, needs a map provider or a dependency); the server HTML is the same for every search, so its h1 is "Search results"; in the browser the heading becomes the tab's ("Hotels", "Packages", "Experiences", changed 2026-11-22 at the owner's request) and the count line is client-side.
- **Dates:** missing or invalid dates do not block the search. Results are listed without prices and a banner asks for dates. "Not available for these dates" only with valid dates.
- **Fetching:** in the browser only. One call for quick edits with the same 400 ms (`FETCH_DEBOUNCE_MS`) as the booking box, old requests aborted, stale answers ignored, answers cached by parameters. The API layer is kept to the browser service, `GET /api/search` and one mock function; the route exists because components cannot import mocks and the fixtures must not reach the browser bundle (the availability flow does the same).
- **URL:** everything that changes the results is in the URL (search, filters, sort, view, page); UI-only state is not. The Search button pushes, everything else replaces. A new search starts clean.
- **SEO:** noindex with the canonical on `/search` (no clean page to point at), not in the sitemap, no JSON-LD, no breadcrumb. The noindex allowlist contract test accepts `pageSeo({ type: "search" })` as the noindex source.
- **Filters:** options come from the results of the search (so none leads to an empty page alone); the prototype's two Hotel Type lists and its Star Rating / Rating pair are kept as two groups with clear meanings (hotel class; guest rating rounded). Experiences and Packages groups are an assumption. Prices are filtered and sorted on the dated price when there are dates, on the catalog's indicative price otherwise.
- **Phone:** the prototype's drawer behaviour kept (left panel, dimmed page, Esc and tap to close), plus a focus trap, focus return and a locked page scroll. The list is the only phone view; Sort is in the toolbar.
- **Rooms and checkout:** nothing booking-related was built; cards link to the detail pages with the dates and travellers.
- **Review round (2026-11-22):** the separate Star Rating group was removed (Rating stays); the mock waits 0.5 s and the first search of a page skips the 400 ms debounce (edits keep it); the empty state always offers "Clear all filters"; the toolbar and list card follow the prototype's spacing and type; the catalog got two hotels (20) and the mock uses all 22 packages, so each type has at least 20 results. Map view stays out (decision above).
- **Per-tab design (2026-11-22):** the list card, the filter groups and the toolbar follow the prototype's Hotels, Packages and Experiences screens. The catalog has no data for most of the Packages and Experiences filters (package type, travel style, inclusions, group size, difficulty, included), so the mock assigns values from the prototype's vocabularies. Experience cards show no inclusion chips (no data). Map view is still out.
- **Card sizes (2026-11-22):** the list cards use the prototype's measured sizes, not larger ones. Hotels keep "per night" although the prototype's hotel card says "per person" (the original brief). Experience badge, group size and inclusions are read from the experience detail data.

## Responsive testing (decided 2026-11-22)
- Playwright (`e2e/responsive/`) is a second e2e suite next to the Vitest one: own folder, only `*.spec.ts`, own port (3001; Vitest uses 3199 and refuses 3001). Quick run on the dev server, full run on a production build. Details: [features/responsive-testing.md](features/responsive-testing.md).
- Touch targets are 44x44 on coarse pointers through one global rule (invisible `::after` hit area), not per component. Allowlist: inline text links, footer and breadcrumb text links, image dots.
- The mobile design screenshots are a reference, not a pixel target: they were taken at different widths. Where they conflict with a decision already made (Map, no Sort at phone width, breadcrumbs, filters on the open search) the decision stays and the difference is listed in the feature doc. Checkout 1 to 9 are kept for later.
- Colour contrast of the muted blue and gold tokens fails WCAG AA; it is reported, not changed, until the palette is decided.

## Header navigation and the filters drawer (decided 2026-11-25)
- **A header item only opens its dropdown; it never navigates.** Every trigger is a button; each dropdown ends with a "View all" link to its section (Lifestyle has no section page). All the dropdowns and every link in them are in the server HTML as real links (closed ones are `hidden`), guarded by `e2e/nav-html.test.ts`. This reverses the earlier rule that the Destinations trigger was a link.
- **The filters drawer stays open while a filter changes** and closes only with its button, the close button, Escape or the dimmed area; each change replaces the history entry.
- **`viewport-fit=cover` is exported from `src/app/(site)/layout.tsx`, not the root layout** (2026-11-25): exported from the root layout, every response lost `x-nextjs-prerender: 1`, which `e2e/filtered-variants.test.ts` checks.

## Preferences wizard: activity photo tiles (decided 2026-11-25)
- Step 1 uses photo tiles (design screen 2); the other steps keep chips. Selection data is unchanged.
- No activity photos exist in the repo or the design folders, so every tile uses a neutral gradient until photos are added to `ACTIVITY_IMAGES`. Photos are never hotlinked.
- The account shell's page column below `lg` is `minmax(0,1fr)` (it was an implicit `auto` column that wide content could stretch).

## Mobile round 2 (decided 2026-11-25)
- **Task 10:** below 768 the detail photos are a 16:10 hero plus one row of 4:3 thumbnails (replacing the 1, 1, 2 mosaic) and the header order is breadcrumb, Back, Favorite and Share, title block. Hotel cards no longer show class stars (the class stays as screen-reader text and in the data and JSON-LD `starRating`); the stars remain on the hotel detail header, the experience "Your accommodation" block and the package stays, to be decided.
- **Follow-ups:** the search sheet is the same flat panel under the navbar on phones and tablets (no centred modal) and animates open and closed; on the reserve bar the price sits on the right above the button, and the left side lists the dates, travellers and rooms.
- **Detail order:** header, gallery, tabs in DOM, visual and focus order at every width; no CSS reordering of the blocks. Below 768 the header starts with Back, then Favorite and Share side by side, then the title block (breadcrumb, title, rating and review count, location, key facts, badges), then a 4-photo mosaic (25rem, rows 1-1-2, "View all N photos" on the last tile). This replaces the gallery-first order of Task 6. From 768 the desktop grid is unchanged; at 768 to 1023 the page now reads header then gallery (it was gallery first).
- **Reviews:** a scroll is never trapped (this reverses the Task 7 containment). Below 768 the list grows with the page (no inner box); from 768 the box scrolls inside and chains to the page at its end.
- **Search always visible:** the docked pill is there at every width below 1280 on every page with the docked bar, the full width of the container; phones no longer have a separate `/search` pill. On home and the listing pages it follows the docked bar's rule (it slides in after the hero's own search box).
- **Search sheet:** a card as tall as its content, 90dvh at most, a flat panel directly under the navbar at every width it exists (below 1280; the form is at most 42rem wide and centred in it), with a dimmed backdrop; not a full-screen sheet.
- **Reserve bar:** as tall as its content (rooms one per line, two at most, then "+N more"); `--booking-bar-h` is measured, not fixed.
- **Search tabs:** icon above the label below 400px, beside it from 400px.
- **Account menu:** a 2-column card below 768.

