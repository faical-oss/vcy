import { DYNAMIC_ROUTES, REGION_SAMPLE, STATIC_ROUTES } from "../dynamic-routes";
import { LIFESTYLE_SLUGS, ROUTES, lifestyleVacation } from "../../src/constants/routes";

/**
 * Every page the responsive suite opens, built from the routes contract (src/constants/routes.ts) and e2e/dynamic-routes.ts.
 * `design` names the screenshot in the "vacayou mobile design" folder that the page is compared with (compare.spec.ts).
 * Checkout stays out: it is a stub, and Checkout 1-9 of the design are kept as a note for later (docs/features/responsive-testing.md).
 */
export interface RouteCase {
  name: string;
  path: string;
  /** Needs the mock dev session (the cookie of src/mocks/services/auth.mock.ts). */
  account?: boolean;
  /** The page answers 404 on purpose. */
  notFound?: boolean;
  design?: string;
}

export const DATES = "checkIn=2099-10-14&checkOut=2099-10-21&adults=2";
export const SEARCH = (type: "hotel" | "experience" | "package") => `${ROUTES.search}?type=${type}&${DATES}`;

const dynamic = Object.entries(DYNAMIC_ROUTES).map(([pattern, route]): RouteCase => ({
  name: pattern,
  path: route.path(route.sample),
  design: pattern === "/experiences/e/[slug]" ? "Experience" : undefined,
}));

export const ROUTE_CASES: RouteCase[] = [
  { name: "home", path: ROUTES.home, design: "Home" },
  ...Object.keys(STATIC_ROUTES)
    .filter((path) => path !== ROUTES.home)
    .map((path): RouteCase => ({ name: path, path })),
  { name: "search hotel", path: SEARCH("hotel"), design: "Search" },
  { name: "search experience", path: SEARCH("experience") },
  { name: "search package", path: SEARCH("package") },
  { name: "search no dates", path: `${ROUTES.search}?type=hotel` },
  { name: "search empty", path: `${SEARCH("hotel")}&mock=none` },
  ...dynamic,
  { name: "/destinations/[region]", path: `${ROUTES.destinations}/${REGION_SAMPLE}` },
  ...LIFESTYLE_SLUGS.filter((slug) => slug !== DYNAMIC_ROUTES["/lifestyle/[slug]"].sample).map((slug): RouteCase => ({ name: `lifestyle ${slug}`, path: lifestyleVacation(slug) })),
  { name: "account", path: ROUTES.account, account: true, design: "Account" },
  { name: "account trips", path: ROUTES.accountTrips, account: true },
  { name: "account favorites", path: ROUTES.favorites, account: true },
  { name: "account preferences", path: ROUTES.accountPreferences, account: true },
  { name: "account profile", path: ROUTES.accountProfile, account: true },
  { name: "404", path: "/no-such-page-responsive", notFound: true },
];
