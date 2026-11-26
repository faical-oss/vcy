/** Catalog contracts behind the category and destination pages. Cards reuse the Home card shapes. */
import type { DestinationSummary, ExperienceCardData, HotelCardData, PackageCardData } from "./home";
import type { ExperienceDetail, HotelDetail } from "./detail";
import type { Money } from "./search";

interface CategoryDescriptor {
  slug: string;
  label: string;
  /** Menu group the category is listed under (e.g. "Wellness", "By Budget"). */
  group: string;
}

export interface ExperienceCategory extends CategoryDescriptor {
  /** A "collection" is a curated set (Trending Now, Editor's Picks...) rather than a kind of experience. */
  kind: "category" | "collection";
}

export type HotelCategoryKind = "type" | "experience" | "brand" | "property" | "budget" | "curated";

export interface HotelCategory extends CategoryDescriptor {
  kind: HotelCategoryKind;
}

export interface DestinationFacts {
  /** e.g. "Apr – Oct". */
  bestTimeToVisit: string;
  /** e.g. "10 nights". */
  averageStay: string;
  /** Number of experiences on offer (shown as "240+"). */
  experienceCount: number;
  /** Lowest "from" price, formatted at render time. */
  fromPrice: Money;
}

export interface Destination extends DestinationFacts {
  slug: string;
  name: string;
  /** Menu region the destination belongs to (e.g. "Asia", "Europe"). */
  region: string;
  country?: string;
  /** e.g. "Indonesia · 240+ experiences". */
  subtitle: string;
  intro: string;
  heroImage: string;
}

/** `total` is `items.length`: related matches first, then any deterministic top-up. */
export interface ExperienceListing {
  category: ExperienceCategory;
  items: ExperienceCardData[];
  total: number;
}

export interface HotelListing {
  category: HotelCategory;
  items: HotelCardData[];
  total: number;
}

export interface GroupRef {
  slug: string;
  title: string;
}

export interface CategoryChip {
  slug: string;
  label: string;
}

interface GroupListingBase {
  /** Menu group (e.g. "Wellness", "Europe"); its slug is `slugify(title)`. */
  group: GroupRef;
  /** The group's own categories in menu order, labelled as in the catalog. */
  chips: CategoryChip[];
  /** The in-group category applied as a filter, or null (all of the group; an unknown or out-of-group category is ignored). */
  active: CategoryChip | null;
  /** `items.length`. */
  total: number;
}

/**
 * Unfiltered: the real matches of every category in the group (de-duplicated, best rated first), topped up
 * deterministically to at least 3 cards. Filtered: exactly the cards of that category's listing.
 */
export interface ExperienceGroupListing extends GroupListingBase {
  items: ExperienceCardData[];
}

export interface HotelGroupListing extends GroupListingBase {
  items: HotelCardData[];
}

export interface DestinationListing {
  destination: Destination;
  /** The experience category applied as a filter, or null when none was given or it was not a valid category. */
  category: ExperienceCategory | null;
  items: ExperienceCardData[];
  total: number;
  /** Always 3: the destination's own packages first, then its region's, then any (deterministic). */
  packages: PackageCardData[];
  /** Always 4, filled the same way. */
  hotels: HotelCardData[];
}

export interface DestinationQuery {
  /** Experience category slug. An unknown slug is ignored (no filter). */
  category?: string;
}

export interface RegionRef {
  slug: string;
  name: string;
}

/**
 * A menu region (Asia, Europe...). Derived from the destinations of that region. Fields without a real value are
 * omitted, never guessed: `intro`, `bestTimeToVisit` and `averageStay` are editorial and may be absent; `fromPrice` is
 * absent when no destination has one.
 */
export interface Region extends RegionRef {
  intro?: string;
  /** e.g. "Oct – Apr". */
  bestTimeToVisit?: string;
  /** e.g. "10 nights". */
  averageStay?: string;
  /** Sum of the experience counts of its destinations (shown with `formatCount`, e.g. "1,300+"). */
  experienceCount: number;
  /** Lowest "from" price of its destinations, formatted at render time. */
  fromPrice?: Money;
  heroImage: string;
  destinations: DestinationSummary[];
}

/** Packages and hotels are strictly those located in the region's destinations: fewer (or none) is fine, nothing is topped up. */
export interface RegionListing {
  region: Region;
  /** Same cards as `region.destinations`. */
  destinations: DestinationSummary[];
  packages: PackageCardData[];
  hotels: HotelCardData[];
}

export interface DestinationIndexGroup {
  region: RegionRef;
  destinations: DestinationSummary[];
}

/** Data of `/destinations`. `regions` always lists every region (filter chips); `groups` only the active one when filtered. */
export interface DestinationIndex {
  regions: RegionRef[];
  groups: DestinationIndexGroup[];
  activeRegion: RegionRef | null;
}

/** Every lookup resolves to null for an unknown slug. */
export interface ICatalogService {
  getExperiencesByCategory(slug: string): Promise<ExperienceListing | null>;
  getHotelsByCategory(slug: string): Promise<HotelListing | null>;
  /** Group pages: `category` narrows to one of the group's categories. Null for an unknown group. */
  getExperienceGroup(slug: string, category?: string): Promise<ExperienceGroupListing | null>;
  getHotelGroup(slug: string, category?: string): Promise<HotelGroupListing | null>;
  getDestination(slug: string, query?: DestinationQuery): Promise<DestinationListing | null>;
  getRegion(slug: string): Promise<RegionListing | null>;
  /** Static content of a hotel detail page (no live price). Null for an unknown slug. */
  getHotel(slug: string): Promise<HotelDetail | null>;
  /** Up to `limit` hotels similar to the given one (same type and place first), never the hotel itself. */
  getSimilarHotels(slug: string, limit: number): Promise<HotelCardData[]>;
  /** Hotel detail slugs, best first, at most `limit` (Infinity for all, used by the sitemap). */
  listHotelSlugs(limit: number): Promise<string[]>;
  /** Static content of an experience detail page (no live price). Null for an unknown slug. */
  getExperience(slug: string): Promise<ExperienceDetail | null>;
  /** Up to `limit` experiences similar to the given one (same category and place first), never the experience itself. */
  getSimilarExperiences(slug: string, limit: number): Promise<ExperienceCardData[]>;
  /** The cards of these experience ids, in the order given; an unknown id is skipped. Used by Home's featured row. */
  getExperienceCards(ids: readonly string[]): Promise<ExperienceCardData[]>;
  /** The cards of these hotel ids (the card id, not the URL slug), in the order given; an unknown id is skipped. Used by Home's featured row. */
  getHotelCards(ids: readonly string[]): Promise<HotelCardData[]>;
  /** Experience detail slugs, best first, at most `limit` (Infinity for all, used by the sitemap). */
  listExperienceSlugs(limit: number): Promise<string[]>;
  /** An unknown region slug is ignored (no filter). */
  getDestinationIndex(regionSlug?: string): Promise<DestinationIndex>;
}
