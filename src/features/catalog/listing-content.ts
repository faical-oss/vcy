import { ROUTES, destination, experienceCategory, hotelCategory } from "@/constants/routes";
import { SITE_NAME } from "@/constants/site";
import { formatCount, formatMoney } from "@/helpers/format";
import type {
  BreadcrumbItem,
  Destination,
  DestinationIndex,
  ExperienceCategory,
  ExperienceDetail,
  ExperienceGroupListing,
  ExperienceListing,
  HotelDetail,
  HotelGroupListing,
  HotelListing,
  Region,
  RegionPageCopy,
  RegionRef,
} from "@/interfaces";

/** Copy shared by the catalog listing pages (loading, error, empty and breadcrumb labels). */
export const LISTING_CONTENT = {
  breadcrumbLabel: "Breadcrumb",
  homeCrumb: "Home",
  experiencesCrumb: "Experiences",
  hotelsCrumb: "Hotels",
  loadingLabel: "Loading results",
  empty: {
    title: "No results yet",
    description: "We could not find anything here right now. Browse the rest of Vacayou to discover more trips.",
    action: { label: "Back to home", href: ROUTES.home },
  },
  error: {
    title: "We couldn't load these results",
    description: "Something went wrong on our side. Try again in a moment.",
    retry: "Try again",
  },
} as const;

function experienceCount(total: number): string {
  return `${total} ${total === 1 ? "experience" : "experiences"}`;
}

/** Home > Experiences > current category. "Experiences" has no link (`/experiences` is not a page) and the category is the current page. */
export function experienceCategoryCrumbs(label: string): BreadcrumbItem[] {
  return [
    { label: LISTING_CONTENT.homeCrumb, href: ROUTES.home },
    { label: LISTING_CONTENT.experiencesCrumb },
    { label },
  ];
}

/** Unique title and description per category. The site name comes from the root title template. */
export function experienceCategoryMetadata({ category, total }: Pick<ExperienceListing, "category" | "total">): {
  title: string;
  description: string;
} {
  const count = experienceCount(total);
  const intro =
    category.kind === "collection"
      ? `Browse ${count} from our ${category.label} collection on ${SITE_NAME}.`
      : `Browse ${count} hand-picked in ${category.label} on ${SITE_NAME}.`;
  return {
    title: `${category.label}: ${count} to book`,
    description: `${intro} Compare ratings, locations and per-person prices, then book with confidence.`,
  };
}

function hotelCount(total: number): string {
  return `${total} ${total === 1 ? "hotel" : "hotels"}`;
}

/** Home > Hotels > current category. The category crumb is the current page, so it has no link. */
export function hotelCategoryCrumbs(label: string): BreadcrumbItem[] {
  return [
    { label: LISTING_CONTENT.homeCrumb, href: ROUTES.home },
    { label: LISTING_CONTENT.hotelsCrumb },
    { label },
  ];
}

/** Unique title and description per hotel category. The wording follows the kind (type, brand, price range...). */
export function hotelCategoryMetadata({ category, total }: Pick<HotelListing, "category" | "total">): {
  title: string;
  description: string;
} {
  const count = hotelCount(total);
  const { label } = category;
  const intros: Record<HotelListing["category"]["kind"], string> = {
    type: `Browse ${count} hand-picked in ${label} on ${SITE_NAME}.`,
    experience: `Browse ${count} hand-picked for ${label} on ${SITE_NAME}.`,
    brand: `Browse ${count} from ${label} on ${SITE_NAME}.`,
    property: `Browse ${count} for ${label} and similar stays on ${SITE_NAME}.`,
    budget: `Browse ${count} by budget: ${label} on ${SITE_NAME}.`,
    curated: `Browse ${count} from our ${label} selection on ${SITE_NAME}.`,
  };
  return {
    title: `${label}: ${count} to book`,
    description: `${intros[category.kind]} Compare ratings, amenities and nightly prices, then book with confidence.`,
  };
}

/** Copy of the group listing pages (`/experiences/groups/[group]`, `/hotels/groups/[group]`). */
export const GROUP_CONTENT = {
  allChip: "All",
  experiences: { filterLabel: "Filter experiences by category" },
  hotels: { filterLabel: "Filter hotels by category" },
} as const;

/** Home > Experiences|Hotels > current group. The parent has no link (`/experiences` and `/hotels` are not pages) and the group is the current page. */
export function groupCrumbs(kind: "experiences" | "hotels", title: string): BreadcrumbItem[] {
  return [
    { label: LISTING_CONTENT.homeCrumb, href: ROUTES.home },
    { label: kind === "experiences" ? LISTING_CONTENT.experiencesCrumb : LISTING_CONTENT.hotelsCrumb },
    { label: title },
  ];
}

/** Unique title and description per experience group (unfiltered: filtered URLs canonicalise to the group page). */
export function experienceGroupMetadata({ group, chips, total }: Pick<ExperienceGroupListing, "group" | "chips" | "total">): {
  title: string;
  description: string;
} {
  const count = experienceCount(total);
  return {
    title: `${group.title}: ${count} to book`,
    description: `Browse ${count} across ${chips.length} ${chips.length === 1 ? "category" : "categories"} in ${group.title} on ${SITE_NAME}. Compare ratings, locations and per-person prices, then book with confidence.`,
  };
}

/** Unique title and description per hotel group. */
export function hotelGroupMetadata({ group, chips, total }: Pick<HotelGroupListing, "group" | "chips" | "total">): {
  title: string;
  description: string;
} {
  const count = hotelCount(total);
  return {
    title: `${group.title}: ${count} to book`,
    description: `Browse ${count} across ${chips.length} ${chips.length === 1 ? "category" : "categories"} in ${group.title} on ${SITE_NAME}. Compare ratings, amenities and nightly prices, then book with confidence.`,
  };
}

/**
 * "All" (the bare group route, which clears the filter) plus one `?category=` link per category of the group, in menu
 * order. `groupRoute` is built by `experienceGroup` / `hotelGroup`.
 */
export function groupChips({ groupRoute, chips, active }: {
  groupRoute: string;
  chips: readonly { slug: string; label: string }[];
  active: { slug: string } | null;
}): { label: string; href: string; active: boolean }[] {
  return [
    { label: GROUP_CONTENT.allChip, href: groupRoute, active: active === null },
    ...chips.map((chip) => ({ label: chip.label, href: `${groupRoute}?${new URLSearchParams({ category: chip.slug }).toString()}`, active: active?.slug === chip.slug })),
  ];
}

/** The catalog has no hero image per category, so the first card's first photo is used. */
export function listingHeroImage(items: readonly { images: readonly string[] }[]): string | undefined {
  return items[0]?.images[0];
}

/** Copy of the destination page (`/destinations/[slug]`). */
export const DESTINATION_CONTENT = {
  destinationsCrumb: "Destinations",
  filterLabel: "Filter experiences by category",
  allChip: "All",
  stats: { bestTime: "Best time to visit", averageStay: "Avg. stay", experiences: "Experiences", from: "From" },
  sectionHeading: (name: string) => `Experiences in ${name}`,
} as const;

/**
 * Experience categories offered as filter chips, in order (the prototype's yoga, wellness, hiking, meditation, cycling
 * and diving). Labels come from the catalog, so "Wellness" is shown as its catalog name "Holistic Wellness".
 */
export const DESTINATION_FILTER_SLUGS = ["yoga-retreats", "holistic-wellness", "hiking-and-trekking", "meditation-retreats", "cycling-tours", "diving-trips"] as const;

/** Home > Destinations > current destination. The destination crumb is the current page, so it has no link. */
export function destinationCrumbs(name: string): BreadcrumbItem[] {
  return [
    { label: LISTING_CONTENT.homeCrumb, href: ROUTES.home },
    { label: DESTINATION_CONTENT.destinationsCrumb, href: ROUTES.destinations },
    { label: name },
  ];
}

/** Unique title and description per destination (unfiltered: filtered URLs canonicalise to the base page). */
export function destinationMetadata({ name, experienceCount, bestTimeToVisit, averageStay, fromPrice }: Destination): {
  title: string;
  description: string;
} {
  return {
    title: `${name}: wellness and active travel experiences`,
    description: `Explore ${experienceCount}+ wellness and active experiences in ${name}. Best time: ${bestTimeToVisit}. Average stay ${averageStay}, from ${formatMoney(fromPrice)} per person. Book on ${SITE_NAME}.`,
  };
}

/** Facts row of the destination page. The price is shown as given by the data. */
export function destinationStats({ bestTimeToVisit, averageStay, experienceCount, fromPrice }: Destination) {
  const { stats } = DESTINATION_CONTENT;
  return [
    { label: stats.bestTime, value: bestTimeToVisit },
    { label: stats.averageStay, value: averageStay },
    { label: stats.experiences, value: `${experienceCount}+ experiences` },
    { label: stats.from, value: formatMoney(fromPrice), emphasis: true },
  ];
}

/**
 * "All" plus the configured categories. The active chip is the applied filter; an applied category that is not one of
 * the configured chips (a valid but unusual `?category=`) is appended as an extra active chip so the filter stays visible.
 */
export function destinationFilterChips(
  slug: string,
  categories: readonly { slug: string; label: string }[],
  active: ExperienceCategory | null,
): { label: string; href: string; active: boolean }[] {
  const options = active && !categories.some((category) => category.slug === active.slug) ? [...categories, active] : categories;
  return [
    { label: DESTINATION_CONTENT.allChip, href: destination(slug), active: active === null },
    ...options.map((category) => ({ label: category.label, href: destination(slug, { category: category.slug }), active: active?.slug === category.slug })),
  ];
}

/** "< Destinations > ASIA": the first crumb is the way back, the region is the current page. */
export function regionCrumbs(name: string): BreadcrumbItem[] {
  return destinationCrumbs(name);
}

/** "Asia · 1,435+ experiences" (the count is the sum over the region's destinations). */
export function regionSubtitle({ name, experienceCount }: Pick<Region, "name" | "experienceCount">): string {
  return `${name} · ${formatCount(experienceCount)} experiences`;
}

/** Unique title and description per region. Facts that the region does not have are left out of the description. */
export function regionMetadata({ name, experienceCount, destinations, bestTimeToVisit, averageStay, fromPrice }: Region): {
  title: string;
  description: string;
} {
  const facts = [
    bestTimeToVisit ? `Best time: ${bestTimeToVisit}.` : null,
    averageStay ? `Average stay ${averageStay}.` : null,
    fromPrice ? `From ${formatMoney(fromPrice)} per person.` : null,
  ].filter((fact) => fact !== null);
  const count = destinations.length;
  return {
    title: `${name}: ${count} wellness and active travel ${count === 1 ? "destination" : "destinations"}`,
    description: [
      `Explore ${formatCount(experienceCount)} wellness and active experiences across ${count} ${count === 1 ? "destination" : "destinations"} in ${name}.`,
      ...facts,
      `Book on ${SITE_NAME}.`,
    ].join(" "),
  };
}

/** Facts row of a region page. A fact the region does not have is left out, never shown as a placeholder. */
export function regionStats({ bestTimeToVisit, averageStay, experienceCount, fromPrice }: Region) {
  const { stats } = DESTINATION_CONTENT;
  return [
    bestTimeToVisit ? { label: stats.bestTime, value: bestTimeToVisit } : null,
    averageStay ? { label: stats.averageStay, value: averageStay } : null,
    experienceCount > 0 ? { label: stats.experiences, value: `${formatCount(experienceCount)} experiences` } : null,
    fromPrice ? { label: stats.from, value: formatMoney(fromPrice), emphasis: true } : null,
  ].filter((stat) => stat !== null);
}

/** Section copy of a region page. "All hotels" points at its listing route. TODO(listing): "All packages" comes back with the packages listing page (it has none yet). */
export function regionPageCopy(name: string): RegionPageCopy {
  return {
    popular: { heading: `Popular destinations in ${name}`, label: `Popular destinations in ${name}` },
    packages: { tag: "Curated for you", heading: `Packages in ${name}`, label: `Packages in ${name}` },
    hotels: { tag: "Places to stay", heading: `Hotels in ${name}`, label: `Hotels in ${name}`, linkLabel: "All hotels", href: ROUTES.browseHotels },
  };
}

/** Copy and ordering of the All Destinations page (`/destinations`). */
export const DESTINATION_INDEX_CONTENT = {
  eyebrow: "Explore the world",
  title: "All Destinations",
  filterLabel: "Filter destinations by region",
  allChip: "All",
  subtitle: (count: number) => `${count} hand-picked destinations for transformative travel.`,
  metadataTitle: "All destinations: wellness and active travel around the world",
} as const;

/**
 * Order of the region chips (the reference's, not the menu's). Regions missing from this list, such as a region added
 * later, follow in the order the catalog gives them.
 */
export const REGION_CHIP_ORDER = ["asia", "europe", "indian-ocean", "africa-and-middle-east", "americas", "oceania-and-pacific"] as const;

export function orderRegions(regions: readonly RegionRef[]): RegionRef[] {
  const rank = (region: RegionRef) => {
    const index = (REGION_CHIP_ORDER as readonly string[]).indexOf(region.slug);
    return index === -1 ? REGION_CHIP_ORDER.length : index;
  };
  return regions.map((region, position) => ({ region, position })).sort((a, b) => rank(a.region) - rank(b.region) || a.position - b.position).map(({ region }) => region);
}

/** "All" (plain `/destinations`, which clears the filter) plus one `?region=` link per region, in `REGION_CHIP_ORDER`. */
export function destinationIndexChips(regions: readonly RegionRef[], active: RegionRef | null): { label: string; href: string; active: boolean }[] {
  return [
    { label: DESTINATION_INDEX_CONTENT.allChip, href: ROUTES.destinations, active: active === null },
    ...orderRegions(regions).map((region) => ({
      label: region.name,
      href: `${ROUTES.destinations}?${new URLSearchParams({ region: region.slug }).toString()}`,
      active: active?.slug === region.slug,
    })),
  ];
}

/** Number of distinct destinations over the given groups (a destination belongs to one region, but ids are deduplicated anyway). */
export function countIndexDestinations(groups: DestinationIndex["groups"]): number {
  return new Set(groups.flatMap((group) => group.destinations.map((entry) => entry.id))).size;
}

/** Unique description for the index. Filtered URLs canonicalise to `/destinations`, so it describes the whole index. */
export function destinationIndexMetadata(count: number, regions: readonly RegionRef[]): { title: string; description: string } {
  const names = orderRegions(regions).map((region) => region.name);
  return {
    title: DESTINATION_INDEX_CONTENT.metadataTitle,
    description: `Browse ${count} hand-picked wellness and active travel destinations across ${names.join(", ")}. Compare places and book on ${SITE_NAME}.`,
  };
}

/** Copy of the hotel detail page (`/hotels/h/[slug]`). */
export const HOTEL_DETAIL_CONTENT = {
  breadcrumbLabel: LISTING_CONTENT.breadcrumbLabel,
  tabsLabel: "Hotel information",
  back: "Back",
  similar: "Similar hotels",
} as const;

/** Home > Hotels (no page, plain text) > type > hotel. The current page is the last crumb. */
export function hotelDetailCrumbs(hotel: Pick<HotelDetail, "name" | "type">): BreadcrumbItem[] {
  return [
    { label: LISTING_CONTENT.homeCrumb, href: ROUTES.home },
    { label: LISTING_CONTENT.hotelsCrumb },
    { label: hotel.type.label, href: hotelCategory(hotel.type.slug) },
    { label: hotel.name },
  ];
}

const DESCRIPTION_MAX = 160;

/** Unique title and description per hotel (the first sentence of its description plus a closing line, cut at 160 characters). */
export function hotelDetailMetadata(hotel: Pick<HotelDetail, "name" | "badge" | "location" | "description">): { title: string; description: string } {
  const firstSentence = hotel.description[0]?.split(/(?<=\.)\s/)[0] ?? "";
  const full = `${firstSentence} Compare rooms and book on ${SITE_NAME}.`;
  const description = full.length <= DESCRIPTION_MAX ? full : `${firstSentence.slice(0, DESCRIPTION_MAX - 1).trimEnd()}…`;
  return { title: `${hotel.name}: ${hotel.badge} in ${hotel.location.city}`, description };
}

export const EXPERIENCE_DETAIL_CONTENT = {
  breadcrumbLabel: LISTING_CONTENT.breadcrumbLabel,
  tabsLabel: "Experience information",
  back: "Back",
  similar: "You might also like",
} as const;

/** Home > Experiences (no page, plain text) > category > experience. The current page is the last crumb. */
export function experienceDetailCrumbs(experience: Pick<ExperienceDetail, "title" | "category">): BreadcrumbItem[] {
  return [
    { label: LISTING_CONTENT.homeCrumb, href: ROUTES.home },
    { label: LISTING_CONTENT.experiencesCrumb },
    { label: experience.category.label, href: experienceCategory(experience.category.slug) },
    { label: experience.title },
  ];
}

/** Unique title and description per experience (its title and place; the first sentence of its text plus a closing line, cut at 160 characters). */
export function experienceDetailMetadata(experience: Pick<ExperienceDetail, "title" | "location" | "nights" | "about" | "category"> & { duration?: ExperienceDetail["duration"] }): { title: string; description: string } {
  const firstSentence = experience.about[0]?.split(/(?<=\.)\s/)[0] ?? "";
  const full = `${firstSentence} See the itinerary, rooms and dates on ${SITE_NAME}.`;
  const description = full.length <= DESCRIPTION_MAX ? full : `${firstSentence.slice(0, DESCRIPTION_MAX - 1).trimEnd()}…`;
  return { title: `${experience.title} in ${experience.location.city}: ${experience.duration?.type === "flexible" ? "" : `${experience.nights}-night `}${experience.category.label.replace(/s$/, "")}`, description };
}
