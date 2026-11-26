# Static pages (Privacy, Terms, Support)

Last updated: 2026-11-17

## Purpose
Three content pages with no data source: the Privacy Policy and the Terms of Use (legal text copied verbatim from the original site) and the Support page (topics and a contact form). Their code is in `src/features/privacy`, `src/features/terms` and `src/features/support`, which hold only the copy.

## Routes
- `ROUTES.privacy` `/privacy`, `ROUTES.terms` `/terms`, `ROUTES.support` `/support` (also "Contact us", `ROUTES.contact`). Pages in `src/app/(site)/{privacy,terms,support}/`.

## Data
- Content constants: `PRIVACY_POLICY` (`src/features/privacy/content.ts`), `TERMS_OF_USE` (`src/features/terms/content.ts`), `SUPPORT_CONTENT` (`src/features/support/content.ts`); types `LegalDocument`, `SupportContent` in `src/interfaces`. No service and no API: content only.
- UI: `src/components/sections/legal/` (`LegalDocument`, `LegalPage`, a sticky "Back / title" bar that goes back, or to `ROUTES.home` when there is no history) and `src/components/sections/support/`.

## Caching
- Fully static content; prerendered with the shell like every page (the header session streams in `<Suspense>`). Nothing cached with tags.

## SEO
- `urlPolicy` type `static`; metadata through `pageSeo()` with a title and description per page. In the sitemap (`STATIC_PATHS`).
- No JSON-LD: the "Back / title" bar is not a breadcrumb trail (it shows no ancestors), so no `BreadcrumbList` is rendered.

## Tests
- `e2e/html-seo.test.ts` (h1, title, description, canonical, robots), `src/app/page-seo-contract.test.ts`, `src/app/sitemap-guard.test.ts`. No unit tests for the content or components.

## Decisions
- [Confirmed decisions](../PROJECT_DECISIONS.md#confirmed-decisions-explicitly-agreed-with-the-user) (scope, source of truth).

## Open questions and mocks
- The Support form does nothing on submit (`handleSubmit` only calls `preventDefault`; a TODO says the support endpoint is not defined). No success or error feedback exists.
- Legal text and its "Last updated: 1 January 2026" line are copied from the original site; whether the legal owner has approved them for the new site is not documented.
- Support copy comes from the Figma frame "Vacayou -Support".

## Changelog
- 2026-11-17: Doc created, backfilled from the source. Metadata now goes through `pageSeo()`; the back button uses `ROUTES.home`.
- 2026-11-12: The three features and pages created (file-system date). History before this date not documented (no git history).
