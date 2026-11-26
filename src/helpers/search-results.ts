/**
 * The results page and its URL. Pure, so the controller, the filter UI and the tests share one reading and one writing.
 * The search itself (`type`, `category`, `destination`, `q`, dates, guests) is the contract of `search-box` and `stay-url`;
 * this adds `sort`, `minPrice`, `maxPrice`, the group filters (`types`, `stars`, `places`, `amenities`, `board`, `duration`, `groupSize`, `difficulty`: comma-separated
 * slugs; `rating`: 3-5), `view` and `page`. Defaults are left out of the URL.
 */
import type { SearchFilters, SearchGuests, SearchParams, SearchSort } from "@/interfaces";
import { normalizeGuests } from "./guest-rules";
import { SEARCH_TABS } from "./search-box";
import { isIsoDate, nightsBetween, STAY_LIMITS } from "./stay-params";
import { readStayFromSearch } from "./stay-url";

export const PAGE_SIZE = 12;
export const PRICE_BOUNDS = { min: 0, max: 5000 } as const;
export const SORTS = ["recommended", "price-asc", "price-desc", "top-rated", "stars"] as const satisfies readonly SearchSort[];
export type SearchView = "list" | "grid";

export const GROUPS = ["types", "stars", "places", "amenities", "board", "duration", "groupSize", "difficulty"] as const;
export type FilterGroup = (typeof GROUPS)[number];

export interface ResultsState {
  filters: SearchFilters;
  sort: SearchSort;
  view: SearchView;
  page: number;
}

const RESULT_KEYS = ["sort", "minPrice", "maxPrice", ...GROUPS, "rating", "view", "page"] as const;
const csv = (params: URLSearchParams, key: string) => (params.get(key) ?? "").split(",").filter(Boolean);
const price = (raw: string | null) => (raw !== null && /^\d{1,5}$/.test(raw) ? Number(raw) : undefined);

export function readResultsState(search: string): ResultsState {
  const params = new URLSearchParams(search);
  const sort = SORTS.find((entry) => entry === params.get("sort")) ?? "recommended";
  const page = Number(params.get("page"));
  const rating = Number(params.get("rating"));
  return {
    sort,
    view: params.get("view") === "grid" ? "grid" : "list",
    page: Number.isInteger(page) && page > 1 ? page : 1,
    filters: {
      minPrice: price(params.get("minPrice")),
      maxPrice: price(params.get("maxPrice")),
      types: csv(params, "types"),
      stars: csv(params, "stars").map(Number).filter((value) => value >= 3 && value <= 5),
      places: csv(params, "places"),
      amenities: csv(params, "amenities"),
      board: csv(params, "board"),
      duration: csv(params, "duration"),
      groupSize: csv(params, "groupSize"),
      difficulty: csv(params, "difficulty"),
      rating: rating === 3 || rating === 4 || rating === 5 ? rating : undefined,
    },
  };
}

/** The query string with the results state written in; the search parameters are kept as they are. No leading "?". */
export function writeResultsState(search: string, state: ResultsState): string {
  const params = new URLSearchParams(search);
  for (const key of RESULT_KEYS) params.delete(key);
  const { filters } = state;
  if (state.sort !== "recommended") params.set("sort", state.sort);
  if (state.view === "grid") params.set("view", "grid");
  if (state.page > 1) params.set("page", String(state.page));
  if (filters.minPrice !== undefined && filters.minPrice > PRICE_BOUNDS.min) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined && filters.maxPrice < PRICE_BOUNDS.max) params.set("maxPrice", String(filters.maxPrice));
  for (const group of GROUPS) {
    const values = filters[group] ?? [];
    if (values.length > 0) params.set(group, values.join(","));
  }
  if (filters.rating) params.set("rating", String(filters.rating));
  return params.toString();
}

export const hasFilters = (filters: SearchFilters) => activeFilterCount(filters) > 0;
export function activeFilterCount(filters: SearchFilters): number {
  const price = filters.minPrice !== undefined && filters.minPrice > PRICE_BOUNDS.min || filters.maxPrice !== undefined && filters.maxPrice < PRICE_BOUNDS.max;
  return GROUPS.reduce((sum, group) => sum + (filters[group]?.length ?? 0), 0) + (filters.rating ? 1 : 0) + (price ? 1 : 0);
}

export type QueryRead =
  | { status: "no-type" }
  /** A child without an age, which makes the search incomplete. */
  | { status: "invalid-guests" }
  /** `datesValid` false: the search still runs, without prices and availability. */
  | { status: "ok"; params: SearchParams; datesValid: boolean };

/** The search a results URL asks for. `today` is the current UTC date (YYYY-MM-DD). */
export function readSearchParams(search: string, today: string): QueryRead {
  const params = new URLSearchParams(search);
  const type = SEARCH_TABS.find((entry) => entry === params.get("type"));
  if (!type) return { status: "no-type" };
  const { fields } = readStayFromSearch(search);
  if (fields.childAges.some((age) => age === null)) return { status: "invalid-guests" };
  const guests: SearchGuests = { ...normalizeGuests({ rooms: params.has("rooms") ? fields.rooms : 1, adults: params.has("adults") ? fields.adults : 1, children: fields.children }), childAges: fields.childAges as number[] };
  const { checkIn, checkOut } = fields;
  const nights = isIsoDate(checkIn ?? undefined) && isIsoDate(checkOut ?? undefined) ? nightsBetween(checkIn as string, checkOut as string) : 0;
  const datesValid = !!checkIn && !!checkOut && checkIn >= today && nights >= 1 && nights <= STAY_LIMITS.maxNights;
  const { filters, sort, page } = readResultsState(search);
  return {
    status: "ok",
    datesValid,
    params: {
      type,
      ...(params.get("category") ? { category: params.get("category") as string } : {}),
      ...(params.get("destination") ? { destination: params.get("destination") as string } : {}),
      ...(params.get("q") ? { q: params.get("q") as string } : {}),
      ...(datesValid ? { stay: { checkIn: checkIn as string, checkOut: checkOut as string, flexDays: fields.flexDays } } : {}),
      guests,
      filters,
      sort,
      page,
      pageSize: PAGE_SIZE,
    },
  };
}

/** The request as a URL query (for `GET /api/search`). Empty values are left out. */
export function searchParamsToQuery(params: SearchParams): string {
  const query = new URLSearchParams({ type: params.type });
  if (params.category) query.set("category", params.category);
  if (params.destination) query.set("destination", params.destination);
  if (params.q) query.set("q", params.q);
  if (params.stay) {
    query.set("checkIn", params.stay.checkIn);
    query.set("checkOut", params.stay.checkOut);
    if (params.stay.flexDays) query.set("flex", String(params.stay.flexDays));
  }
  const { rooms, adults, children, childAges } = params.guests;
  query.set("rooms", String(rooms));
  query.set("adults", String(adults));
  query.set("children", String(children));
  if (childAges.length > 0) query.set("childAges", childAges.join(","));
  const tail = writeResultsState("", { filters: params.filters, sort: params.sort, view: "list", page: params.page });
  return tail ? `${query.toString()}&${tail}` : query.toString();
}

/** The request a `GET /api/search` URL asks for, or null when it is not a search. The browser and the route share this. */
export function queryToSearchParams(query: string, today: string): SearchParams | null {
  const read = readSearchParams(query, today);
  return read.status === "ok" ? read.params : null;
}

/** One cache key per distinct request. */
export const resultsKey = (params: SearchParams): string => searchParamsToQuery(params);

/** Page numbers around the current one: 1 … 4 5 6 … 18. */
export function pageWindow(page: number, pages: number): (number | "gap")[] {
  const wanted = new Set([1, pages, page - 1, page, page + 1].filter((entry) => entry >= 1 && entry <= pages));
  const sorted = [...wanted].sort((a, b) => a - b);
  return sorted.flatMap((entry, index) => (index > 0 && entry - sorted[index - 1] > 1 ? ["gap" as const, entry] : [entry]));
}

export type { SearchGuests };
