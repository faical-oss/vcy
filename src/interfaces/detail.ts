/*
 * Contracts of the detail pages (hotel first; packages and experiences reuse the shell). Static content (`HotelDetail`) is
 * cached; live price and availability (`IAvailabilityService`) are fetched separately and never stored in the cached shell.
 * Placeholder shapes until the Trip Fusion docs arrive.
 */
import type { Money } from "./search";

export interface DetailImage {
  src: string;
  /** Describes the photo for screen readers and search engines. */
  alt: string;
}

export type AmenityIcon = "pool" | "spa" | "yoga" | "dining" | "fitness" | "kids" | "activity" | "service" | "transfer" | "beach" | "nature" | "wellness";

/**
 * One group of photos for the gallery modal ("Overview", a room type, "Pool", "Food"...). The first photo is also its
 * thumbnail in the strip at the top of the modal. `id` is a valid DOM id (the modal scrolls to it).
 */
export interface GalleryGroup {
  id: string;
  title: string;
  thumbnail: DetailImage;
  images: DetailImage[];
  // TODO(api): videos of the property or experience, with a poster image each. Shown first in their section.
  videos?: GalleryVideo[];
}

/** A video inside a gallery group: a poster tile that opens the player. */
export interface GalleryVideo {
  url: string;
  title: string;
  poster: DetailImage;
}

export interface DetailAmenity {
  label: string;
  icon: AmenityIcon;
}

export interface DetailFact {
  label: string;
  value: string;
}

export interface HotelRoom {
  id: string;
  name: string;
  sizeSqm: number;
  bed: string;
  board: string;
  /** Four short feature lines (ticks). */
  features: string[];
  /** Two or three sentences for the room details view. */
  description: string;
  /** Grouped amenities for the room details view (for example Bathroom, Comfort and tech, Food and drink). */
  amenityGroups: { label: string; items: string[] }[];
  /** Most adults one room takes. */
  maxAdults: number;
  /** Most guests (adults and children) one room takes. */
  maxOccupancy: number;
  images: DetailImage[];
  /** Indicative nightly "from" price. Optional: the pages do not show it, prices appear once dates are chosen (room availability). */
  priceFrom?: Money;
}

export interface HotelReview {
  id: string;
  author: string;
  /** Where the reviewer comes from, e.g. "London, UK". */
  location: string;
  /** Short headline of the review. */
  title: string;
  /** ISO date. */
  date: string;
  /** 1 to 5. */
  rating: number;
  text: string;
}

export interface HotelReviews {
  /** 0 to 5, one decimal. */
  overall: number;
  count: number;
  /** Six categories, 0 to 5. */
  categories: { label: string; score: number }[];
  items: HotelReview[];
}

export interface HotelDetail {
  /** Id of the hotel card (favorites refer to it). */
  id: string;
  /** URL slug, built with `detailSlug(name, place)`. */
  slug: string;
  name: string;
  /** Hotel class, 1 to 5. */
  stars: number;
  /** e.g. "Luxury Spa Hotel". */
  badge: string;
  /** Extra filled badges next to the type, e.g. "Top rated". */
  highlights: string[];
  /** Primary hotel type (the category page the breadcrumb links to). */
  type: { slug: string; label: string };
  location: {
    /** "Ubud, Bali, Indonesia". */
    label: string;
    city: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  images: DetailImage[];
  // TODO(api): images grouped by category (rooms, pool, restaurant, lobby...). Absent: the modal shows one "All photos" section.
  galleryGroups?: GalleryGroup[];
  /** Absent when the hotel has no video: the "Watch video" button is then not shown. */
  videoUrl?: string;
  /** Paragraphs of "About the hotel". */
  description: string[];
  amenities: DetailAmenity[];
  /** "Good to know": check-in and out, minimum stay, pets, languages, payment. */
  goodToKnow: DetailFact[];
  /** "All rooms include" list of the booking box (five items). */
  roomsInclude: string[];
  cancellationNote: string;
  /** Indicative "from" price per night. Optional: the page shows no price until dates are chosen. */
  priceFrom?: Money;
  rooms: HotelRoom[];
  /** Location tab: four facts (airport, centre, a nearby beach/lake/station, transfer time) and six nearby attractions. */
  transport: DetailFact[];
  attractions: DetailFact[];
  reviews: HotelReviews;
}

/** A stay to price. */
export interface AvailabilityQuery {
  hotelSlug: string;
  /** ISO dates (YYYY-MM-DD), checkOut after checkIn. */
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  // TODO(api): send the children's ages (`Stay.childAges`) once the real availability request accepts them; the price can depend on them.
  /** ISO 4217. */
  currency: string;
  /** Date flexibility in days (0 = exact dates). Whether the real API supports it is unknown. */
  flexDays: number;
}

export type AvailabilityResult =
  | {
      status: "available";
      nights: number;
      /** The cheapest room, priced for ONE room and the whole stay (and per night). The page multiplies by the rooms the visitor chose. */
      total: Money;
      perNight: Money;
      /** Each room type, priced for ONE room: `total` is for the whole stay. */
      rooms: { roomId: string; total: Money; perNight: Money; /** False when this room type is sold out for the stay (it cannot be chosen). */ available: boolean }[];
    }
  | { status: "unavailable" };

/* ---------- Room availability (one call for hotels and experiences) ---------- */

export type ProductKind = "hotel" | "experience" | "package";

/**
 * How long a stay is, one config for every product (stored in nights, labels come from it):
 *  - `fixed`: the visitor picks the start date only and the end is the start plus `nights`;
 *  - `flexible`: the visitor picks the range, within `minNights` and `maxNights` when given.
 * Hotels are always flexible.
 */
export type StayDuration = { type: "fixed"; nights: number } | { type: "flexible"; minNights?: number; maxNights?: number };

/** Dev-only scenarios of the mock service (`?mock=` on the page URL). */
export type MockScenario = "available" | "partial" | "none" | "error";

/** A complete, valid search. `children` is the count; `childAges` has one age (0-17) per child. */
export interface RoomAvailabilityRequest {
  kind: ProductKind;
  /** The hotel or experience slug. */
  id: string;
  /** ISO dates; for a fixed-duration product the end is the start plus its nights. */
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childAges: number[];
  rooms: number;
}

/** One room type: sold out or not, and its exact price (per night for a hotel room, per person for an experience). */
export interface RoomAvailability {
  roomId: string;
  available: boolean;
  price: Money;
  unit: "night" | "person";
}

export interface RoomAvailabilityResponse {
  rooms: RoomAvailability[];
}

/** Live price and availability. Never cached with the page shell. */
export interface IAvailabilityService {
  /**
   * TODO(api): the real room availability call (dates, adults, children ages, rooms in; per room type availability and price
   * out). `scenario` is for the mock only.
   */
  getRoomAvailability(request: RoomAvailabilityRequest, options?: { scenario?: MockScenario }): Promise<RoomAvailabilityResponse>;
  getHotelAvailability(query: AvailabilityQuery): Promise<AvailabilityResult>;
  /** Live price (per person) and availability of an experience departure. */
  getExperienceAvailability(query: ExperienceAvailabilityQuery): Promise<ExperienceAvailabilityResult>;
}

export interface ReviewInput {
  hotelSlug: string;
  /** 1 to 5. */
  rating: number;
  text: string;
  /** Optional headline of the review. */
  title?: string;
  /** Mock service only (dev `?mock=`): force the outcome. TODO(api): drop with the mock. */
  scenario?: "success" | "error";
}

export type ReviewResult = { ok: true } | { ok: false; code: "invalid_input" | "disabled" | "unavailable" };

/** One more page of the review list: `limit` reviews after the first `offset`. */
export interface ReviewListRequest {
  slug: string;
  offset: number;
  limit: number;
}

export type ReviewListResult = { ok: true; items: HotelReview[] } | { ok: false; code: "unavailable" };

export interface IReviewService {
  submitReview(input: ReviewInput): Promise<ReviewResult>;
  /** TODO(api): the reviews endpoint, newest first. The mock makes reviews up (see review.mock.ts). */
  listReviews(request: ReviewListRequest): Promise<ReviewListResult>;
}

/** State of the "Travelled on this trip?" review form (shared by the form component and its server action). */
export type ReviewFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; code: "invalid_input" | "disabled" | "unavailable" | "rate_limited"; fieldErrors?: { rating?: string; text?: string; title?: string } };

/* ---------- Experience detail ---------- */

export type HighlightIcon = "compass" | "waves" | "utensils" | "sparkles" | "pin" | "star" | "leaf" | "mountain" | "bike" | "sun" | "heart" | "flame";

export interface ExperienceHighlight {
  icon: HighlightIcon;
  text: string;
}

/** A line of "What's included"; `included: false` is shown greyed with a cross. */
export interface ExperienceIncludedItem {
  text: string;
  included: boolean;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  image: DetailImage;
}

/** The stay that comes with the experience ("Your accommodation"). */
export interface ExperienceHotel {
  name: string;
  /** 1 to 5. */
  stars: number;
  location: string;
  description: string;
  /** Short chips. */
  amenities: string[];
  images: DetailImage[];
}

/**
 * Static content of an experience detail page (no live price). Prices are per person; the duration is fixed. The rooms reuse
 * `HotelRoom`, where `priceFrom` is the price PER PERSON for the whole stay. Placeholder shapes until the Trip Fusion docs arrive.
 */
export interface ExperienceDetail {
  /** Id of the experience card (favorites refer to it); also the URL slug for now. */
  id: string;
  slug: string;
  title: string;
  /** Primary category (the page the breadcrumb links to). */
  category: { slug: string; label: string };
  /** For example "Best seller". */
  badge?: string;
  /** Operator or retreat name, shown under the title. */
  provider: string;
  location: { label: string; city: string; country: string };
  /** The usual length: the itinerary has one day per night. For a fixed `duration` it is the duration. */
  nights: number;
  /** How the visitor picks dates (see `StayDuration`); the label shown comes from it. */
  duration: StayDuration;
  /** Fewest and most travellers one departure takes. */
  groupSize: { min: number; max: number };
  images: DetailImage[];
  // TODO(api): images grouped by category (accommodation, activities, food, facilities...). Absent: the modal shows one "All photos" section.
  galleryGroups?: GalleryGroup[];
  /** Absent when there is no video: "Watch video" is then not shown. */
  videoUrl?: string;
  about: string[];
  highlights: ExperienceHighlight[];
  included: ExperienceIncludedItem[];
  itinerary: ItineraryDay[];
  hotel: ExperienceHotel;
  rooms: HotelRoom[];
  reviews: HotelReviews;
  /** "Included in all rooms" list of the booking card (four items). */
  includedInAll: string[];
  /** Free cancellation up to this many days before departure. */
  freeCancellationDays: number;
  /** Indicative "from" price per person. Optional: the page shows no price until dates are chosen. */
  priceFrom?: Money;
}

/** A departure to price. The end date is the start plus the experience's nights. */
export interface ExperienceAvailabilityQuery {
  experienceSlug: string;
  /** ISO dates (YYYY-MM-DD). */
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  // TODO(api): send the children's ages and the per-room guest split once the real request accepts them.
  /** ISO 4217. */
  currency: string;
  /** Date flexibility in days (0 = exact dates). Whether the real API supports it is unknown. */
  flexDays: number;
}

export type ExperienceAvailabilityResult =
  | {
      status: "available";
      nights: number;
      /** Each room type, priced PER PERSON for the whole stay. */
      rooms: { roomId: string; perPerson: Money; available: boolean }[];
    }
  | { status: "unavailable" };
