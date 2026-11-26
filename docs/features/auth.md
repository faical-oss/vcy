# Auth (dev-only mock login)

Last updated: 2026-11-26

## Purpose
A two-step sign-in dialog (email, then password; Google, Apple and Facebook sign in immediately) backed by a fake session. It exists so the header and the account area can be built; there is no real authentication.

## Routes
- No pages. The dialog opens from the header, or from `?auth=login` / `?auth=signup` (`AuthQueryTrigger`). Sign-out redirects to `ROUTES.home`.

## Data
- Contract `IAuthService`, `Session`, `AuthResult` in `src/interfaces/auth.ts`. `getAuthService()` (`src/services/index.ts`) loads the mock by dynamic import behind the build-time constant `USE_MOCKS`, so a build with mocks off does not bundle it; anything else throws `AuthNotConfiguredError` (the session then reads as signed out).
- Mock: `src/mocks/services/auth.mock.ts`, cookie `vku_dev_session` (httpOnly, 7 days). It throws `MockAuthInProductionError` when `SITE_ENV=production`, on every call.
- Server actions: `src/features/auth/actions.ts` (zod; password minimum `MIN_PASSWORD_LENGTH`), `getCurrentSession()` in `session.ts`, `SessionHeader` in `session-header.tsx`. UI: `src/components/auth/` (`AuthProvider`, `AuthModal`).

## Caching
- The session is request-time data (cookie). `SessionHeader` renders inside `<Suspense>` in the `(site)` layout, so it does not make pages dynamic; the fallback is the signed-out header. Because of that streamed hole every page's HTML is `Cache-Control: private, no-store` even though its shell is prerendered (see [seo-and-caching](seo-and-caching.md)).

## SEO
- None. The dialog is not a page.

## Tests
- `src/mocks/services/auth.mock.test.ts` (including the production guard), `src/features/account/require-session.test.ts`.

## Decisions
- Moving the session client-side was considered and postponed until real auth; the header keeps its Suspense fallback (["Header fallback" in the SEO and caching decisions](../PROJECT_DECISIONS.md#seo-and-caching-foundation-decided-2026-11-17)).
- Details: `docs/API_AND_MOCK_DATA.md`, section "Auth (dev login)"; [account decisions](../PROJECT_DECISIONS.md#account-area-decisions-and-assumptions-not-shown-in-the-prototype).

## Open questions and mocks
- Real provider (Clerk) and keys are not available; the auth scheme, social login and password rules of the real service are unknown. Whether the `next` return URL is protected against open redirects is on the migration security checklist (`../vku-migration/docs/security-checklist.md`); not verified here.
- The social buttons only flip the mock session.

## Changelog
- 2026-11-26: Keep the account mode tabs on one line on narrow mobile screens.
- 2026-11-17: Doc created, backfilled from the source. Sign-out and redirects use `ROUTES.home`.
- 2026-11-12: Mock auth, its production guard and `src/features/auth` created (file-system date). History before this date not documented (no git history).
