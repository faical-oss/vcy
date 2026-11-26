import { packageDetail } from "@/constants/routes";
import { slugify } from "@/helpers/slugify";
import type { DetailImage, ExperienceDetail, ExperienceHotel, PackageCardData, PackageDetail, PackageStay } from "@/interfaces";
import { buildExperienceDetail } from "./experience-detail-builder";
import { PACKAGE_DURATIONS, packageSourceById, type PackageSource } from "./package-sources";
import type { ExperienceRecord } from "./types";

/**
 * ASSUMED mock content. A package page is built like an experience page (about, highlights, included, itinerary, reviews and
 * gallery from the same templates, picked by the package's category), then given its own duration, badge, label, "Package
 * includes" list and stays. Not polished on purpose. Deterministic. TODO(api): the real package detail from Trip Fusion.
 */

/** Group size of a package (a per-package config value). TODO(api). */
export const PACKAGE_GROUP_SIZE = { min: 1, max: 12 } as const;

/** Properties of the packages that are made of several (name, place, nights; a `hotelSlug` links to the hotel's page). Everything else has one stay. */
const STAYS: Readonly<Record<string, { name: string; location: string; nights: number; stars: number; hotelSlug?: string }[]>> = {
  "scottish-links": [
    { name: "Links House", location: "Dornoch, Scottish Highlands", nights: 3, stars: 5 },
    { name: "Spey Valley Golf Lodge", location: "Aviemore, Scottish Highlands", nights: 2, stars: 4 },
    { name: "The Old Course Hotel", location: "St Andrews, Scotland", nights: 2, stars: 5 },
  ],
  "patagonia-peaks": [
    { name: "Awasi Patagonia", location: "Torres del Paine, Chile", nights: 5, stars: 5 },
    { name: "Hotel Lago Grey", location: "Puerto Natales, Chile", nights: 3, stars: 4 },
  ],
  kerala: [
    { name: "Somatheeram Ayurvedic Resort", location: "Kerala, India", nights: 6, stars: 4 },
    { name: "Kerala Backwater Eco Retreat", location: "Kerala, India", nights: 4, stars: 4, hotelSlug: "kerala-backwater-eco-retreat" },
  ],
  cyclades: [
    { name: "Cretan Wellness Villas", location: "Crete, Greece", nights: 3, stars: 4 },
    { name: "Cretan Olive Grove Lodge", location: "Crete, Greece", nights: 3, stars: 4, hotelSlug: "cretan-olive-grove-lodge" },
  ],
};

/** The itinerary and content template of a package, from its label (a package has no experience category). */
function templateCategory(source: PackageSource): string {
  const text = `${source.category} ${source.title}`.toLowerCase();
  if (/yoga/.test(text)) return "yoga-retreats";
  if (/meditat|mindful/.test(text)) return "meditation-retreats";
  if (/trek|expedition|mountain|adventure|volcano|canyon|hik/.test(text)) return "hiking-trekking";
  if (/cycl/.test(text)) return "cycling-tours";
  if (/diving/.test(text)) return "diving-trips";
  return "holistic-wellness";
}

export function buildPackageDetail(source: PackageSource): PackageDetail {
  const record: ExperienceRecord = {
    card: { id: source.id, title: source.title, location: source.location, rating: source.rating ?? 4.7, reviewCount: source.reviewCount ?? 64, href: "", images: source.images, price: source.price, category: source.category, provider: source.provider, nights: source.nights },
    destination: "",
    categories: [templateCategory(source)],
  };
  const base: ExperienceDetail = buildExperienceDetail(record, source.category);
  const { hotel, rooms, ...rest } = base;
  const duration = PACKAGE_DURATIONS[source.id] ?? ({ type: "fixed", nights: source.nights } as const);

  const specs = STAYS[source.id];
  const stays: PackageStay[] = specs
    ? specs.map((spec, index): PackageStay => {
        const images: DetailImage[] = [...hotel.images.slice(index), ...hotel.images.slice(0, index)];
        const stayHotel: ExperienceHotel = { name: spec.name, stars: spec.stars, location: spec.location, description: `${spec.name} is the ${index === 0 ? "first" : index === specs.length - 1 ? "last" : "next"} stop of this package: a ${spec.stars}-star stay in ${spec.location.split(", ")[0]} with a quiet setting, good food and a team that looks after every detail.`, amenities: hotel.amenities.slice(0, 5), images };
        return {
          id: `stay-${index + 1}`,
          hotel: stayHotel,
          nights: spec.nights,
          fromNight: specs.slice(0, index).reduce((sum, previous) => sum + previous.nights, 0) + 1,
          hotelSlug: spec.hotelSlug,
          rooms: index === 0 ? rooms : rooms.map((room) => ({ ...room, id: `${room.id}-s${index + 1}` })),
        };
      })
    : [{ id: "stay-1", hotel, nights: source.nights, fromNight: 1, rooms }];

  const accommodation = specs ? `${source.nights} nights across ${specs.length} properties` : duration.type === "fixed" ? `${source.nights} nights accommodation` : "Accommodation for every night";
  return {
    ...rest,
    badge: source.badge,
    category: { slug: slugify(source.category), label: source.category },
    duration,
    groupSize: { ...PACKAGE_GROUP_SIZE },
    stays,
    includedInAll: [accommodation, ...base.includedInAll.slice(1)],
    priceFrom: source.price,
  };
}

/** A package as a card (linked to its page, no rating), or null for an unknown id. `withPrice: false` for a related row (prices appear once dates are chosen). */
export function packageCardOf(id: string, options: { withPrice?: boolean } = {}): PackageCardData | null {
  const source = packageSourceById.get(id);
  if (!source) return null;
  return {
    id: source.id,
    title: source.title,
    badge: source.badge,
    category: source.category,
    provider: source.provider,
    location: source.location,
    nights: source.nights,
    highlights: buildPackageDetail(source).highlights.slice(0, 3).map((highlight) => highlight.text),
    images: source.images,
    href: packageDetail(source.id),
    ...(options.withPrice === false ? {} : { price: source.price }),
  };
}
