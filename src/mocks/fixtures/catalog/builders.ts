import { slugify } from "@/helpers/slugify";
import { experienceDetail, hotelDetail } from "@/constants/routes";
import { detailSlug } from "@/helpers/slugify";
import { destinationBySlug } from "./destinations";
import { galleryFor, type ImageTheme } from "./images";
import type { ExperienceRecord, HotelRecord } from "./types";

/** "Ubud" in Bali -> "Ubud, Bali"; without a place, just the destination name. */
function locationOf(destinationSlug: string, place?: string): string {
  const entry = destinationBySlug.get(destinationSlug);
  if (!entry) throw new Error(`Unknown destination in catalog fixture: ${destinationSlug}`);
  return place ? `${place}, ${entry.name}` : entry.name;
}

export interface ExperienceSeed {
  id: string;
  title: string;
  provider: string;
  /** Destination menu label, e.g. "Bali, Indonesia". */
  destination: string;
  place?: string;
  rating: number;
  reviewCount: number;
  nights: number;
  /** USD per person. */
  price: number;
  /** Category and collection labels; the first is the primary category. */
  categories: readonly string[];
  theme: ImageTheme;
  leadImage?: string;
}

export function experienceRecord(seed: ExperienceSeed): ExperienceRecord {
  const categories = seed.categories.map(slugify);
  const destination = slugify(seed.destination);
  return {
    destination,
    categories,
    card: {
      id: seed.id,
      title: seed.title,
      provider: seed.provider,
      category: seed.categories[0],
      location: locationOf(destination, seed.place),
      rating: seed.rating,
      reviewCount: seed.reviewCount,
      nights: seed.nights,
      price: { amount: seed.price, currency: "USD" },
      href: experienceDetail(seed.id),
      images: galleryFor(seed.theme, seed.id, seed.leadImage),
    },
  };
}

export interface HotelSeed {
  id: string;
  title: string;
  destination: string;
  place?: string;
  /** Badge label, e.g. "Wellness Resort". */
  badge: string;
  stars: number;
  rating: number;
  reviewCount: number;
  amenities: string[];
  /** USD per night. */
  price: number;
  /** Tag labels; the first is the primary type. */
  tags: readonly string[];
  theme: ImageTheme;
}

export function hotelRecord(seed: HotelSeed): HotelRecord {
  const tags = seed.tags.map(slugify);
  const destination = slugify(seed.destination);
  const place = seed.place ?? (destinationBySlug.get(destination)?.name as string);
  const slug = detailSlug(seed.title, place);
  return {
    destination,
    tags,
    slug,
    place,
    theme: seed.theme,
    priceFrom: seed.price,
    card: {
      id: seed.id,
      title: seed.title,
      badge: seed.badge,
      stars: seed.stars,
      amenities: seed.amenities,
      location: locationOf(destination, seed.place),
      rating: seed.rating,
      reviewCount: seed.reviewCount,
      price: { amount: seed.price, currency: "USD" },
      href: hotelDetail(slug),
      images: galleryFor(seed.theme, seed.id),
    },
  };
}
