import { beforeEach, describe, expect, it, vi } from "vitest";

const { cacheLife, cacheTag } = vi.hoisted(() => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("next/cache", () => ({ cacheLife, cacheTag }));

import { STATIC_PARAMS_SEED } from "@/constants/site";
import { destinationMetadata } from "./listing-content";
import { getDestination, getDestinationFilterCategories, getDestinationIndex, getDestinationPageSlugs, getDestinationSlugs, getRegion, getRegionSlugs, getExperienceCategorySlugs, getHotelCategorySlugs, getExperiencesByCategory, getHotelsByCategory, getExperienceGroup, getHotelGroup } from "./get-catalog";

describe("catalog feature functions (mock service)", () => {
  beforeEach(() => {
    vi.stubEnv("USE_MOCKS", "true");
    vi.clearAllMocks();
  });

  it("returns only related experiences when enough match, with the total", async () => {
    const result = await getExperiencesByCategory("yoga-retreats");
    expect(result?.category).toMatchObject({ slug: "yoga-retreats", label: "Yoga Retreats", group: "Wellness" });
    expect(result?.items.length).toBeGreaterThanOrEqual(4);
    expect(result?.total).toBe(result?.items.length);
    expect(result?.items.slice(0, 4).every((item) => item.href.startsWith("/experiences/"))).toBe(true);
  });

  it("tops up a thin category to at least three cards", async () => {
    const result = await getExperiencesByCategory("winter-sports");
    expect(result?.total).toBeGreaterThanOrEqual(3);
  });

  it("returns hotels by tag, brand and price range", async () => {
    expect((await getHotelsByCategory("eco-lodges"))?.items).toHaveLength(6);
    const cheap = await getHotelsByCategory("under-150-night");
    expect(cheap?.items.map((item) => item.title)).toEqual(expect.arrayContaining(["Himalayan Stone Lodge", "Kerala Backwater Eco Retreat", "Ubud Rice Terrace Lodge"]));
    expect(cheap?.total).toBe(3);
    expect((await getHotelsByCategory("aman-resorts"))?.items[0].title).toBe("Aman Tokyo");
  });

  it("returns group listings with chips, validates slugs and filters by an in-group category", async () => {
    const all = await getExperienceGroup("wellness");
    expect(all?.group).toEqual({ slug: "wellness", title: "Wellness" });
    expect(all?.chips).toHaveLength(9);
    expect(all?.active).toBeNull();
    const yoga = await getExperienceGroup("wellness", "yoga-retreats");
    expect(yoga?.items).toEqual((await getExperiencesByCategory("yoga-retreats"))?.items);
    expect(yoga?.active).toEqual({ slug: "yoga-retreats", label: "Yoga Retreats" });
    expect(await getExperienceGroup("wellness", "hiking-and-trekking")).toEqual(all);
    expect(await getExperienceGroup("wellness", "Not A Slug!")).toEqual(all);
    expect(await getExperienceGroup("nope")).toBeNull();
    expect(await getExperienceGroup("Bad Slug")).toBeNull();
    expect((await getHotelGroup("by-budget", "under-150-night"))?.items).toEqual((await getHotelsByCategory("under-150-night"))?.items);
    expect(await getHotelGroup("wellness")).toBeNull();
    expect(await getHotelGroup("../x")).toBeNull();
  });

  it("returns a destination with facts, and filters by category", async () => {
    const bali = await getDestination("bali-indonesia");
    expect(bali?.destination).toMatchObject({ name: "Bali", subtitle: "Indonesia · 240+ experiences", fromPrice: { amount: 899, currency: "USD" } });
    expect(bali?.category).toBeNull();
    expect(bali?.items.every((item) => item.location.endsWith("Bali"))).toBe(true);

    const yoga = await getDestination("bali-indonesia", { category: "yoga-retreats" });
    expect(yoga?.category?.slug).toBe("yoga-retreats");
    expect(yoga?.items.map((item) => item.category)).toEqual(expect.arrayContaining(["Yoga Retreats"]));
    expect(yoga?.items.length).toBeLessThan(bali?.items.length ?? 0);
  });

  it("ignores an invalid or malformed destination category", async () => {
    const plain = await getDestination("thailand");
    for (const category of ["not-a-category", "UPPER", "a b", "../x", "", "a".repeat(200)]) {
      const result = await getDestination("thailand", { category });
      expect(result?.category).toBeNull();
      expect(result?.items).toEqual(plain?.items);
    }
  });

  it("returns null for unknown and malformed slugs without reaching the cache", async () => {
    expect(await getExperiencesByCategory("nope")).toBeNull();
    expect(await getHotelsByCategory("nope")).toBeNull();
    expect(await getDestination("atlantis")).toBeNull();
    cacheTag.mockClear();
    expect(await getExperiencesByCategory("Yoga Retreats")).toBeNull();
    expect(await getHotelsByCategory("../etc")).toBeNull();
    expect(await getDestination("")).toBeNull();
    expect(cacheTag).not.toHaveBeenCalled();
  });

  it("declares the cache lifetime and tag", async () => {
    await getDestination("italy");
    expect(cacheLife).toHaveBeenCalledWith("hours");
    expect(cacheTag).toHaveBeenCalledWith("catalog");
  });

  it("is deterministic across calls", async () => {
    expect(await getExperiencesByCategory("safari-and-wildlife")).toEqual(await getExperiencesByCategory("safari-and-wildlife"));
    expect(await getHotelsByCategory("safari-lodges")).toEqual(await getHotelsByCategory("safari-lodges"));
  });

  it("lists the experience category slugs linked from the header menu", async () => {
    const slugs = await getExperienceCategorySlugs();
    expect(slugs).toHaveLength(46);
    expect(slugs).toEqual(expect.arrayContaining(["yoga-retreats", "hiking-and-trekking", "trending-now"]));
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(await getExperiencesByCategory(slug)).not.toBeNull();
  });

  it("lists the hotel category slugs linked from the header menu", async () => {
    const slugs = await getHotelCategorySlugs();
    expect(slugs).toHaveLength(43);
    expect(slugs).toEqual(expect.arrayContaining(["eco-lodges", "yoga-focused", "under-150-night", "six-senses-hotels", "chiva-som-samui", "new-openings"]));
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(await getHotelsByCategory(slug)).not.toBeNull();
  });

  it("lists the unique destination slugs linked from the header menu, without the all-destinations link", async () => {
    const slugs = await getDestinationSlugs();
    expect(slugs).toHaveLength(54);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toEqual(expect.arrayContaining(["bali-indonesia", "thailand", "italy", "maldives", "sri-lanka", "zanzibar"]));
    expect(slugs).not.toContain("");
    expect(slugs.every((slug) => !slug.includes("/"))).toBe(true);
    for (const slug of slugs) {
      const listing = await getDestination(slug);
      expect(listing).not.toBeNull();
      expect(destinationMetadata(listing!.destination).description.length).toBeLessThanOrEqual(160);
    }
  });

  it("offers the filter categories in chip order with their catalog labels", async () => {
    expect(await getDestinationFilterCategories()).toEqual([
      { slug: "yoga-retreats", label: "Yoga Retreats" },
      { slug: "holistic-wellness", label: "Holistic Wellness" },
      { slug: "hiking-and-trekking", label: "Hiking & Trekking" },
      { slug: "meditation-retreats", label: "Meditation Retreats" },
      { slug: "cycling-tours", label: "Cycling Tours" },
      { slug: "diving-trips", label: "Diving Trips" },
    ]);
  });

  it("falls back to the seed slugs when no navigation is configured, and an unknown slug resolves to nothing", async () => {
    vi.stubEnv("USE_MOCKS", "false");
    expect(await getExperienceCategorySlugs()).toEqual([...STATIC_PARAMS_SEED.experienceCategories]);
    expect(await getHotelCategorySlugs()).toEqual([...STATIC_PARAMS_SEED.hotelCategories]);
    expect(await getDestinationSlugs()).toEqual([]);
    expect(await getDestinationFilterCategories()).toEqual([]);
    vi.stubEnv("USE_MOCKS", "true");
    expect(await getExperiencesByCategory("not-configured")).toBeNull();
    expect(await getHotelsByCategory("not-configured")).toBeNull();
    expect(await getDestination("not-configured")).toBeNull();
  });

  it("returns a region with computed facts, its destinations, packages and hotels", async () => {
    const asia = await getRegion("asia");
    expect(asia?.region).toMatchObject({ slug: "asia", name: "Asia", experienceCount: 1435, fromPrice: { amount: 599, currency: "USD" }, bestTimeToVisit: "Oct – Apr", averageStay: "10 nights" });
    expect(asia?.destinations).toBe(asia?.region.destinations);
    expect(asia?.destinations).toHaveLength(11);
    expect(asia?.packages).toHaveLength(3);
    expect(asia?.hotels).toHaveLength(4);
  });

  it("computes region numbers from the catalog and has editorial content for every region", async () => {
    const expected: Record<string, { count: number; from: string }> = {
      asia: { count: 1435, from: "$599" },
      europe: { count: 840, from: "$549" },
      americas: { count: 635, from: "$649" },
      "africa-and-middle-east": { count: 370, from: "$699" },
      "oceania-and-pacific": { count: 255, from: "$1,099" },
      "indian-ocean": { count: 100, from: "$999" },
    };
    for (const [slug, { count, from }] of Object.entries(expected)) {
      const region = (await getRegion(slug))?.region;
      expect(region?.experienceCount, slug).toBe(count);
      expect(region?.fromPrice, slug).toEqual({ amount: Number(from.replace(/[$,]/g, "")), currency: "USD" });
      expect(region?.heroImage, slug).not.toBe("");
      expect(region?.intro, slug).toBeTruthy();
      expect(region?.bestTimeToVisit, slug).toBeTruthy();
      expect(region?.averageStay, slug).toBeTruthy();
    }
  });

  it("always shows 3 packages and 4 hotels per region, topping up deterministically", async () => {
    for (const slug of await getRegionSlugs()) {
      const first = await getRegion(slug);
      expect(first?.packages, slug).toHaveLength(3);
      expect(first?.hotels, slug).toHaveLength(4);
      expect(await getRegion(slug), slug).toEqual(first);
    }
    const indianOcean = await getRegion("indian-ocean");
    expect(indianOcean?.destinations.map((entry) => entry.id)).toEqual(["seychelles", "mauritius", "reunion", "madagascar"]);
  });

  it("gives every destination page 3 packages and 4 hotels, its own first", async () => {
    for (const slug of await getDestinationSlugs()) {
      const listing = await getDestination(slug);
      expect(listing?.packages, slug).toHaveLength(3);
      expect(listing?.hotels, slug).toHaveLength(4);
    }
    expect((await getDestination("italy"))?.packages.map((card) => card.id)).toContain("tuscany-wellness");
  });

  it("returns null for unknown or malformed region slugs and for destination slugs", async () => {
    expect(await getRegion("atlantis")).toBeNull();
    expect(await getRegion("Asia")).toBeNull();
    expect(await getRegion("thailand")).toBeNull();
  });

  it("does not let a region slug resolve as a destination", async () => {
    for (const slug of await getRegionSlugs()) expect(await getDestination(slug), slug).toBeNull();
  });

  it("lists region and destination slugs that never overlap", async () => {
    const regions = await getRegionSlugs();
    expect(regions).toEqual(["asia", "europe", "americas", "africa-and-middle-east", "oceania-and-pacific", "indian-ocean"]);
    const destinations = await getDestinationSlugs();
    expect(destinations.filter((slug) => regions.includes(slug))).toEqual([]);
    const all = await getDestinationPageSlugs();
    expect(all).toHaveLength(destinations.length + regions.length);
    expect(new Set(all).size).toBe(all.length);
  });

  it("builds the destination index with an optional server-side region filter", async () => {
    const all = await getDestinationIndex();
    expect(all.activeRegion).toBeNull();
    expect(all.regions.map((region) => region.slug)).toContain("oceania-and-pacific");
    expect(all.groups).toHaveLength(6);
    expect(all.groups.flatMap((group) => group.destinations)).toHaveLength(54);

    const europe = await getDestinationIndex({ region: "europe" });
    expect(europe.activeRegion).toEqual({ slug: "europe", name: "Europe" });
    expect(europe.regions).toEqual(all.regions);
    expect(europe.groups.map((group) => group.region.slug)).toEqual(["europe"]);

    for (const region of ["atlantis", "UPPER", "../x", ""]) expect(await getDestinationIndex({ region })).toEqual(all);
  });

  it("soft-fails region reads when no catalog is configured", async () => {
    vi.stubEnv("USE_MOCKS", "false");
    expect(await getRegion("asia")).toBeNull();
    expect(await getDestinationIndex()).toEqual({ regions: [], groups: [], activeRegion: null });
    expect(await getRegionSlugs()).toEqual([]);
    expect(await getDestinationPageSlugs()).toEqual([...STATIC_PARAMS_SEED.destinations]);
  });
});
