/**
 * Public route map. Paths here are the NEW site's URLs.
 * TODO: reconcile with seo/redirect-map.csv once the live-site crawl is done
 * (information/* and partners/* slugs below are provisional).
 */
export const ROUTES = {
  home: "/",
  destinations: "/destinations",
  experiences: "/experiences",
  hotels: "/hotels",
  /** Where "View all experiences" and "All hotels" go while `/experiences` and `/hotels` have no index page (they redirect here, see `next.config.ts`). Change them here when the index pages exist. */
  browseExperiences: "/experiences/groups/wellness",
  browseHotels: "/hotels/groups/by-type",
  packages: "/packages",
  lifestyle: "/lifestyle",
  support: "/support",
  search: "/search",
  checkout: "/checkout",
  account: "/account",
  accountTrips: "/account/trips",
  favorites: "/account/favorites",
  accountPreferences: "/account/preferences",
  accountProfile: "/account/profile",
  privacy: "/privacy",
  terms: "/terms",
  about: "/information/about-us",
  whyBook: "/information/why-book-with-vacayou",
  insurance: "/information/travel-insurance",
  /** "Contact us" is served by the Support page. */
  contact: "/support",
  partnerResorts: "/partners/resorts-and-retreats",
  partnerTourProviders: "/partners/tour-providers",
  partnerHotels: "/partners/hotels-and-spas",
  partnerList: "/partners/list-your-experience",
} as const;

/**
 * Magazine and Glossary live on the existing vacayou.com site, so every link to them (header, footer, Home, Lifestyle) uses
 * these URLs and opens in a new tab. Nothing here is a page of this site. TODO: the final setup (proxy or same-domain
 * routing) is not decided; until then `/magazine` redirects to the magazine with a temporary (307) redirect.
 */
/** Old or typed paths that are not pages: `next.config.ts` redirects them (temporarily) to the external site. Never link to these. */
export const LEGACY_PATHS = { magazine: "/magazine" } as const;

export const EXTERNAL_URLS = {
  magazine: "https://vacayou.com/magazine/",
  glossary: "https://vacayou.com/magazine/wellness-glossary/",
} as const;

/**
 * Route helpers for catalog pages. Hrefs are always built from slugs (see `slugify`), never typed by hand.
 * Detail routes are not built yet; the helpers (see "Detail URL scheme" below) fix their shape so the data layer can already link to them.
 */
export function experienceCategory(slug: string): string {
  return `${ROUTES.experiences}/${slug}`;
}

export function hotelCategory(slug: string): string {
  return `${ROUTES.hotels}/${slug}`;
}

/** Listing of one header menu group (e.g. "Wellness"). The static `groups` segment beats `/experiences/[category]`; no category slug is "groups". `?category=<slug>` narrows it. */
export const GROUP_SEGMENT = "groups";

export function experienceGroup(slug: string): string {
  return `${ROUTES.experiences}/${GROUP_SEGMENT}/${slug}`;
}

export function hotelGroup(slug: string): string {
  return `${ROUTES.hotels}/${GROUP_SEGMENT}/${slug}`;
}

/** `category` is an experience category slug; the destination page filters its cards by it. */
export function destination(slug: string, options: { category?: string } = {}): string {
  const path = `${ROUTES.destinations}/${slug}`;
  return options.category ? `${path}?${new URLSearchParams({ category: options.category }).toString()}` : path;
}

/** Region pages share the destination path space (`/destinations/asia`); region and destination slugs never collide. */
export function destinationRegion(slug: string): string {
  return `${ROUTES.destinations}/${slug}`;
}

/**
 * Detail URL scheme (Option A): `/<kind>/<marker>/<slug>`. The one-letter marker keeps detail routes apart from the
 * category routes (`/hotels/[category]`), and the slug alone identifies the item (its category is not in the URL).
 * Every detail URL in the site is built by the three functions below, and `DETAIL_PATTERNS` is the matching list used
 * to check paths, so changing the scheme later means editing this section only. The pages are not built yet.
 */
export const DETAIL_MARKERS = { experience: "e", hotel: "h", package: "p" } as const;

export function experienceDetail(slug: string): string {
  return `${ROUTES.experiences}/${DETAIL_MARKERS.experience}/${slug}`;
}

export function hotelDetail(slug: string): string {
  return `${ROUTES.hotels}/${DETAIL_MARKERS.hotel}/${slug}`;
}

/** Packages follow the same shape as experiences and hotels. The `/packages` index is not built yet (it returns 404); `/packages/p/<slug>` is the package detail page. */
export function packageCategory(slug: string): string {
  return `${ROUTES.packages}/${slug}`;
}

export function packageDetail(slug: string): string {
  return `${ROUTES.packages}/${DETAIL_MARKERS.package}/${slug}`;
}

/** The Lifestyle Vacations landing pages (`/lifestyle/<slug>`). `/lifestyle` itself is not a page. */
export const LIFESTYLE_SLUGS = ["adventure", "golf", "meditation", "spa", "yoga"] as const;
export type LifestyleSlug = (typeof LIFESTYLE_SLUGS)[number];

export function lifestyleVacation(slug: string): string {
  return `${ROUTES.lifestyle}/${slug}`;
}

/** Every URL the site can emit comes from this module; the sitemap and canonicals build absolute URLs from these paths. */
export function absoluteUrl(path: string, siteUrl: string): string {
  return new URL(path, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString();
}

/**
 * Path patterns of the pages that exist today (built, indexable or not). Used to check that a redirect target is a
 * route the site can serve. Whether a given slug exists is a catalog question, answered against a running server.
 */
const SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";
export const BUILT_ROUTE_PATTERNS: readonly RegExp[] = [
  /^\/$/,
  /^\/(destinations|support|privacy|terms|account|search)$/,
  /^\/account\/(trips|favorites|preferences|profile)$/,
  new RegExp(`^/destinations/${SLUG}$`),
  new RegExp(`^/(experiences|hotels)/${SLUG}$`),
  new RegExp(`^/(experiences|hotels)/${GROUP_SEGMENT}/${SLUG}$`),
  new RegExp(`^/hotels/${DETAIL_MARKERS.hotel}/${SLUG}$`),
  new RegExp(`^/experiences/${DETAIL_MARKERS.experience}/${SLUG}$`),
  new RegExp(`^/lifestyle/(${LIFESTYLE_SLUGS.join("|")})$`),
  new RegExp(`^/packages/${DETAIL_MARKERS.package}/${SLUG}$`),
];

export function isBuiltRoute(path: string): boolean {
  return BUILT_ROUTE_PATTERNS.some((pattern) => pattern.test(path));
}
