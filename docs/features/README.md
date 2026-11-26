# Feature docs

One short doc per feature: purpose, routes, data, caching, SEO, tests, decisions, open questions and a changelog. They describe the code as it is; the reasons behind choices live in [PROJECT_DECISIONS.md](../PROJECT_DECISIONS.md) (feature docs link to it, they do not copy it).

The rule that keeps this current is in CLAUDE.md ("Documentation definition of done"): any new or changed feature updates its doc in the same commit (the "Last updated" date, a new changelog line at the top, and the row below).

| Feature | Status | Last updated | Doc |
|---|---|---|---|
| Home | Built, fixtures only (search box navigates to /search) | 2026-11-25 | [home.md](home.md) |
| Destinations (index, country, region) | Built, mock catalog | 2026-11-23 | [destinations.md](destinations.md) |
| Hotels and experiences (category and group pages) | Built, mock catalog | 2026-11-18 | [hotels-and-experiences.md](hotels-and-experiences.md) |
| Hotel detail (and the shared detail shell) | Built, mock content; prices after dates (availability flow); display-only rooms; no checkout | 2026-11-25 | [hotel-detail.md](hotel-detail.md) |
| Availability flow (hotel and experience pages) | Built, mocked (`?mock=` scenarios); real endpoint pending | 2026-11-25 | [availability-flow.md](availability-flow.md) |
| Experience detail | Built, mock content; rooms chosen in checkout (stub only) | 2026-11-25 | [experience-detail.md](experience-detail.md) |
| Lifestyle vacations (5 landing pages) | Built, mock content; magazine stays external | 2026-11-23 | [lifestyle.md](lifestyle.md) |
| Packages | Built, mock content; detail page (no listing page) | 2026-11-25 | [packages.md](packages.md) |
| Catalog (shared data layer) | Built, mock service only | 2026-11-19 | [catalog.md](catalog.md) |
| Navigation (header menus) | Built, mock data | 2026-11-25 | [navigation.md](navigation.md) |
| Account area | Built, mock data and dev login | 2026-11-25 | [account.md](account.md) |
| Auth (dev-only mock login) | Mock only | 2026-11-17 | [auth.md](auth.md) |
| Search | Search box and results page built (mock data) | 2026-11-25 | [search.md](search.md) |
| Static pages (Privacy, Terms, Support) | Built; Support form is a no-op | 2026-11-17 | [static-pages.md](static-pages.md) |
| Responsive testing (Playwright) | Built; quick and full runs, baselines | 2026-11-25 | [responsive-testing.md](responsive-testing.md) |
| SEO and caching foundation | Built; redirect map and CI pending | 2026-11-22 | [seo-and-caching.md](seo-and-caching.md) |

## Template
Copy this into `docs/features/<feature>.md`. Keep it to about one screen and delete sections that do not apply.

```md
# <Feature>

Last updated: YYYY-MM-DD

## Purpose
What the feature does, in two sentences.

## Routes
URL patterns, built through the routes.ts helpers.

## Data
Services and interfaces used, mock vs real, the types.

## Caching
What is cached, the tags, revalidation, and what is live.

## SEO
Indexation type (urlPolicy), metadata, JSON-LD builders used, sitemap entry.

## Tests
The unit and e2e files that cover it.

## Decisions
Links to entries in PROJECT_DECISIONS.md.

## Open questions and mocks
What is still fake or unknown (real API shape, ratings, prices, licences).

## Changelog
- YYYY-MM-DD: what changed and why (newest first; the first date equals "Last updated").
```

## Checks
- `npm test` runs `src/features/feature-docs.test.ts`: every folder under `src/features` has its doc, every doc is listed above with the same date, has a valid "Last updated" line and a changelog entry whose newest date equals it.
- `npm run docs:check` compares with the main branch and fails when feature code changed but its doc did not. Put `docs: none` on its own line in a commit message to skip it for a change that needs no doc. See CLAUDE.md for the commands.
