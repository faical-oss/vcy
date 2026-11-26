import { destination as destinationHref } from "@/constants/routes";
import { seededPick } from "@/helpers/seeded-pick";
import { slugify } from "@/helpers/slugify";
import type { CategoryChip, ExperienceCardData, ExperienceDetail, HotelCardData, HotelDetail, Destination, DestinationIndex, DestinationListing, DestinationSummary, ExperienceCategory, ExperienceGroupListing, ExperienceListing, GroupRef, HotelCategory, HotelGroupListing, HotelListing, ICatalogService, Region, RegionListing } from "@/interfaces";
import { catalogFixture } from "../fixtures/catalog";
import { buildExperienceDetail } from "../fixtures/catalog/experience-detail-builder";
import { buildHotelDetail } from "../fixtures/catalog/hotel-detail-builder";
import type { CatalogData, ExperienceRecord, HotelRecord } from "../fixtures/catalog/types";

/** Pages show at least this many cards: fewer related matches are topped up with deterministic fillers. */
export const MIN_RESULTS = 3;

interface Rated {
  card: { id: string; rating?: number };
}

/** Related matches first (best rated first, id as tiebreaker), independent of the input order. */
function sortMatches<T extends Rated>(matches: readonly T[]): T[] {
  return [...matches].sort((a, b) => (b.card.rating ?? 0) - (a.card.rating ?? 0) || (a.card.id < b.card.id ? -1 : 1));
}

/**
 * Returns the matches, then fills up to MIN_RESULTS from the preference tiers in order (each tier only offers items not
 * yet chosen). Every pick is seeded by `seed`, so the same slug always yields the same cards in the same order.
 */
function withTopUp<T extends Rated>(matches: readonly T[], tiers: readonly (readonly T[])[], seed: string, size = MIN_RESULTS, cap = Number.POSITIVE_INFINITY): T[] {
  const chosen = sortMatches(matches).slice(0, cap);
  const taken = new Set(chosen.map((item) => item.card.id));
  for (const tier of tiers) {
    const missing = size - chosen.length;
    if (missing <= 0) break;
    const candidates = tier.filter((item) => !taken.has(item.card.id));
    for (const pick of seededPick(candidates, seed, missing, (item) => item.card.id)) {
      chosen.push(pick);
      taken.add(pick.card.id);
    }
  }
  return chosen;
}

/** Region pages always show 3 packages and 4 hotels: best-rated matches first, then deterministic fillers from other regions. */
export const REGION_PACKAGE_COUNT = 3;
export const REGION_HOTEL_COUNT = 4;

function regionCards<T extends Rated & { card: unknown }>(matches: readonly T[], tiers: readonly (readonly T[])[], size: number, seed: string): T["card"][] {
  return withTopUp(matches, tiers, seed, size, size).map((record) => record.card);
}

interface MenuGroup<C extends { slug: string; label: string; group: string }> {
  ref: GroupRef;
  categories: C[];
}

/** Menu groups in menu order, keyed by `slugify(title)`; each holds its categories in menu order. */
function indexGroups<C extends { slug: string; label: string; group: string }>(categories: readonly C[]): Map<string, MenuGroup<C>> {
  const groups = new Map<string, MenuGroup<C>>();
  for (const category of categories) {
    const slug = slugify(category.group);
    const entry = groups.get(slug) ?? { ref: { slug, title: category.group }, categories: [] };
    entry.categories.push(category);
    groups.set(slug, entry);
  }
  return groups;
}

function toChip({ slug, label }: CategoryChip): CategoryChip {
  return { slug, label };
}

/** Each card id once (first record wins). */
function uniqueById<T extends Rated>(records: readonly T[]): T[] {
  return [...new Map(records.map((record) => [record.card.id, record])).values()];
}

function toSummary(entry: Destination): DestinationSummary {
  return { id: entry.slug, name: entry.name, region: entry.region, experienceCount: entry.experienceCount, href: destinationHref(entry.slug), imageSrc: entry.heroImage };
}

/**
 * Regions are computed from the destinations (registry order): count = sum of their counts, "from" = lowest numeric
 * price, hero = the destination with the most experiences (slug as tiebreaker). A region without destinations is dropped
 * (it would have no hero). Editorial fields are copied only when present.
 */
function buildRegions(data: CatalogData): Region[] {
  return data.regions.flatMap((editorial) => {
    const members = data.destinations.filter((entry) => entry.region === editorial.label);
    if (members.length === 0) return [];
    const hero = [...members].sort((a, b) => b.experienceCount - a.experienceCount || (a.slug < b.slug ? -1 : 1))[0];
    const prices = members.flatMap((entry) => data.destinationFromPrice[entry.slug] ?? []);
    return [
      {
        slug: slugify(editorial.label),
        name: editorial.label,
        ...(editorial.intro ? { intro: editorial.intro } : {}),
        ...(editorial.bestTimeToVisit ? { bestTimeToVisit: editorial.bestTimeToVisit } : {}),
        ...(editorial.averageStay ? { averageStay: editorial.averageStay } : {}),
        experienceCount: members.reduce((sum, entry) => sum + entry.experienceCount, 0),
        ...(prices.length > 0 ? { fromPrice: { amount: Math.min(...prices), currency: "USD" } } : {}),
        heroImage: hero.heroImage,
        destinations: members.map(toSummary),
      },
    ];
  });
}

export function createCatalogService(data: CatalogData): ICatalogService {
  const regionOf = new Map(data.destinations.map((entry) => [entry.slug, entry.region]));
  const regions = buildRegions(data);
  const regionRefs = regions.map(({ slug, name }) => ({ slug, name }));

  function hasAny(categories: readonly string[], wanted: readonly string[] | undefined): boolean {
    return !!wanted && categories.some((slug) => wanted.includes(slug));
  }

  function isBudgetMatch(record: HotelRecord, slug: string): boolean {
    const range = data.hotelBudgetRanges[slug];
    return !!range && record.priceFrom >= range.min && (range.max === undefined || record.priceFrom < range.max);
  }

  const experienceGroups = indexGroups(data.experienceCategories);
  const hotelGroups = indexGroups(data.hotelCategories);

  function isExperienceMatch(record: ExperienceRecord, slug: string): boolean {
    return record.categories.includes(slug);
  }

  function isHotelMatch(record: HotelRecord, slug: string): boolean {
    return record.tags.includes(slug) || isBudgetMatch(record, slug);
  }

  function experienceAffinity(group: string): ExperienceRecord[] {
    return data.experiences.filter((record) => hasAny(record.categories, data.experienceTopUpAffinity[group]));
  }

  function hotelAffinity(group: string): HotelRecord[] {
    return data.hotels.filter((record) => hasAny(record.tags, data.hotelTopUpAffinity[group]));
  }

  function experienceCategoryCards(category: ExperienceCategory) {
    const matches = data.experiences.filter((record) => isExperienceMatch(record, category.slug));
    return withTopUp(matches, [experienceAffinity(category.group), data.experiences], category.slug).map((record) => record.card);
  }

  function hotelCategoryCards(category: HotelCategory) {
    const matches = data.hotels.filter((record) => isHotelMatch(record, category.slug));
    return withTopUp(matches, [hotelAffinity(category.group), data.hotels], category.slug).map((record) => record.card);
  }

  return {
    async getExperiencesByCategory(slug): Promise<ExperienceListing | null> {
      const category = data.experienceCategories.find((entry) => entry.slug === slug);
      if (!category) return null;

      const items = experienceCategoryCards(category);
      return { category, items, total: items.length };
    },

    async getHotelsByCategory(slug): Promise<HotelListing | null> {
      const category = data.hotelCategories.find((entry) => entry.slug === slug);
      if (!category) return null;

      const items = hotelCategoryCards(category);
      return { category, items, total: items.length };
    },

    /** Unfiltered: the union of each category's real matches (no per-category fillers), topped up only when under MIN_RESULTS. */
    async getExperienceGroup(slug, categorySlug): Promise<ExperienceGroupListing | null> {
      const group = experienceGroups.get(slug);
      if (!group) return null;

      const active = group.categories.find((entry) => entry.slug === categorySlug) ?? null;
      const matches = uniqueById(data.experiences.filter((record) => group.categories.some((entry) => isExperienceMatch(record, entry.slug))));
      const items = active ? experienceCategoryCards(active) : withTopUp(matches, [experienceAffinity(group.ref.title), data.experiences], slug).map((record) => record.card);
      return { group: group.ref, chips: group.categories.map(toChip), active: active && toChip(active), items, total: items.length };
    },

    async getHotelGroup(slug, categorySlug): Promise<HotelGroupListing | null> {
      const group = hotelGroups.get(slug);
      if (!group) return null;

      const active = group.categories.find((entry) => entry.slug === categorySlug) ?? null;
      const matches = uniqueById(data.hotels.filter((record) => group.categories.some((entry) => isHotelMatch(record, entry.slug))));
      const items = active ? hotelCategoryCards(active) : withTopUp(matches, [hotelAffinity(group.ref.title), data.hotels], slug).map((record) => record.card);
      return { group: group.ref, chips: group.categories.map(toChip), active: active && toChip(active), items, total: items.length };
    },

    async getDestination(slug, query = {}): Promise<DestinationListing | null> {
      const destination = data.destinations.find((entry) => entry.slug === slug);
      if (!destination) return null;

      // An unknown category is ignored (no filter), not an error.
      const category = data.experienceCategories.find((entry) => entry.slug === query.category) ?? null;
      const inCategory = (record: ExperienceRecord) => !category || record.categories.includes(category.slug);
      const sameRegion = (record: ExperienceRecord) => regionOf.get(record.destination) === destination.region;

      const matches = data.experiences.filter((record) => record.destination === slug && inCategory(record));
      const seed = category ? `${slug}?category=${category.slug}` : slug;
      const tiers = [
        data.experiences.filter((record) => inCategory(record) && sameRegion(record)),
        data.experiences.filter(inCategory),
        data.experiences.filter(sameRegion),
        data.experiences,
      ];
      const items = withTopUp(matches, tiers, seed).map((record) => record.card);
      // Packages and hotels do not depend on the category filter: the destination's own first, then its region, then any.
      const regionPackages = data.packages.filter((record) => regionOf.get(record.destinationSlug) === destination.region);
      const regionHotels = data.hotels.filter((record) => regionOf.get(record.destination) === destination.region);
      return {
        destination,
        category,
        items,
        total: items.length,
        packages: regionCards(data.packages.filter((record) => record.destinationSlug === slug), [regionPackages, data.packages], REGION_PACKAGE_COUNT, `${slug}:packages`),
        hotels: regionCards(data.hotels.filter((record) => record.destination === slug), [regionHotels, data.hotels], REGION_HOTEL_COUNT, `${slug}:hotels`),
      };
    },

    async getRegion(slug): Promise<RegionListing | null> {
      const region = regions.find((entry) => entry.slug === slug);
      if (!region) return null;

      const inRegion = (destinationSlug: string) => regionOf.get(destinationSlug) === region.name;
      return {
        region,
        destinations: region.destinations,
        packages: regionCards(data.packages.filter((record) => inRegion(record.destinationSlug)), [data.packages], REGION_PACKAGE_COUNT, `${slug}:packages`),
        hotels: regionCards(data.hotels.filter((record) => inRegion(record.destination)), [data.hotels], REGION_HOTEL_COUNT, `${slug}:hotels`),
      };
    },

    async getDestinationIndex(regionSlug): Promise<DestinationIndex> {
      const active = regions.find((entry) => entry.slug === regionSlug);
      return {
        regions: regionRefs,
        groups: (active ? [active] : regions).map((entry) => ({ region: { slug: entry.slug, name: entry.name }, destinations: entry.destinations })),
        activeRegion: active ? { slug: active.slug, name: active.name } : null,
      };
    },

    async getHotel(slug): Promise<HotelDetail | null> {
      const record = data.hotels.find((entry) => entry.slug === slug);
      if (!record) return null;
      const type = data.hotelCategories.find((entry) => entry.slug === record.tags[0]);
      return buildHotelDetail(record, type?.label ?? record.card.badge);
    },

    /** Same destination first, then the same type, then any other hotel; best rated first within a tier. */
    async getSimilarHotels(slug, limit): Promise<HotelCardData[]> {
      const current = data.hotels.find((entry) => entry.slug === slug);
      if (!current) return [];
      const others = data.hotels.filter((entry) => entry.slug !== slug);
      const sameType = others.filter((entry) => entry.tags[0] === current.tags[0]);
      const tiers = [sameType.filter((entry) => entry.destination === current.destination), sameType, others];
      const chosen: HotelRecord[] = [];
      for (const tier of tiers) {
        for (const entry of sortMatches(tier)) if (chosen.length < limit && !chosen.includes(entry)) chosen.push(entry);
      }
      return chosen.map((entry) => entry.card);
    },

    async getExperience(slug): Promise<ExperienceDetail | null> {
      const record = data.experiences.find((entry) => entry.card.id === slug);
      if (!record) return null;
      const category = data.experienceCategories.find((entry) => entry.slug === record.categories[0]);
      return buildExperienceDetail(record, category?.label ?? record.card.category);
    },

    /** Same category and destination first, then the same category, then any other; best rated first within a tier. */
    async getSimilarExperiences(slug, limit): Promise<ExperienceCardData[]> {
      const current = data.experiences.find((entry) => entry.card.id === slug);
      if (!current) return [];
      const others = data.experiences.filter((entry) => entry.card.id !== slug);
      const sameCategory = others.filter((entry) => entry.categories[0] === current.categories[0]);
      const tiers = [sameCategory.filter((entry) => entry.destination === current.destination), sameCategory, others];
      const chosen: ExperienceRecord[] = [];
      for (const tier of tiers) {
        for (const entry of [...tier].sort((a, b) => b.card.rating - a.card.rating || b.card.reviewCount - a.card.reviewCount)) if (chosen.length < limit && !chosen.includes(entry)) chosen.push(entry);
      }
      return chosen.map((entry) => entry.card);
    },

    async getExperienceCards(ids): Promise<ExperienceCardData[]> {
      return ids.flatMap((id) => data.experiences.find((entry) => entry.card.id === id)?.card ?? []);
    },

    async getHotelCards(ids): Promise<HotelCardData[]> {
      return ids.flatMap((id) => data.hotels.find((entry) => entry.card.id === id)?.card ?? []);
    },

    async listExperienceSlugs(limit): Promise<string[]> {
      return [...data.experiences].sort((a, b) => b.card.rating - a.card.rating || b.card.reviewCount - a.card.reviewCount).slice(0, limit).map((entry) => entry.card.id);
    },

    async listHotelSlugs(limit): Promise<string[]> {
      return sortMatches(data.hotels).slice(0, limit).map((entry) => entry.slug);
    },
  };
}

export const mockCatalogService = createCatalogService(catalogFixture);
