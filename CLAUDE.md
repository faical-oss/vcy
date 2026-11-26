# CLAUDE.md — vku-web (Vacayou front end)

## Project context
Before any task, read CLAUDE.md and the relevant file in docs/ (ARCHITECTURE.md, DESIGN_SYSTEM.md, API_AND_MOCK_DATA.md, DEVELOPMENT_GUIDELINES.md, PROJECT_DECISIONS.md). They define the stack, layers, tokens, scripts and rules, and they override anything remembered about Next.js. Follow the dependency direction app -> features -> services -> lib. components/, hooks/ and store/ never import services/, lib/ or mocks/.

> Also read `AGENTS.md` (Next.js 16 has breaking changes: check `node_modules/next/dist/docs/` before writing Next code) and `README.md` (layer rules, commands).

## What this is
Front end for the **Vacayou** wellness & active-travel marketplace (migration project; Trip Fusion is the planned backend). Next.js 16.4.6 App Router, React 19.3, TypeScript, Tailwind CSS 4, Turbopack, Cache Components. Users browse experiences, packages, hotels, destinations and the magazine; booking requires login (`FEATURE_FORCED_LOGIN`).

**Status (as of 2026-11-22):** the **Home page** is built and visually matched to the Figma reference; Support, Privacy, Terms and the **Account area** (overview, trips, favorites, preferences, profile; mock data) are built too, and so are the destination pages, Lifestyle pages and the hotel, experience and package detail pages (mock data; see docs/features) (screenshots exist in the repo root). The **search box** (hero and docked bar) and the **`/search` results page** (mock data) are built; checkout is **not built**. Auth is a dev-only mock login (see docs/API_AND_MOCK_DATA.md); real auth (Clerk), CSP, redirects from the SEO map and Playwright e2e are not done (see README "Not done yet").

## Docs index
| File | Contents |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack, folders, layers, where new code goes, Home components |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Tokens, typography, colors, spacing, cards, buttons, verified specs |
| [docs/API_AND_MOCK_DATA.md](docs/API_AND_MOCK_DATA.md) | Mock fixtures, interfaces, how to swap for real API |
| [docs/DEVELOPMENT_GUIDELINES.md](docs/DEVELOPMENT_GUIDELINES.md) | Commands, workflow, Figma comparison, responsive checks, coding standards |
| [docs/PROJECT_DECISIONS.md](docs/PROJECT_DECISIONS.md) | Confirmed decisions, gotchas already hit, open questions |

## Rules for every Claude session
1. Read this file (and the relevant `docs/` file) before starting any task.
2. Inspect the existing implementation before changing it; reuse components, tokens and helpers.
3. Follow the architecture: dependency direction `app -> features -> services -> lib`; `components/`, `hooks/`, `store/` never import `services/`, `lib/` or `mocks/` (ESLint enforces).
4. The original Figma site is the source of truth: https://glad-red-27377678.figma.site/ and the screenshots (`VCY figma` folder on the Desktop; copies in the repo root). Inspect computed CSS in the browser; **never guess** sizes, colors or copy.
5. Do not change unrelated pages or behavior. The current scope has been **Home only**.
6. Verify visual changes with browser automation (built-in browser pane) at desktop/tablet/mobile and read the console.
7. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` after changes.
8. Never invent API responses, design values or business requirements. Ask when something important is missing.
9. Never put content in components: copy and images come from mock data (`src/mocks/fixtures/`) via props. Only short UI chrome (button and field labels, empty-state lines) may live in a component.
10. Update `CLAUDE.md` / `docs/` when you change an architectural decision or convention.
11. Never commit or print secrets. `.env.local` values must not be copied into docs or chat.
12. Before editing a file, re-read it: the user sometimes edits files while a session runs. If an unexpected change blocks the build, ask before removing it.
13. Sticky stack under the header: header `z-40` at `top-0`; docked search bar `z-[35]` at `top-header`; a sticky bar below it (the Lifestyle sub-nav) is `z-30` at `top-[calc(var(--spacing-header)+var(--docked-search-h))]` and reserves the same in `scroll-mt`. `--docked-search-h` is 0 unless the bar shows. See `docs/DESIGN_SYSTEM.md`.
14. Docked search bar: shown on every page except the deny-list. To exclude a page, add its path prefix to `EXCLUDED_PREFIXES` in `src/helpers/docked-search.ts` and a row to `ROUTE_TABLE` in its test (the test fails for a `page.tsx` with no row). Details: `docs/features/search.md`.

## SEO definition of done (every new or changed public page)
A page is not done until:
- Metadata comes from `pageSeo()`/`urlPolicy` (`src/features/seo/url-policy.ts`): unique title and description, canonical to the clean URL. Filter, search and parameter variants are noindex,follow with canonical to the clean page.
- Exactly one `h1`, logical h2/h3 order.
- URLs come only from `src/constants/routes.ts` helpers (links, canonicals, breadcrumbs, sitemap). No hardcoded paths.
- A breadcrumb has a matching `BreadcrumbList` JSON-LD. Other JSON-LD comes from the pure builder functions in `src/features/seo/json-ld.ts`. No `aggregateRating` or `Review` unless the rating is real, and never while `USE_MOCKS=true`. No price in markup unless it equals the price shown on the page (builders take the same `Money` the page formats).
- Unknown slugs return 404 on the FIRST request: the catalog lookup and `notFound()` run before any streamed part. Add the route to `e2e/dynamic-routes.ts` (the soft-404 e2e test).
- Content is cached (`use cache` + tags). Prices and availability are never inside the cached shell.
- Images use `next/image` with alt text. The hero image has `priority`.
- The page is added to the sitemap (through the helper) unless it is noindex.
- Indexing is controlled only by `INDEXING_ENABLED`. Never add a second switch.
- The feature doc is created or updated (`docs/features/<feature>.md`: Last updated, changelog line, README row). See "Documentation definition of done".

What is enforced by tests (`npm test`; `npm run build && npm run test:e2e`):
- Every public `page.tsx` exports `generateMetadata` through `pageSeo()` unless it is on the noindex allowlist in `src/test-support/site-pages.ts`; pages use `ListingPageHero` (`src/features/seo/listing-page-hero.tsx`), which renders the visible breadcrumb and its BreadcrumbList JSON-LD from the same `crumbs`.
- Every page is listed in `e2e/dynamic-routes.ts` (`DYNAMIC_ROUTES`, `STATIC_ROUTES`). The e2e suite then checks, on the built server: unknown slugs are 404 on the first request; the rendered HTML has one h1, one title and description, an absolute clean canonical, robots as `urlPolicy` says, valid JSON-LD, a matching BreadcrumbList, and no ratings with mocks on.
- Filtered variants (the parameters in `src/constants/seo.ts`, `FILTER_PARAMS`) are noindex,follow: `urlPolicy` and the `X-Robots-Tag` header rules in `next.config.ts` both come from that one list (`filter-params.test.ts`, `e2e/filtered-variants.test.ts`). `?page=` is not a filter. Add a new filter parameter in `FILTER_PARAMS` only.
- Every indexable static page is in the sitemap, or on the noindex allowlist (`src/app/sitemap-guard.test.ts`).
- JSON-LD builders (`json-ld.test.ts`): no ratings with mocks on, prices only from `Money`.
- No literal internal path in code (`src/constants/no-hardcoded-paths.test.ts`): use `ROUTES` and the helpers.
Everything else in the list above relies on this section: follow it.

## Documentation definition of done (every new or changed feature)
Each feature has one doc in `docs/features/<feature>.md` (index: `docs/features/README.md`, template at the bottom of that README). A feature change is not done until, in the same commit:
- the doc exists (new feature) or is updated (changed feature), with "Last updated: YYYY-MM-DD" set to today and a new changelog line at the top ("YYYY-MM-DD: what changed and why", linking the decision when there is one);
- its row in `docs/features/README.md` has the same date;
- anything still fake or unknown is under "Open questions and mocks" (do not guess; do not copy PROJECT_DECISIONS, link it).
A decision that is not obvious from the code also goes in `docs/PROJECT_DECISIONS.md`.

Enforced by tests: `npm test` (`src/features/feature-docs.test.ts`: every `src/features/<folder>` has its doc, listed in the README with the same date, valid date, changelog entry) and `npm run docs:check` (feature code or a feature's page changed without its doc; needs git and a `main` branch; run it before each commit, or install the hook: `git config core.hooksPath scripts/hooks`). Escape for a change that needs no doc: a line `docs: none` in the commit message. Not enforced: whether the doc text is accurate or the changelog line is meaningful: that is on you.

## Quick commands (from `package.json`)
```bash
npm install
npm run dev          # next dev; port 3000, or 3001 if 3000 is taken
npm run typecheck    # next typegen && tsc --noEmit
npm run lint         # eslint (includes layering rules); npm run lint:fix
npm test             # vitest run
npm run build
```
No Prettier is configured. Details and gotchas: `docs/DEVELOPMENT_GUIDELINES.md`.
