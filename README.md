# Vacayou web (vku-web)

The B2C travel website for **Vacayou**: wellness and experience travel. Visitors browse hotels, experiences and packages, and
look up rooms and prices for their dates. The backend (Trip Fusion API) is not connected yet: the site runs on mock data.

## Tech stack
Next.js 16.4 (App Router, Turbopack, Cache Components), React 19.3, TypeScript, Tailwind CSS 4, Radix Dialog, Zod. Tests:
Vitest and Testing Library (unit), Vitest against a built server (e2e). Node 22 (`.nvmrc`). Auth: Clerk is planned, not
integrated yet (today a dev-only mock login).

## What is built so far
- **Home**, **Support**, **Privacy**, **Terms**, and an **Account** area (overview, trips, favorites, preferences, profile; mock data).
- **Hotel detail** `/hotels/h/<slug>`: gallery, tabs (overview, rooms, location, reviews), booking card, rooms you select on the page.
- **Experience detail** `/experiences/e/<slug>`: gallery, tabs (overview, itinerary, hotel and rooms, reviews), booking card; rooms are chosen in checkout.
- **Availability flow** (hotels and experiences): prices appear after dates are chosen, availability loads when the dates or travellers panel closes, sold-out rooms, mocked for now.
- **Lifestyle vacations** `/lifestyle/<slug>` (adventure, golf, meditation, spa, yoga): one template, mock content, filterable package cards; the magazine itself stays on vacayou.com.
- **Search box**: tabs (Experiences, Packages, Hotels), type and destination suggestions, dates, travellers; in the Home hero and as a docked bar under the header. It points to the results page `/search` (mock data, filters, sort, list and grid; [docs/features/search.md](docs/features/search.md)).
- **Photo gallery modal** shared by both detail pages (grouped sections, sticky strip, video tile, lightbox).
- **Checkout**: a noindex stub only (flag `FEATURE_CHECKOUT_STUB`). Real checkout and real auth: not built (TBD).

Details per feature: [docs/features/README.md](docs/features/README.md).

## Run it
```bash
nvm use                      # Node 22
npm install
cp .env.example .env.local   # real values never go in git
npm run dev                  # http://localhost:3000 (USE_MOCKS=true by default)
npm run build                # also runs the redirect-map check first
npm run lint
npm run typecheck
npm test                     # unit tests
npm run test:e2e             # after a build: 404s, rendered-HTML SEO checks, detail pages
npm run test:responsive      # Playwright quick run (375, 768, 1280); :full = build + the whole size matrix; :baseline = update screenshots; :report = table (docs/features/responsive-testing.md)
npm run docs:check           # feature code changed without its doc (needs git and a main branch)
```
Environment variables are documented in [.env.example](.env.example). Indexing is off (`noindex`, `Disallow: /`) unless
`INDEXING_ENABLED=true`, which the build refuses with mock data.

## Mock data and `?mock=` scenarios
With `USE_MOCKS=true` the services return fixtures from `src/mocks/`. On the hotel and experience pages, room availability can be
forced with a query parameter, only in a mock build outside production:

| URL parameter | Result |
|---|---|
| `?mock=available` (default) | two room types sold out per search, the rest available |
| `?mock=partial` | every second room sold out |
| `?mock=none` | everything sold out |
| `?mock=error` | the availability call fails (Retry is offered) |

Example: `/hotels/h/azure-spa-and-wellness-resort-krabi?checkIn=2026-12-10&checkOut=2026-12-13&mock=partial`.
Other dev-only flags: `FEATURE_REVIEW_FORM`, `FEATURE_CHECKOUT_STUB` (see `.env.example`).

## Structure (`src/`)
| Folder | Purpose |
|---|---|
| `app/` | Routes only: pages, layouts, route handlers, metadata files (`icon.png` is the favicon) |
| `features/` | Feature-local code: availability, catalog, seo, account, auth, reviews... |
| `components/` | Shared UI and page sections |
| `services/` | Data access, one file per domain; `index.ts` picks real vs mock |
| `interfaces/` | TypeScript contracts and data shapes |
| `hooks/`, `store/` | Client hooks and client state |
| `helpers/`, `constants/` | Pure functions; routes and site config |
| `lib/` | Server infrastructure: env validation, API client, flags |
| `mocks/` | Fixtures and mock services |

Also: `docs/` (documentation), `e2e/` (server-level tests), `scripts/` (docs check, hooks), `public/` (images, hero video).

## Docs
- [docs/features/](docs/features/README.md): one doc per feature, with a changelog (see also [availability-flow.md](docs/features/availability-flow.md)).
- [docs/PROJECT_DECISIONS.md](docs/PROJECT_DECISIONS.md): decisions, gotchas, open questions.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md), [API_AND_MOCK_DATA.md](docs/API_AND_MOCK_DATA.md), [DEVELOPMENT_GUIDELINES.md](docs/DEVELOPMENT_GUIDELINES.md).
- [CLAUDE.md](CLAUDE.md) and [AGENTS.md](AGENTS.md): rules for AI coding sessions.

## Conventions
- **Layers:** `app -> features -> services -> lib`; `components/`, `hooks/` and `store/` never import `services/`, `lib/` or `mocks/` (ESLint enforces it).
- **Routes:** only through the helpers in `src/constants/routes.ts`, never literal paths. Detail pages: `/hotels/h/<slug>` and `/experiences/e/<slug>`.
- **SEO:** metadata from `pageSeo()`, one `h1`, canonical to the clean URL, search and filter variants (`FILTER_PARAMS`, which includes the search parameters) are noindex, JSON-LD from the builders in `src/features/seo/json-ld.ts`, no price in markup unless it is shown on the page. Full list in CLAUDE.md.
- **Prices:** hidden until dates are chosen; availability is fetched in the browser only, never during server rendering.
- **`TODO(api)`:** marks every place that uses mock data or an assumed contract until the real API exists. Search for it to list what is left.
- **Docs:** a feature change updates its `docs/features/<feature>.md` in the same change.

## Not done yet (TBD)
Clerk auth (waiting for keys), Trip Fusion API contract, real checkout, content security policy, redirect map
(empty; launch blocker), CI, Playwright browser e2e, deployment target, license.
