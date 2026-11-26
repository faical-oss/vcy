// Placeholder shapes: align with the Trip Fusion API docs once received.
import type { MockScenario } from "./detail";
import type { ExperienceCardData, HotelCardData, PackageCardData } from "./home";

export type ProductType = "experience" | "package" | "hotel";

export interface Money {
  amount: number;
  currency: string;
}

/** What the results list is sorted by (`sort` in the URL; "recommended" is the default and is left out of it). */
export type SearchSort = "recommended" | "price-asc" | "price-desc" | "top-rated" | "stars";

/** The sidebar filters. Every field is optional; an empty array filters nothing. Option values are slugs from `SearchFacets`. */
export interface SearchFilters {
  /** Price per night (hotels) or per person, in the currency of the prices. */
  minPrice?: number;
  maxPrice?: number;
  /** Hotel type, or the category of an experience or package. */
  types?: string[];
  /** Hotel class, 3 to 5. */
  stars?: number[];
  /** Destinations (countries or areas). */
  places?: string[];
  amenities?: string[];
  board?: string[];
  /** Experiences and packages: stay length buckets, group size, difficulty. */
  duration?: string[];
  groupSize?: string[];
  difficulty?: string[];
  /** Guest rating floor, 3 to 5: the rating rounded to a whole star (5 = "5 stars only"). */
  rating?: 3 | 4 | 5;
}

export interface SearchGuests {
  rooms: number;
  adults: number;
  children: number;
  /** One age (0-17) per child. */
  childAges: number[];
}

/**
 * What the results page asks for. `stay` is only present when the dates are valid: without it the results come back without
 * prices and availability. TODO(api): align with the Trip Fusion search request once the docs arrive.
 */
export interface SearchParams {
  type: ProductType;
  /** The type picked in the search box (a hotel type, an experience or package category). */
  category?: string;
  destination?: string;
  /** Text typed into the type or destination field but not picked from its list. */
  q?: string;
  stay?: { checkIn: string; checkOut: string; flexDays: number };
  guests: SearchGuests;
  filters: SearchFilters;
  sort: SearchSort;
  /** 1-based. */
  page: number;
  pageSize: number;
}

/** "unknown" while there are no valid dates; "unavailable" only with valid dates. */
export type SearchAvailability = "available" | "unavailable" | "unknown";

/** A result is the card data of its kind (so the cards render it as they do elsewhere) plus its availability. `price` is "from, per night" for hotels and "from, per person" for the rest, and is absent without valid dates or when unavailable. */
export type SearchResultItem = (({ kind: "hotel" } & HotelCardData) | ({ kind: "experience" } & ExperienceCardData & { badge?: string; groupMax?: number; inclusions?: string[] }) | ({ kind: "package" } & PackageCardData)) & { availability: SearchAvailability };

/** The options of each sidebar group, from the results of the search before the sidebar filters (so an option never leads to an empty page on its own). */
export interface SearchFacets {
  types: SearchOption[];
  stars: number[];
  places: SearchOption[];
  amenities: SearchOption[];
  board: SearchOption[];
  duration: SearchOption[];
  groupSize: SearchOption[];
  difficulty: SearchOption[];
}

export interface SearchResponse {
  items: SearchResultItem[];
  /** Results of all pages, after the filters. */
  total: number;
  page: number;
  pageSize: number;
  facets: SearchFacets;
}

export interface ISearchService {
  /** `scenario` is the dev-only `?mock=` scenario of the mock service (available, partial, none, error). */
  search(params: SearchParams, options?: { scenario?: MockScenario }): Promise<SearchResponse>;
}

/** A suggestion in the search box: what the field shows and what the URL carries. */
export interface SearchOption {
  label: string;
  slug: string;
}

/** What one tab of the search box says and offers. */
export interface SearchBoxTab {
  tab: ProductType;
  /** Tab label ("Experiences"). */
  label: string;
  /** What the first field means ("Experience type"): the dropdown title and the hidden part of the field's name. The visible label is the short "What" (`FIELD_NAMES`). */
  typeLabel: string;
  typePlaceholder: string;
  /** "pills" (outlined chips in rows) or "tiles" (two columns of rectangles). */
  typeLayout: "pills" | "tiles";
  types: SearchOption[];
  destinationPlaceholder: string;
  /** What the dates and the travellers fields mean ("Dates", "Check-in and check-out"; "Travellers", "Rooms and guests"): part of their accessible names. */
  datesLabel: string;
  guestsLabel: string;
  /** "Popular:" chips: each fills the type or the destination field. */
  popular: { field: "type" | "destination"; option: SearchOption }[];
}

export interface SearchBoxContent {
  tabs: SearchBoxTab[];
  /** Destination groups, shown in two columns (`column`). */
  destinationGroups: { title: string; column: 1 | 2; options: SearchOption[] }[];
}

/** Copy and structure of the results page: the sort options, and which filter groups each tab has and what they are called. */
export interface SearchResultsContent {
  /** The heading before the browser knows the tab (the server HTML), and the heading of each tab. */
  title: string;
  intro: string;
  headings: Record<ProductType, { title: string; intro: string }>;
  sorts: { value: SearchSort; label: string }[];
  priceTitle: string;
  groups: Record<ProductType, { key: "types" | "stars" | "places" | "amenities" | "board" | "duration" | "groupSize" | "difficulty" | "rating"; title: string }[]>;
  /** The "Rating" rows, best first. */
  ratings: { value: 3 | 4 | 5; label: string }[];
}
