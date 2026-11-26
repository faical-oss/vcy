# Account area

Last updated: 2026-11-26

## Purpose
The signed-in member area: overview, trips, favorites, travel preferences (a 5-step wizard) and profile. It runs on dev mock data behind a dev-only mock login.

## Routes
- `ROUTES.account` `/account`, `accountTrips`, `favorites` `/account/favorites`, `accountPreferences`, `accountProfile` (`src/constants/routes.ts`); pages in `src/app/(site)/account/`.
- A signed-out visitor is redirected on the server to `/?auth=login&next=<path>` (`redirectToLogin` in `src/features/account/require-session.ts`; `src/proxy.ts` passes the requested path in a header for `/account/*` only). The redirect streams (HTTP 200 plus client navigation), not a 307.

## Data
- Contract `IAccountService` in `src/interfaces/account.ts` (summary, bookings, favorites, preferences, profile, newsletter, connected accounts, password rules). `getAccountService()` returns the mock only when `USE_MOCKS=true`.
- Mock: `src/mocks/services/account.mock.ts`; state in the httpOnly cookie `vku_dev_account`, keyed by the session user. Server actions in `src/features/account/actions.ts` (zod); reads in `queries.ts`; option lists in `src/constants/preferences.ts`.

## Menu below 768
A card with a 2-column grid (`AccountNav`, `max-md:grid`); the Favorites icon is the gold heart with a count badge when the member has saved items (`useFavorites`); Sign out spans both columns under a divider. `round2.spec.ts` checks it at 320 to 1024.

## Preferences wizard: activity tiles
- Step 1 ("What do you like to do on vacation?") is a grid of 20 photo tiles (`activity-tile.tsx`); the other four steps keep the pill `Chip`s. Same store, same ids, same values: `TravelPreferences.experiences` is unchanged.
- Grid `PICK_GRID` in `src/constants/grids.ts`: 1 column below 400, 2 from 400, 3 from 768, 4 from 1024, 5 from 1280, one 12px gap, tiles 16:10.
- A tile is a native checkbox inside a label (Space toggles, the label is the name, the whole tile is the tap target). Selected = gold ring plus a check badge; keyboard focus = an offset outline. The group is named by the "Select all that apply" line; the "N selected" count is `aria-live="polite"`. Transitions are off under `prefers-reduced-motion`.
- The label is white on a bottom scrim (black at 80% at the bottom, 50% halfway up): over a pure white photo that is 12.6:1 at the bottom (limit 4.5:1). Measured over the 20 placeholder photos, the worst case (two-line label on the smallest tile, the brightest 1% of the label band) is 5.2:1 (Dive); with the first 70/25 scrim 11 of the 20 failed, so the scrim was darkened (Task 8b).
- Photos: `ACTIVITY_IMAGES` in `src/constants/activity-images.ts` maps option id to a local WebP (`public/images/activities/`). The 20 files are RANDOM PLACEHOLDERS (picsum seeds, they do not match the labels; see `docs/activity-photo-credits.md`) to be replaced by the designer's photos before launch; a tile with no entry keeps the gradient.
- The account shell's single column below `lg` is `minmax(0,1fr)`, so wide content can no longer stretch the page column.
- Tests: `e2e/responsive/preference-tiles.spec.ts` (320 to 1920), `e2e/responsive/account-pages.spec.ts` (the five pages at 320 to 1024: column inside the viewport, no sideways scroll; the tab row's fades from 768 to 1023, where it still scrolls), `preferences-view.test.tsx`.

## Caching
- Nothing is cached across users. Reads use `cache()` per request, inside `<Suspense>` (layout frame and skeleton are static; identity and the session guard stream). Account pages are still prerendered shells.

## SEO
- Not indexable: `account/layout.tsx` sets `robots: { index: false, follow: false }` and the pages set their own titles. The route is on the noindex allowlist (`src/test-support/site-pages.ts`), so these pages do not use `pageSeo()`, and they are not in the sitemap. No JSON-LD.

## Tests
- `src/features/account/require-session.test.ts`, `src/mocks/services/account.mock.test.ts`, `src/components/account/preferences-view.test.tsx`.
- `src/app/page-seo-contract.test.ts` (allowlist and `index: false` check).

## Decisions
- [Account area: decisions and assumptions](../PROJECT_DECISIONS.md#account-area-decisions-and-assumptions-not-shown-in-the-prototype).
- Routes and data notes: `docs/API_AND_MOCK_DATA.md`, sections "Account (dev data)" and "Account routes".

## Open questions and mocks
- Everything is mock; real auth (Clerk) and the account API are not defined. The shape of a booking is assumed (the prototype shows only the empty state). Desktop layout, favorites grid, cancel in the wizard and sign-out behaviour are assumptions.
- The heart on public cards is not wired to favorites. Connected accounts are a dev-only flag toggle; the mock cannot verify the current password.
- Gold text on white (the "10% discount" label) is below WCAG AA contrast: a brand decision to revisit.
- Every "Explore experiences" and "Browse more" button here points to `/experiences`, which is not built (404).

## Changelog
- 2026-11-26: The 20 preference tiles show random placeholder photos (dev only, WebP under 120 KB, local files, nothing hotlinked); `scripts/fetch-placeholder-activity-photos.mjs` fetched them once. Task 8b.
- 2026-11-25: Below 768 the account menu is a 2-column card (Overview, My trips, Favorites with its count, Preferences, Profile, a divider, then Sign out on its own row; items 44px, uppercase, the active one light blue); from 768 the scrolling row and from 1024 the sidebar are unchanged. `chips.spec.ts` accepts the grid and checks the row's fades by scroll position.
- 2026-11-25: Test only: the chip-row fade check follows the scroll position (a row scrolled to its end has no right fade); new `account-pages.spec.ts`.
- 2026-11-25: Preferences wizard step 1 is a grid of 20 photo tiles (gradient until photos are added); the account shell column below `lg` is `minmax(0,1fr)`.
- 2026-11-23: Chip, pill, badge and tab rows are one scrolling line below 1024 (`ScrollRow`); see responsive-testing.md, Chip rows.
- 2026-11-23: One card grid for the site (`CardGrid`, `src/constants/grids.ts`): tiles 1/2/3/4 columns (560/768/1024), listing cards 1/2/3 (640/1280); see responsive-testing.md, Card grids.
- 2026-11-22: The identity skeleton has the exact height of the loaded text (layout shift).
- 2026-11-17: Doc created, backfilled from the source. Sign-out and the login redirect now use `ROUTES.home`.
- 2026-11-12: Account area and `src/features/account` created (file-system date; assumptions in PROJECT_DECISIONS). History before this date not documented (no git history).
