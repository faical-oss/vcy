import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { GROUP_SEGMENT, ROUTES, destination, destinationRegion, experienceCategory, experienceDetail, experienceGroup, hotelCategory, hotelDetail, hotelGroup } from "@/constants/routes";
import { STATIC_PARAMS_LIMIT, STATIC_PARAMS_SEED } from "@/constants/site";
import { getNavigation } from "@/features/navigation/get-navigation";
import type { ExperienceCardData, ExperienceDetail, HotelCardData, HotelDetail } from "@/interfaces";
import type { DestinationIndex, DestinationListing, ExperienceGroupListing, ExperienceListing, HotelGroupListing, HotelListing, RegionListing } from "@/interfaces";
import { CatalogNotConfiguredError } from "@/lib/catalog-errors";
import { getCatalogService } from "@/services";
import { CATALOG_TAG, capTags, cardTags, entityTag } from "./cache-tags";
import { DESTINATION_FILTER_SLUGS } from "./listing-content";
import { parseOptionalSlug, slugSchema } from "./schemas";

/*
 * Catalog reads are public and identical for every visitor, so they are cached (no cookies or headers inside).
 * Listing cards carry indicative "from" prices, so the "hours" profile is used (refresh at most hourly, expire after a
 * day) instead of a longer one: that is the safety net if no revalidation call ever arrives. On demand, `revalidateTag` takes
 * `catalog` (everything) or an entity tag (`hotel:<slug>`, `destination:<slug>`, `category:<slug>`, see cache-tags.ts);
 * `POST /api/revalidate` is the secured entry point.
 * The route params are validated before the cached scope, so malformed values never create cache entries.
 */

async function readExperiencesByCategory(slug: string): Promise<ExperienceListing | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const result = await (await getCatalogService()).getExperiencesByCategory(slug);
  if (result) cacheTag(...capTags([entityTag("category", slug), ...cardTags("experience", result.items)]));
  return result;
}

async function readHotelsByCategory(slug: string): Promise<HotelListing | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const result = await (await getCatalogService()).getHotelsByCategory(slug);
  if (result) cacheTag(...capTags([entityTag("category", slug), ...cardTags("hotel", result.items)]));
  return result;
}

async function readExperienceGroup(slug: string, category: string | undefined): Promise<ExperienceGroupListing | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const result = await (await getCatalogService()).getExperienceGroup(slug, category);
  if (result) cacheTag(...capTags([entityTag("category", slug), ...cardTags("experience", result.items)]));
  return result;
}

async function readHotelGroup(slug: string, category: string | undefined): Promise<HotelGroupListing | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const result = await (await getCatalogService()).getHotelGroup(slug, category);
  if (result) cacheTag(...capTags([entityTag("category", slug), ...cardTags("hotel", result.items)]));
  return result;
}

async function readDestination(slug: string, category: string | undefined): Promise<DestinationListing | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const result = await (await getCatalogService()).getDestination(slug, { category });
  if (result) cacheTag(...capTags([entityTag("destination", slug), ...cardTags("experience", result.items), ...cardTags("package", result.packages), ...cardTags("hotel", result.hotels)]));
  return result;
}

async function readRegion(slug: string): Promise<RegionListing | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const result = await (await getCatalogService()).getRegion(slug);
  if (result) cacheTag(...capTags([entityTag("destination", slug), ...cardTags("package", result.packages), ...cardTags("hotel", result.hotels)]));
  return result;
}

async function readHotel(slug: string): Promise<HotelDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const hotel = await (await getCatalogService()).getHotel(slug);
  if (hotel) cacheTag(entityTag("hotel", slug), entityTag("category", hotel.type.slug));
  return hotel;
}

async function readExperience(slug: string): Promise<ExperienceDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const experience = await (await getCatalogService()).getExperience(slug);
  if (experience) cacheTag(entityTag("experience", slug), entityTag("category", experience.category.slug));
  return experience;
}

async function readSimilarExperiences(slug: string, limit: number): Promise<ExperienceCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const experiences = await (await getCatalogService()).getSimilarExperiences(slug, limit);
  cacheTag(...capTags([entityTag("experience", slug), ...cardTags("experience", experiences)]));
  return experiences;
}

async function readSimilarHotels(slug: string, limit: number): Promise<HotelCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const hotels = await (await getCatalogService()).getSimilarHotels(slug, limit);
  cacheTag(...capTags([entityTag("hotel", slug), ...cardTags("hotel", hotels)]));
  return hotels;
}

async function readExperienceCards(ids: readonly string[]): Promise<ExperienceCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const cards = await (await getCatalogService()).getExperienceCards(ids);
  cacheTag(...capTags(cardTags("experience", cards)));
  return cards;
}

async function readHotelCards(ids: readonly string[]): Promise<HotelCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const cards = await (await getCatalogService()).getHotelCards(ids);
  cacheTag(...capTags(cardTags("hotel", cards)));
  return cards;
}

async function readDestinationIndex(regionSlug: string | undefined): Promise<DestinationIndex> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  return (await getCatalogService()).getDestinationIndex(regionSlug);
}

/**
 * Not configured means no data (the page calls notFound()). Checked outside the cached scopes: an error thrown inside
 * `"use cache"` crosses the cache boundary and loses its class, and nothing may be cached for a missing service.
 */
async function isCatalogConfigured(): Promise<boolean> {
  try {
    await getCatalogService();
    return true;
  } catch (error) {
    if (error instanceof CatalogNotConfiguredError) return false;
    throw error;
  }
}

/** Cards for `/experiences/[category]`. Null for an unknown or malformed slug, or when no catalog is configured (the page calls notFound()). */
export async function getExperiencesByCategory(slug: string): Promise<ExperienceListing | null> {
  const parsed = slugSchema.safeParse(slug);
  return parsed.success && (await isCatalogConfigured()) ? readExperiencesByCategory(parsed.data) : null;
}

/** Cards for `/hotels/[category]`. Null for an unknown or malformed slug, or when no catalog is configured. */
export async function getHotelsByCategory(slug: string): Promise<HotelListing | null> {
  const parsed = slugSchema.safeParse(slug);
  return parsed.success && (await isCatalogConfigured()) ? readHotelsByCategory(parsed.data) : null;
}

/** Cards for `/experiences/groups/[group]?category=`. An invalid or out-of-group category is ignored (all of the group). Null for an unknown or malformed group, or when no catalog is configured. */
export async function getExperienceGroup(slug: string, category?: string): Promise<ExperienceGroupListing | null> {
  const parsed = slugSchema.safeParse(slug);
  return parsed.success && (await isCatalogConfigured()) ? readExperienceGroup(parsed.data, parseOptionalSlug(category)) : null;
}

/** Cards for `/hotels/groups/[group]?category=`. Same rules as `getExperienceGroup`. */
export async function getHotelGroup(slug: string, category?: string): Promise<HotelGroupListing | null> {
  const parsed = slugSchema.safeParse(slug);
  return parsed.success && (await isCatalogConfigured()) ? readHotelGroup(parsed.data, parseOptionalSlug(category)) : null;
}

/** Destination facts and related experience cards for `/destinations/[slug]?category=`. An invalid category is ignored. Null when unknown or not configured. */
export async function getDestination(slug: string, options: { category?: string } = {}): Promise<DestinationListing | null> {
  const parsed = slugSchema.safeParse(slug);
  return parsed.success && (await isCatalogConfigured()) ? readDestination(parsed.data, parseOptionalSlug(options.category)) : null;
}

/** Region facts with its destinations, packages and hotels for `/destinations/[slug]` when the slug is a region. Null when unknown, malformed or not configured. */
export async function getRegion(slug: string): Promise<RegionListing | null> {
  const parsed = slugSchema.safeParse(slug);
  return parsed.success && (await isCatalogConfigured()) ? readRegion(parsed.data) : null;
}

/** Static content of `/hotels/h/[slug]` (no live price). Null for an unknown or malformed slug, or when no catalog is configured. */
export async function getHotel(slug: string): Promise<HotelDetail | null> {
  const parsed = slugSchema.safeParse(slug);
  return parsed.success && (await isCatalogConfigured()) ? readHotel(parsed.data) : null;
}

/** Static content of `/experiences/e/[slug]` (no live price). Null for an unknown or malformed slug, or when no catalog is configured. */
export async function getExperience(slug: string): Promise<ExperienceDetail | null> {
  const parsed = slugSchema.safeParse(slug);
  return parsed.success && (await isCatalogConfigured()) ? readExperience(parsed.data) : null;
}

/** The "You might also like" row: up to `limit` cards, never the experience itself. Empty for an unknown experience. */
export async function getSimilarExperiences(slug: string, limit = 3): Promise<ExperienceCardData[]> {
  const parsed = slugSchema.safeParse(slug);
  return parsed.success && (await isCatalogConfigured()) ? readSimilarExperiences(parsed.data, limit) : [];
}

/** The "Similar hotels" row: up to `limit` cards, never the hotel itself. Empty for an unknown hotel. */
export async function getSimilarHotels(slug: string, limit = 3): Promise<HotelCardData[]> {
  const parsed = slugSchema.safeParse(slug);
  return parsed.success && (await isCatalogConfigured()) ? readSimilarHotels(parsed.data, limit) : [];
}

/** Cards of the given experience ids, in that order (Home's featured row). Unknown or malformed ids are skipped; empty when no catalog is configured. */
export async function getExperienceCards(ids: readonly string[]): Promise<ExperienceCardData[]> {
  const valid = ids.filter((id) => slugSchema.safeParse(id).success);
  return valid.length > 0 && (await isCatalogConfigured()) ? readExperienceCards(valid) : [];
}

/** Cards of the given hotel ids (card ids), in that order (Home's featured row). Unknown or malformed ids are skipped; empty when no catalog is configured. */
export async function getHotelCards(ids: readonly string[]): Promise<HotelCardData[]> {
  const valid = ids.filter((id) => slugSchema.safeParse(id).success);
  return valid.length > 0 && (await isCatalogConfigured()) ? readHotelCards(valid) : [];
}

/** Destinations grouped by region for `/destinations?region=`. A malformed or unknown region is ignored (no filter). Empty when not configured. */
export async function getDestinationIndex(options: { region?: string } = {}): Promise<DestinationIndex> {
  if (!(await isCatalogConfigured())) return { regions: [], groups: [], activeRegion: null };
  return readDestinationIndex(parseOptionalSlug(options.region));
}

/**
 * Slug and label of every internal link of one header menu under `base`, first occurrence wins. Reading the cached menu
 * means the pages prerendered at build time are exactly the ones the menu links to. The catalog service has no "list"
 * calls yet. The footer link `/destinations` has no slug and is skipped. External or differently shaped links are dropped; a menu that has links but none under `base` throws (its hrefs changed shape).
 */
async function readMenuEntries(menuId: "experiences" | "hotels" | "destinations", base: string): Promise<{ slug: string; label: string }[]> {
  const prefix = `${base}/`;
  const menu = (await getNavigation()).find((entry) => entry.id === menuId);
  const links = (menu?.groups ?? []).flatMap((group) => group.links);
  const entries = links
    .filter((link) => !link.external && link.href.startsWith(prefix))
    .map((link) => ({ slug: link.href.slice(prefix.length), label: link.label }))
    .filter((entry) => slugSchema.safeParse(entry.slug).success);
  if (links.length > 0 && entries.length === 0) {
    throw new Error(`navigation menu ${menuId} yielded no slugs under ${prefix}`);
  }
  return [...new Map(entries.map((entry) => [entry.slug, entry])).values()];
}

/**
 * Slugs for `generateStaticParams`: the first `STATIC_PARAMS_LIMIT` of the list, or the seed list when the list is empty
 * or cannot be read. Never empty, never throws, so an API outage at build time cannot fail the build (the pages of the
 * slugs that were not prerendered render on first request).
 */
export async function staticSlugs(read: () => Promise<readonly string[]>, seed: readonly string[]): Promise<string[]> {
  try {
    const slugs = (await read()).filter((slug) => slugSchema.safeParse(slug).success);
    if (slugs.length > 0) return [...new Set(slugs)].slice(0, STATIC_PARAMS_LIMIT);
  } catch (error) {
    console.warn("generateStaticParams: could not read the slug list, using the seed list.", error instanceof Error ? error.message : error);
  }
  return [...seed];
}

async function readMenuCategorySlugs(menuId: "experiences" | "hotels" | "destinations", base: string): Promise<string[]> {
  return (await readMenuEntries(menuId, base)).map((entry) => entry.slug);
}

/**
 * Group slugs of one header menu: the last segment of the hrefs of its groups under `groupBase` (e.g. `/experiences/groups`),
 * first occurrence wins. Same placeholder and shape check as the category slugs.
 */
async function readMenuGroupSlugs(menuId: "experiences" | "hotels", groupBase: string): Promise<string[]> {
  const prefix = `${groupBase}/`;
  const menu = (await getNavigation()).find((entry) => entry.id === menuId);
  const groups = menu?.groups ?? [];
  const slugs = groups
    .flatMap((group) => (group.href?.startsWith(prefix) ? [group.href.slice(prefix.length)] : []))
    .filter((slug) => slugSchema.safeParse(slug).success);
  if (groups.length > 0 && slugs.length === 0) {
    throw new Error(`navigation menu ${menuId} yielded no group slugs under ${prefix}`);
  }
  return [...new Set(slugs)];
}

/** Experience group slugs for `generateStaticParams` of `/experiences/groups/[group]` (read from the cached menu, like the category slugs). */
export async function getExperienceGroupSlugs(): Promise<string[]> {
  return staticSlugs(() => readMenuGroupSlugs("experiences", `${ROUTES.experiences}/${GROUP_SEGMENT}`), STATIC_PARAMS_SEED.experienceGroups);
}

/** Hotel group slugs for `generateStaticParams` of `/hotels/groups/[group]`. */
export async function getHotelGroupSlugs(): Promise<string[]> {
  return staticSlugs(() => readMenuGroupSlugs("hotels", `${ROUTES.hotels}/${GROUP_SEGMENT}`), STATIC_PARAMS_SEED.hotelGroups);
}

/** Experience detail slugs for `generateStaticParams` of `/experiences/e/[slug]`: the best `STATIC_PARAMS_LIMIT`, seed list as fallback. */
export async function getExperienceSlugs(): Promise<string[]> {
  return staticSlugs(async () => (await getCatalogService()).listExperienceSlugs(STATIC_PARAMS_LIMIT), STATIC_PARAMS_SEED.experiences);
}

/** Hotel detail slugs for `generateStaticParams` of `/hotels/h/[slug]`: the best `STATIC_PARAMS_LIMIT`, seed list as fallback. */
export async function getHotelSlugs(): Promise<string[]> {
  return staticSlugs(async () => (await getCatalogService()).listHotelSlugs(STATIC_PARAMS_LIMIT), STATIC_PARAMS_SEED.hotels);
}

/** Experience category slugs for `generateStaticParams` (workaround until the catalog service can list categories). */
export async function getExperienceCategorySlugs(): Promise<string[]> {
  return staticSlugs(() => readMenuCategorySlugs("experiences", ROUTES.experiences), STATIC_PARAMS_SEED.experienceCategories);
}

/** Hotel category slugs for `generateStaticParams` (same workaround as `getExperienceCategorySlugs`). */
export async function getHotelCategorySlugs(): Promise<string[]> {
  return staticSlugs(() => readMenuCategorySlugs("hotels", ROUTES.hotels), STATIC_PARAMS_SEED.hotelCategories);
}

/** Destination slugs for `generateStaticParams`: unique (Maldives, Sri Lanka and Zanzibar are listed twice). Same workaround. */
export async function getDestinationSlugs(): Promise<string[]> {
  return readMenuCategorySlugs("destinations", ROUTES.destinations);
}

/** Region slugs (empty when no catalog is configured). Read from the service: `getDestinationIndex` always lists every region. */
export async function getRegionSlugs(): Promise<string[]> {
  return (await getDestinationIndex()).regions.map((region) => region.slug);
}

/** Slugs for `generateStaticParams` of `/destinations/[slug]`: destinations (from the menu) plus regions. The sets are disjoint; regions come first so the limit never drops them. */
export async function getDestinationPageSlugs(): Promise<string[]> {
  return staticSlugs(async () => [...(await getRegionSlugs()), ...(await getDestinationSlugs())], STATIC_PARAMS_SEED.destinations);
}

/** Experience categories offered as filter chips on destination pages, in chip order, labelled as in the header menu. */
export async function getDestinationFilterCategories(): Promise<{ slug: string; label: string }[]> {
  const bySlug = new Map((await readMenuEntries("experiences", ROUTES.experiences)).map((entry) => [entry.slug, entry]));
  return DESTINATION_FILTER_SLUGS.flatMap((slug) => bySlug.get(slug) ?? []);
}

/**
 * Paths of every catalog page for the sitemap, built with the route helpers. Unlike `generateStaticParams` there is no
 * limit and NO seed fallback: a seed slug is not a real page and must never reach a sitemap. With no catalog configured
 * (or an unreadable menu) this is empty, so the sitemap lists only the static pages.
 */
export async function getCatalogSitemapPaths(): Promise<string[]> {
  const safe = async (read: () => Promise<readonly string[]>): Promise<readonly string[]> => {
    try {
      return await read();
    } catch {
      return [];
    }
  };
  const [experiences, hotels, destinations, regions, experienceGroups, hotelGroups, hotelDetails, experienceDetails] = await Promise.all([
    safe(() => readMenuCategorySlugs("experiences", ROUTES.experiences)),
    safe(() => readMenuCategorySlugs("hotels", ROUTES.hotels)),
    safe(() => readMenuCategorySlugs("destinations", ROUTES.destinations)),
    safe(getRegionSlugs),
    safe(() => readMenuGroupSlugs("experiences", `${ROUTES.experiences}/${GROUP_SEGMENT}`)),
    safe(() => readMenuGroupSlugs("hotels", `${ROUTES.hotels}/${GROUP_SEGMENT}`)),
    safe(async () => (await getCatalogService()).listHotelSlugs(Number.MAX_SAFE_INTEGER)),
    safe(async () => (await getCatalogService()).listExperienceSlugs(Number.MAX_SAFE_INTEGER)),
  ]);
  return [
    ...experiences.map(experienceCategory),
    ...hotels.map(hotelCategory),
    ...experienceGroups.map(experienceGroup),
    ...hotelGroups.map(hotelGroup),
    ...regions.map(destinationRegion),
    ...destinations.map((slug) => destination(slug)),
    ...hotelDetails.map(hotelDetail),
    ...experienceDetails.map(experienceDetail),
  ];
}
