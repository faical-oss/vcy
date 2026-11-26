import type { ImageTheme } from "./images";
import type { Destination, ExperienceCardData, ExperienceCategory, HotelCardData, HotelCategory, PackageCardData } from "@/interfaces";

/** Mock-internal records: a public card plus the tags used to relate it to categories and destinations. */
export interface ExperienceRecord {
  card: ExperienceCardData;
  destination: string;
  /** Category and collection slugs; the first one is the primary category (used for the detail href). */
  categories: string[];
}

export interface HotelRecord {
  card: HotelCardData;
  /** Detail URL slug, `detailSlug(title, place)`. Unlike `card.id` (kept for favorites) it is what the detail route uses. */
  slug: string;
  /** City or area, e.g. "Ubud" (or the destination name when the seed has no place). */
  place: string;
  theme: ImageTheme;
  destination: string;
  /** Type, experience, brand, property, curated and budget-tag slugs; the first one is the primary type. */
  tags: string[];
  /** Nightly "from" price in USD, used for the price-range categories. */
  priceFrom: number;
}

export interface PackageRecord {
  card: PackageCardData;
  /** Explicit destination slug (never parsed from the free-text location). The region is derived from the destination. */
  destinationSlug: string;
}

/** Editorial mock content of a region. Everything but the label is optional and omitted when unknown. */
export interface RegionEditorial {
  /** Menu label; its slug is the region slug. */
  label: string;
  intro?: string;
  bestTimeToVisit?: string;
  averageStay?: string;
}

export interface CatalogData {
  experienceCategories: ExperienceCategory[];
  hotelCategories: HotelCategory[];
  destinations: Destination[];
  experiences: ExperienceRecord[];
  hotels: HotelRecord[];
  packages: PackageRecord[];
  /** Menu order. */
  regions: RegionEditorial[];
  /** Numeric "from" price (USD) per destination slug, so regions can take the minimum without parsing strings. */
  destinationFromPrice: Readonly<Record<string, number>>;
  hotelBudgetRanges: Readonly<Record<string, { min: number; max?: number }>>;
  experienceTopUpAffinity: Readonly<Record<string, readonly string[]>>;
  hotelTopUpAffinity: Readonly<Record<string, readonly string[]>>;
}
