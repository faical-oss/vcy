import { packageDetail } from "@/constants/routes";
import { fnv1a } from "@/helpers/seeded-pick";
import { slugify } from "@/helpers/slugify";
import type { ISearchService, PackageCardData, SearchFacets, SearchOption, SearchParams, SearchResponse, SearchResultItem } from "@/interfaces";
import { catalogFixture } from "../fixtures/catalog";
import { buildExperienceDetail } from "../fixtures/catalog/experience-detail-builder";
import { packageSources } from "../fixtures/catalog/package-sources";
import { packages as homePackages } from "../fixtures/home/packages";
import { lifestylePages } from "../fixtures/lifestyle";

/** Stand-in for the API round trip. */
const DELAY_MS = 500;

const option = (label: string): SearchOption => ({ label, slug: slugify(label) });
const BOARD = ["Room only", "Breakfast included", "Half board", "Full board", "All-inclusive"].map(option);
/** The amenity filter options, each matched by a keyword in the hotels' free-text amenities. */
const AMENITY_KEYWORDS: [SearchOption, RegExp][] = [
  [option("Pool"), /pool/i],
  [option("Spa"), /spa|thermal|hydro/i],
  [option("Yoga studio"), /yoga/i],
  [option("Gym"), /fitness|gym/i],
  [option("Beach access"), /beach/i],
  [option("Restaurant"), /dining|restaurant|cooking/i],
  [option("Organic dining"), /organic|farm|vegan/i],
  [option("Meditation centre"), /meditation/i],
  [option("Diving centre"), /diving|undersea/i],
];
/** The hotel types of the search box (Figma lists) mapped to the catalog's hotel tags; a type with no tag matches nothing. */
const HOTEL_TYPE_TAGS: Record<string, string[]> = {
  "luxury-resort": ["luxury-spa-hotels"],
  "boutique-hotel": ["boutique-retreats"],
  "eco-lodge": ["eco-lodges"],
  "city-centre-hotel": ["city-wellness-hotels"],
  "beach-resort": ["beach-resorts"],
  "mountain-lodge": ["mountain-retreats"],
  "overwater-villa": ["overwater-villas"],
};

/*
 * The filter vocabularies of the Figma prototype's Packages and Experiences tabs. The catalog has no such fields, so each result is
 * given its values here, in a fixed pattern (TODO(api): they come with the product). The options of a search are the ones its results have.
 */
const PACKAGE_TYPES = ["Luxury", "Adventure", "Wellness & Detox", "Family", "Solo Retreat", "Eco & Sustainable", "Cultural", "Spa", "Anniversary", "Girls' Getaway"].map(option);
const PACKAGE_INCLUSIONS = ["Accommodation", "Full board", "Half board", "Breakfast", "Airport transfers", "Excursions", "Spa treatments", "Yoga classes"].map(option);
const TRAVEL_STYLES = ["All-inclusive", "Self-guided", "Guided group", "Private guided", "Wellness-focused"].map(option);
const EXPERIENCE_TYPES = ["Yoga Retreats", "Wellness & Spa", "Meditation", "Hiking & Trekking", "Cycling", "Diving", "Safari", "Culinary", "Spiritual", "Fitness", "Detox"].map(option);
const EXPERIENCE_INCLUDED = ["Accommodation", "All meals", "Breakfast only", "Spa treatments", "Yoga classes", "Airport transfers", "Guided excursions", "Equipment"].map(option);
const GROUP_SIZES = ["Solo-friendly", "Couples", "Small group (max 10)", "Medium group (max 20)", "Large group"].map(option);
const DIFFICULTIES = ["Easy", "Moderate", "Challenging", "Strenuous"].map(option);
const DURATIONS: [SearchOption, number, number][] = [
  [option("Weekend (1–3 nights)"), 1, 3],
  [option("Short (4–6 nights)"), 4, 6],
  [option("Week (7 nights)"), 7, 7],
  [option("Extended (8–13 nights)"), 8, 13],
  [option("2 weeks+"), 14, Number.POSITIVE_INFINITY],
];
const durationOf = (nights: number) => DURATIONS.filter(([, min, max]) => nights >= min && nights <= max).map(([entry]) => entry);
/** The `index`-th value of a vocabulary, shifted per attribute so the attributes do not line up. */
const pick = (vocabulary: SearchOption[], index: number, shift: number) => [vocabulary[(index + shift) % vocabulary.length]];
const pickMany = (vocabulary: SearchOption[], index: number, count: number) => Array.from({ length: count }, (_, step) => vocabulary[(index * 3 + step) % vocabulary.length]);
/** The first vocabulary entry whose keyword is in the text, else the `index`-th one. */
const typeOf = (vocabulary: SearchOption[], keywords: [RegExp, string][], text: string, index: number) => {
  const hit = keywords.find(([keyword]) => keyword.test(text));
  return vocabulary.filter((entry) => entry.label === hit?.[1]).concat(vocabulary[index % vocabulary.length]).slice(0, 1);
};
const PACKAGE_TYPE_KEYWORDS: [RegExp, string][] = [[/luxury/i, "Luxury"], [/adventure|surf|trek|expedition/i, "Adventure"], [/detox|wellness/i, "Wellness & Detox"], [/family/i, "Family"], [/solo/i, "Solo Retreat"], [/eco|sustain/i, "Eco & Sustainable"], [/cultur/i, "Cultural"], [/spa|thermal/i, "Spa"], [/couple|romance|anniversary/i, "Anniversary"]];
const EXPERIENCE_TYPE_KEYWORDS: [RegExp, string][] = [[/yoga/i, "Yoga Retreats"], [/spa|thermal|ayurveda/i, "Wellness & Spa"], [/meditat|mindful/i, "Meditation"], [/hik|trek/i, "Hiking & Trekking"], [/cycl/i, "Cycling"], [/div|scuba/i, "Diving"], [/safari/i, "Safari"], [/culinary|cooking/i, "Culinary"], [/spiritual/i, "Spiritual"], [/fitness|bootcamp/i, "Fitness"], [/detox/i, "Detox"]];

type Group = "types" | "amenities" | "board" | "duration" | "groupSize" | "difficulty";
/** The order of the options of a group, where the prototype fixes one (hotels list theirs as the data gives them). */
const ORDER: Record<SearchParams["type"], Partial<Record<Group, SearchOption[]>>> = {
  hotel: { board: BOARD, amenities: AMENITY_KEYWORDS.map(([entry]) => entry) },
  experience: { types: EXPERIENCE_TYPES, amenities: EXPERIENCE_INCLUDED, duration: DURATIONS.map(([entry]) => entry), groupSize: GROUP_SIZES, difficulty: DIFFICULTIES },
  package: { types: PACKAGE_TYPES, amenities: PACKAGE_INCLUSIONS, board: TRAVEL_STYLES, duration: DURATIONS.map(([entry]) => entry) },
};

interface Candidate {
  item: SearchResultItem;
  place: SearchOption;
  typeSlugs: string[];
  /** The values of each filter group this result has. */
  attrs: Partial<Record<Group, SearchOption[]>>;
  stars: number;
  base: number;
}

const placeName = (slug: string) => catalogFixture.destinations.find((entry) => entry.slug === slug)?.name ?? slug;
const place = (slug: string): SearchOption => ({ label: placeName(slug), slug });
/** "Popoyo, Nicaragua" -> Nicaragua; a location without a comma is its own place ("Scottish Highlands"). */
const countryOf = (location: string): SearchOption => option(location.split(",").pop()?.trim() ?? location);

/** All the packages that have a detail page (the Lifestyle ones and the Home ones), with the highlights of the Lifestyle page that lists them. */
function packageCards(): PackageCardData[] {
  const refs = Object.values(lifestylePages).flatMap((page) => page.packageRefs);
  return packageSources.map((source) => ({
    id: source.id,
    title: source.title,
    badge: source.badge,
    category: source.category,
    provider: source.provider,
    location: source.location,
    rating: source.rating,
    reviewCount: source.reviewCount,
    highlights: refs.find((ref) => ref.id === source.id)?.highlights ?? homePackages.find((card) => card.id === source.id)?.highlights ?? [],
    nights: source.nights,
    price: source.price,
    href: packageDetail(source.id),
    images: source.images,
  }));
}

/** A package's place: a catalog destination named in its location ("Bali, Indonesia"), else its country. */
const packagePlace = (location: string): SearchOption => {
  const known = [...catalogFixture.destinations].sort((a, b) => b.name.length - a.name.length).find((entry) => location.toLowerCase().includes(entry.name.toLowerCase()));
  return known ? { label: known.name, slug: known.slug } : countryOf(location);
};

const candidates: Record<SearchParams["type"], Candidate[]> = {
  hotel: catalogFixture.hotels.map(({ card, destination, tags }) => ({
    item: { kind: "hotel", ...card, availability: "unknown" },
    place: place(destination),
    typeSlugs: [slugify(card.badge), ...tags],
    attrs: {
      types: [option(card.badge)],
      amenities: AMENITY_KEYWORDS.filter(([, keyword]) => card.amenities.some((entry) => keyword.test(entry))).map(([entry]) => entry),
      board: [BOARD[fnv1a(card.id) % BOARD.length]],
    },
    stars: card.stars,
    base: card.price?.amount ?? 0,
  })),
  experience: catalogFixture.experiences.map((record, index) => {
    const { card, destination, categories } = record;
    // The badge, the group size and what is included come from the experience's detail page, so the list says what the page says.
    const detail = buildExperienceDetail(record, card.category);
    return {
    item: { kind: "experience", ...card, badge: detail.badge, groupMax: detail.groupSize.max, inclusions: detail.included.filter((entry) => entry.included).slice(0, 4).map((entry) => entry.text), availability: "unknown" },
    place: place(destination),
    typeSlugs: categories,
    attrs: {
      types: typeOf(EXPERIENCE_TYPES, EXPERIENCE_TYPE_KEYWORDS, `${card.category} ${categories.join(" ")} ${card.title}`, index),
      duration: durationOf(card.nights),
      groupSize: pick(GROUP_SIZES, index, 2),
      difficulty: pick(DIFFICULTIES, index, 1),
      amenities: pickMany(EXPERIENCE_INCLUDED, index, 3),
    },
    stars: 0,
    base: card.price?.amount ?? 0,
    };
  }),
  package: packageCards().map((card, index) => ({
    item: { kind: "package", ...card, availability: "unknown" },
    place: packagePlace(card.location),
    typeSlugs: [slugify(card.category)],
    attrs: {
      types: typeOf(PACKAGE_TYPES, PACKAGE_TYPE_KEYWORDS, `${card.category} ${card.badge} ${card.title}`, index),
      duration: durationOf(card.nights),
      amenities: pickMany(PACKAGE_INCLUSIONS, index, 3),
      board: pick(TRAVEL_STYLES, index, 3),
    },
    stars: 0,
    base: card.price?.amount ?? 0,
  })),
};

const distinct = (options: SearchOption[]) => [...new Map(options.map((entry) => [entry.slug, entry])).values()];

function matchesSearch(candidate: Candidate, { category, destination, q, type }: SearchParams): boolean {
  const location = candidate.item.location.toLowerCase();
  const text = `${candidate.item.title} ${candidate.item.location} ${candidate.attrs.types?.[0]?.label ?? ""}`.toLowerCase();
  if (category && !candidate.typeSlugs.includes(category) && !(type === "hotel" && HOTEL_TYPE_TAGS[category]?.some((tag) => candidate.typeSlugs.includes(tag)))) return false;
  if (destination && !destination.split("-").every((word) => location.includes(word))) return false;
  return !q || q.toLowerCase().split(/\s+/).every((word) => text.includes(word));
}

const facetsOf = (type: SearchParams["type"], pool: Candidate[]): SearchFacets => {
  const options = (group: Group) => {
    const present = distinct(pool.flatMap((entry) => entry.attrs[group] ?? []));
    const order = ORDER[type][group];
    return order ? order.filter((entry) => present.some((have) => have.slug === entry.slug)) : present;
  };
  return {
    types: options("types"),
    stars: [...new Set(pool.map((entry) => entry.stars).filter(Boolean))].sort((a, b) => b - a),
    places: distinct(pool.map((entry) => entry.place)),
    amenities: options("amenities"),
    board: options("board"),
    duration: options("duration"),
    groupSize: options("groupSize"),
    difficulty: options("difficulty"),
  };
};

/**
 * The one mock function behind the results page: it searches, filters, sorts and pages the catalog fixture, prices hotels for the
 * dates and marks availability per scenario (`partial`: every third result sold out; `none`: no results; `error`: fails).
 * TODO(api): replaced by the Trip Fusion search, which returns the same `SearchResponse` (price and availability per result).
 */
export const mockSearchService: ISearchService = {
  async search(params, options = {}) {
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    if (options.scenario === "error") throw new Error("mock search error");
    const pool = candidates[params.type].filter((entry) => matchesSearch(entry, params));
    const { filters, stay } = params;
    const month = stay?.checkIn.slice(0, 7) ?? "";

    const priced = pool.map((entry) => {
      // Hotels vary by season (90-120% of the base rate); experiences and packages keep their price per person.
      const rate = entry.item.kind === "hotel" ? Math.round(entry.base * (0.9 + (fnv1a(entry.item.id + month) % 31) / 100)) : entry.base;
      const availability = !stay ? "unknown" : options.scenario === "partial" && fnv1a(entry.item.id) % 3 === 0 ? "unavailable" : "available";
      const price = availability === "available" ? { amount: rate, currency: "USD" } : undefined;
      return { entry, rate, item: { ...entry.item, price, availability } as SearchResultItem };
    });

    const kept = priced.filter(({ entry, rate }) => {
      if (filters.minPrice !== undefined && rate < filters.minPrice) return false;
      if (filters.maxPrice !== undefined && rate > filters.maxPrice) return false;
      for (const group of ["types", "board", "duration", "groupSize", "difficulty"] as const) {
        const wanted = filters[group];
        if (wanted?.length && !wanted.some((slug) => entry.attrs[group]?.some((have) => have.slug === slug))) return false;
      }
      if (filters.stars?.length && !filters.stars.includes(entry.stars)) return false;
      if (filters.places?.length && !filters.places.includes(entry.place.slug)) return false;
      if (filters.amenities?.length && !filters.amenities.every((slug) => entry.attrs.amenities?.some((have) => have.slug === slug))) return false;
      return !filters.rating || Math.round(entry.item.rating ?? 0) >= filters.rating;
    });

    const by = {
      recommended: () => 0,
      "price-asc": (a: (typeof kept)[number], b: (typeof kept)[number]) => a.rate - b.rate,
      "price-desc": (a: (typeof kept)[number], b: (typeof kept)[number]) => b.rate - a.rate,
      "top-rated": (a: (typeof kept)[number], b: (typeof kept)[number]) => (b.item.rating ?? 0) - (a.item.rating ?? 0),
      stars: (a: (typeof kept)[number], b: (typeof kept)[number]) => b.entry.stars - a.entry.stars || (b.item.rating ?? 0) - (a.item.rating ?? 0),
    }[params.sort];
    // Sold-out results go last, whatever the sort.
    const sorted = [...kept].sort(by).sort((a, b) => Number(a.item.availability === "unavailable") - Number(b.item.availability === "unavailable"));
    const total = options.scenario === "none" ? 0 : sorted.length;
    const start = (params.page - 1) * params.pageSize;
    const items = options.scenario === "none" ? [] : sorted.slice(start, start + params.pageSize).map(({ item }) => item);
    return { items, total, page: params.page, pageSize: params.pageSize, facets: facetsOf(params.type, pool) } satisfies SearchResponse;
  },
};
