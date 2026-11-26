import { describe, expect, it } from "vitest";
import { DYNAMIC_ROUTES } from "./dynamic-routes";

/*
 * Unknown slugs must return a real 404 on the FIRST request.
 *
 * Why this exists: with Cache Components, if `partialPrefetching` is on (or a `loading.tsx` wraps the page), the first
 * request for a slug that was not prerendered gets the App Shell with status 200 and only later requests get the 404 (a
 * soft 404 that search engines may index). next.config.ts keeps `partialPrefetching: false` and the dynamic-slug routes
 * have no `loading.tsx` for that reason. This test fails if either is reintroduced.
 *
 * It needs a production build (`npm run build`); e2e/global-setup.ts starts the server (see there for the port).
 */
// The built server is started once by e2e/global-setup.ts.
const baseUrl = process.env.E2E_BASE_URL as string;

// A fresh slug per run, so the request below really is the first one for that URL.
const stamp = Date.now().toString(36);
const bad = (label: string) => `not-a-real-${label}-${stamp}`;

// One case per dynamic route (the list is enforced by src/app/page-seo-contract.test.ts), plus two special slugs.
const BAD_ROUTES: [string, string][] = [
  ...Object.entries(DYNAMIC_ROUTES).map(([pattern, route]): [string, string] => [pattern, route.path(bad("slug"))]),
  ["region (destinations/[slug])", DYNAMIC_ROUTES["/destinations/[slug]"].path(`${bad("region")}-and-pacific`)],
  ["malformed slug", DYNAMIC_ROUTES["/destinations/[slug]"].path(`Bad_Slug_${stamp}`)],
];

describe("unknown slugs return a real 404 on the first request", () => {
  it.each(BAD_ROUTES)("%s: %s", async (_label, route) => {
    const first = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
    expect(first.status, `first request to ${route}`).toBe(404);
    expect((await fetch(`${baseUrl}${route}`, { redirect: "manual" })).status, `second request to ${route}`).toBe(404);
  });

  it.each(["/", "/destinations", "/destinations/asia", "/experiences/yoga-retreats", "/hotels/wellness-resorts"])("known page %s still returns 200", async (route) => {
    expect((await fetch(`${baseUrl}${route}`)).status).toBe(200);
  });
});
