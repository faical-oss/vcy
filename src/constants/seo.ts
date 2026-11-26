/*
 * Query parameters that make a URL a filtered variant of a page. One list, no imports (next.config.ts imports it), used by:
 *  - urlPolicy (src/features/seo/url-policy.ts): a filtered variant is noindex,follow with the canonical of the clean page;
 *  - the X-Robots-Tag header rules in next.config.ts: the same URLs get `noindex, follow` as a response header, always,
 *    independent of INDEXING_ENABLED (page metadata is static and cannot see the query).
 * src/features/seo/filter-params.test.ts checks both stay in step. Add a new filter parameter here and nowhere else.
 */
export const FILTER_PARAMS = [
  "region", // /destinations?region=
  "category", // destination and group pages ?category=; search: the picked type
  "checkIn",
  "checkOut",
  "room", // detail pages: the room chosen with SELECT ROOM
  "rooms", // detail pages: booking box
  "childAges", // detail pages: booking box, one age per child ("2,5")
  "adults",
  "children",
  "flex", // date flexibility in days
  "mock", // dev-only availability scenario (available, partial, none, error)
  "travellers",
  "sort",
  "minPrice",
  "maxPrice",
  "q", // free-text search query
  "type", // search: the tab (experience, package, hotel)
  "destination", // search: the chosen destination
  "types", // search results: sidebar filters (hotel type or category, hotel class, destinations, amenities, board, guest rating)
  "stars",
  "places",
  "amenities",
  "board",
  "duration",
  "groupSize",
  "difficulty",
  "rating",
  "view", // search results: list or grid
] as const;

export type FilterParam = (typeof FILTER_PARAMS)[number];

/**
 * Pagination is not a filter: `?page=2` stays indexable with a canonical to itself (the page is not built yet). It must
 * never appear in FILTER_PARAMS; src/features/seo/filter-params.test.ts enforces that.
 */
export const PAGINATION_PARAM = "page";

/** Value of the X-Robots-Tag header on a filtered variant. */
export const FILTERED_ROBOTS_HEADER = "noindex, follow";
