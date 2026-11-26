import { describe, expect, it } from "vitest";
import type { Destination } from "@/interfaces";
import type { CatalogData, ExperienceRecord, HotelRecord, PackageRecord } from "../fixtures/catalog/types";
import { MIN_RESULTS, createCatalogService } from "./catalog.mock";

function destination(slug: string, region: string): Destination {
  return {
    slug,
    name: slug,
    region,
    subtitle: `${region} · 10+ experiences`,
    bestTimeToVisit: "Apr – Oct",
    averageStay: "7 nights",
    experienceCount: 10,
    fromPrice: { amount: 500, currency: "USD" },
    intro: "Intro.",
    heroImage: "/images/home/dest-bali.png",
  };
}

function experience(id: string, rating: number, destinationSlug: string, categories: string[]): ExperienceRecord {
  return {
    destination: destinationSlug,
    categories,
    card: { id, title: id, location: destinationSlug, rating, reviewCount: 10, href: `/experiences/${categories[0]}/${id}`, images: [], price: { amount: 100, currency: "USD" }, category: categories[0], provider: "p", nights: 5 },
  };
}

function hotel(id: string, rating: number, priceFrom: number, tags: string[]): HotelRecord {
  return {
    destination: "bali",
    tags,
    slug: id,
    place: "Bali",
    theme: "resort",
    priceFrom,
    card: { id, title: id, location: "bali", rating, reviewCount: 10, href: `/hotels/h/${id}`, images: [], price: { amount: priceFrom, currency: "USD" }, badge: "Resort", stars: 5, amenities: [] },
  };
}

function pkg(id: string, destinationSlug: string): PackageRecord {
  return {
    destinationSlug,
    card: { id, title: id, location: destinationSlug, rating: 4.5, reviewCount: 10, href: "/packages", images: [], price: { amount: 900, currency: "USD" }, badge: "New", category: "c", provider: "p", highlights: [], nights: 7 },
  };
}

const data: CatalogData = {
  experienceCategories: [
    { slug: "yoga", label: "Yoga", group: "Wellness", kind: "category" },
    { slug: "hiking", label: "Hiking", group: "Active", kind: "category" },
    { slug: "cycling", label: "Cycling", group: "Active", kind: "category" },
    { slug: "winter", label: "Winter", group: "Active", kind: "category" },
    { slug: "trending", label: "Trending", group: "Curated", kind: "collection" },
  ],
  hotelCategories: [
    { slug: "resorts", label: "Resorts", group: "By Type", kind: "type" },
    { slug: "lodges", label: "Lodges", group: "By Type", kind: "type" },
    { slug: "cheap", label: "Cheap", group: "By Budget", kind: "budget" },
    { slug: "luxury", label: "Luxury", group: "By Budget", kind: "budget" },
    { slug: "safari", label: "Safari", group: "By Type", kind: "type" },
  ],
  destinations: [
    destination("bali", "Asia"),
    destination("thailand", "Asia"),
    destination("nepal", "Asia"),
    destination("italy", "Europe"),
    destination("greece", "Europe"),
    destination("peru", "Americas"),
  ],
  experiences: [
    experience("y1", 4.9, "bali", ["yoga", "trending"]),
    experience("y2", 4.5, "bali", ["yoga"]),
    experience("y3", 4.7, "bali", ["yoga"]),
    experience("y4", 4.6, "thailand", ["yoga"]),
    experience("h1", 4.8, "nepal", ["hiking"]),
    experience("h2", 4.4, "italy", ["hiking"]),
    experience("c1", 4.3, "italy", ["cycling"]),
    experience("c2", 4.2, "greece", ["cycling", "yoga"]),
    experience("c3", 4.1, "bali", ["cycling"]),
  ],
  hotels: [
    hotel("r1", 4.9, 700, ["resorts"]),
    hotel("r2", 4.7, 350, ["resorts"]),
    hotel("r3", 4.5, 120, ["resorts"]),
    hotel("l1", 4.6, 90, ["lodges"]),
    hotel("l2", 4.2, 450, ["lodges"]),
  ],
  packages: [pkg("p-bali", "bali"), pkg("p-italy", "italy"), pkg("p-greece", "greece"), pkg("p-peru", "peru")],
  regions: [{ label: "Asia", intro: "Asia intro.", bestTimeToVisit: "Oct – Apr", averageStay: "10 nights" }, { label: "Europe" }, { label: "Americas" }, { label: "Oceania & Pacific" }],
  destinationFromPrice: { bali: 900, thailand: 700, nepal: 800, italy: 750, greece: 650 },
  hotelBudgetRanges: { cheap: { min: 0, max: 150 }, luxury: { min: 600 } },
  experienceTopUpAffinity: { Active: ["hiking", "cycling"] },
  hotelTopUpAffinity: { "By Type": ["resorts"] },
};

const service = createCatalogService(data);
const ids = (items: { id: string }[] | undefined) => (items ?? []).map((item) => item.id);

function reordered(source: CatalogData): CatalogData {
  return {
    ...source,
    experiences: [...source.experiences].reverse(),
    hotels: [...source.hotels].reverse(),
    destinations: [...source.destinations].reverse(),
    experienceCategories: [...source.experienceCategories].reverse(),
    hotelCategories: [...source.hotelCategories].reverse(),
  };
}

describe("getExperiencesByCategory", () => {
  it("returns only related items, best rated first, when there are enough matches", async () => {
    const result = await service.getExperiencesByCategory("yoga");
    expect(ids(result?.items)).toEqual(["y1", "y3", "y4", "y2", "c2"]);
    expect(result?.total).toBe(5);
    expect(result?.category.slug).toBe("yoga");
  });

  it("tops up from the same group first when fewer than the minimum match", async () => {
    const result = await service.getExperiencesByCategory("hiking");
    expect(result?.items).toHaveLength(MIN_RESULTS);
    expect(ids(result?.items).slice(0, 2)).toEqual(["h1", "h2"]);
    expect(["c1", "c2", "c3"]).toContain(result?.items[2].id);
  });

  it("fills a category without matches entirely from the group's affinity", async () => {
    const result = await service.getExperiencesByCategory("winter");
    expect(result?.total).toBe(MIN_RESULTS);
    for (const id of ids(result?.items)) expect(["h1", "h2", "c1", "c2", "c3"]).toContain(id);
  });

  it("falls back to any item when the affinity tier is too small", async () => {
    const result = await service.getExperiencesByCategory("trending");
    expect(result?.items[0].id).toBe("y1");
    expect(result?.total).toBe(MIN_RESULTS);
    expect(new Set(ids(result?.items)).size).toBe(MIN_RESULTS);
  });

  it("is deterministic: same call twice, and independent of the fixture order", async () => {
    for (const slug of ["hiking", "winter", "trending"]) {
      const first = await service.getExperiencesByCategory(slug);
      expect(await service.getExperiencesByCategory(slug)).toEqual(first);
      expect(await createCatalogService(reordered(data)).getExperiencesByCategory(slug)).toEqual(first);
    }
  });

  it("returns null for an unknown slug", async () => {
    expect(await service.getExperiencesByCategory("nope")).toBeNull();
  });
});

describe("getHotelsByCategory", () => {
  it("matches by tag", async () => {
    const result = await service.getHotelsByCategory("resorts");
    expect(ids(result?.items)).toEqual(["r1", "r2", "r3"]);
  });

  it("matches price ranges (min inclusive, max exclusive) and tops up", async () => {
    const cheap = await service.getHotelsByCategory("cheap");
    expect(ids(cheap?.items).slice(0, 2)).toEqual(["l1", "r3"]);
    expect(cheap?.total).toBe(MIN_RESULTS);

    const luxury = await service.getHotelsByCategory("luxury");
    expect(luxury?.items[0].id).toBe("r1");
    expect(luxury?.total).toBe(MIN_RESULTS);
  });

  it("tops up with the affinity group first, deterministically", async () => {
    const result = await service.getHotelsByCategory("safari");
    expect(ids(result?.items).sort()).toEqual(["r1", "r2", "r3"]);
    expect(await createCatalogService(reordered(data)).getHotelsByCategory("safari")).toEqual(result);
  });

  it("returns null for an unknown slug", async () => {
    expect(await service.getHotelsByCategory("nope")).toBeNull();
  });
});

describe("getDestination", () => {
  it("returns the destination's own experiences when there are enough", async () => {
    const result = await service.getDestination("bali");
    expect(result?.destination.slug).toBe("bali");
    expect(result?.category).toBeNull();
    expect(ids(result?.items)).toEqual(["y1", "y3", "y2", "c3"]);
    expect(result?.total).toBe(4);
  });

  it("restricts to the category when given", async () => {
    const result = await service.getDestination("bali", { category: "yoga" });
    expect(result?.category?.slug).toBe("yoga");
    expect(ids(result?.items)).toEqual(["y1", "y3", "y2"]);
  });

  it("tops up from the same region before other regions", async () => {
    const result = await service.getDestination("nepal");
    expect(result?.items[0].id).toBe("h1");
    expect(result?.total).toBe(MIN_RESULTS);
    for (const item of (result?.items ?? []).slice(1)) {
      const record = data.experiences.find((entry) => entry.card.id === item.id);
      expect(["bali", "thailand"]).toContain(record?.destination);
    }
  });

  it("tops up a filtered destination with the same category first", async () => {
    const result = await service.getDestination("italy", { category: "hiking" });
    expect(result?.items[0].id).toBe("h2");
    expect(result?.items[1].id).toBe("h1");
    expect(result?.items).toHaveLength(MIN_RESULTS);
  });

  it("ignores an invalid category (renders everything, no category)", async () => {
    const plain = await service.getDestination("bali");
    const result = await service.getDestination("bali", { category: "not-a-category" });
    expect(result?.category).toBeNull();
    expect(result?.items).toEqual(plain?.items);
  });

  it("is deterministic and independent of the fixture order", async () => {
    for (const query of [undefined, { category: "cycling" }]) {
      const first = await service.getDestination("peru", query);
      expect(await service.getDestination("peru", query)).toEqual(first);
      expect(await createCatalogService(reordered(data)).getDestination("peru", query)).toEqual(first);
    }
  });

  it("returns null for an unknown slug", async () => {
    expect(await service.getDestination("atlantis")).toBeNull();
  });
});

describe("getRegion", () => {
  it("computes count and lowest from-price from the region's destinations", async () => {
    const asia = (await service.getRegion("asia"))?.region;
    expect(asia).toMatchObject({ slug: "asia", name: "Asia", experienceCount: 30, fromPrice: { amount: 700, currency: "USD" }, intro: "Asia intro.", bestTimeToVisit: "Oct – Apr", averageStay: "10 nights" });
    expect(asia?.destinations.map((entry) => entry.id)).toEqual(["bali", "thailand", "nepal"]);
    expect(asia?.destinations[0]).toEqual({ id: "bali", name: "bali", region: "Asia", experienceCount: 10, href: "/destinations/bali", imageSrc: "/images/home/dest-bali.png" });
  });

  it("omits editorial fields without a value instead of guessing", async () => {
    const europe = (await service.getRegion("europe"))?.region;
    expect(europe).toBeDefined();
    for (const key of ["intro", "bestTimeToVisit", "averageStay"]) expect(europe).not.toHaveProperty(key);
  });

  it("omits the from-price when no destination has a numeric one", async () => {
    const americas = (await service.getRegion("americas"))?.region;
    expect(americas?.experienceCount).toBe(10);
    expect(americas).not.toHaveProperty("fromPrice");
  });

  it("lists region matches first, capped at 3 packages and 4 hotels, then tops up from other regions", async () => {
    const asia = await service.getRegion("asia");
    expect(ids(asia?.packages)[0]).toBe("p-bali");
    expect(asia?.packages).toHaveLength(3);
    expect(asia?.hotels).toHaveLength(4);
    const americas = await service.getRegion("americas");
    expect(ids(americas?.packages)[0]).toBe("p-peru");
    expect(americas?.hotels).toHaveLength(4);
    expect(ids((await service.getRegion("europe"))?.packages).slice(0, 2).sort()).toEqual(["p-greece", "p-italy"]);
  });

  it("drops a region without destinations and returns null for unknown slugs", async () => {
    expect(await service.getRegion("oceania-and-pacific")).toBeNull();
    expect(await service.getRegion("atlantis")).toBeNull();
    expect(await service.getRegion("bali")).toBeNull();
  });

  it("is independent of the fixture order for the computed values", async () => {
    const reorderedAsia = (await createCatalogService(reordered(data)).getRegion("asia"))?.region;
    const asia = (await service.getRegion("asia"))?.region;
    expect(reorderedAsia?.experienceCount).toBe(asia?.experienceCount);
    expect(reorderedAsia?.fromPrice).toEqual(asia?.fromPrice);
    expect(reorderedAsia?.heroImage).toBe(asia?.heroImage);
  });
});

describe("getDestinationIndex", () => {
  it("groups every destination by region in region order", async () => {
    const index = await service.getDestinationIndex();
    expect(index.activeRegion).toBeNull();
    expect(index.regions).toEqual([{ slug: "asia", name: "Asia" }, { slug: "europe", name: "Europe" }, { slug: "americas", name: "Americas" }]);
    expect(index.groups.map((group) => group.region.slug)).toEqual(["asia", "europe", "americas"]);
    expect(index.groups.flatMap((group) => group.destinations)).toHaveLength(6);
  });

  it("filters to one region while still listing all regions", async () => {
    const index = await service.getDestinationIndex("europe");
    expect(index.activeRegion).toEqual({ slug: "europe", name: "Europe" });
    expect(index.regions).toHaveLength(3);
    expect(index.groups.map((group) => group.region.slug)).toEqual(["europe"]);
    expect(index.groups[0].destinations.map((entry) => entry.id)).toEqual(["italy", "greece"]);
  });

  it("ignores an unknown region (no filter)", async () => {
    expect(await service.getDestinationIndex("atlantis")).toEqual(await service.getDestinationIndex());
  });
});

describe("getExperienceGroup", () => {
  it("is the union of the real matches of every category in the group, de-duplicated, best rated first", async () => {
    const result = await service.getExperienceGroup("active");
    expect(result?.group).toEqual({ slug: "active", title: "Active" });
    expect(ids(result?.items)).toEqual(["h1", "h2", "c1", "c2", "c3"]);
    expect(result?.total).toBe(5);
    expect(result?.active).toBeNull();
  });

  it("lists the group's own categories as chips in menu order", async () => {
    expect((await service.getExperienceGroup("active"))?.chips).toEqual([
      { slug: "hiking", label: "Hiking" },
      { slug: "cycling", label: "Cycling" },
      { slug: "winter", label: "Winter" },
    ]);
  });

  it("counts a card once even when it matches several categories of the group", async () => {
    const result = await service.getExperienceGroup("wellness");
    expect(ids(result?.items)).toEqual(["y1", "y3", "y4", "y2", "c2"]);
  });

  it("returns exactly the category listing for a valid in-group category", async () => {
    const category = await service.getExperiencesByCategory("hiking");
    const result = await service.getExperienceGroup("active", "hiking");
    expect(result?.items).toEqual(category?.items);
    expect(result?.active).toEqual({ slug: "hiking", label: "Hiking" });
    expect(result?.total).toBe(category?.total);
    expect(result?.chips).toHaveLength(3);
  });

  it("ignores an unknown or out-of-group category (ALL)", async () => {
    const all = await service.getExperienceGroup("active");
    expect(await service.getExperienceGroup("active", "yoga")).toEqual(all);
    expect(await service.getExperienceGroup("active", "nope")).toEqual(all);
  });

  it("tops up deterministically only when the union has fewer than the minimum", async () => {
    const result = await service.getExperienceGroup("curated");
    expect(result?.total).toBe(MIN_RESULTS);
    expect(result?.items[0].id).toBe("y1");
    expect(new Set(ids(result?.items)).size).toBe(MIN_RESULTS);
    expect((await createCatalogService(reordered(data)).getExperienceGroup("curated"))?.items).toEqual(result?.items);
  });

  it("returns null for an unknown group", async () => {
    expect(await service.getExperienceGroup("nope")).toBeNull();
    expect(await service.getExperienceGroup("groups")).toBeNull();
  });
});

describe("getHotelGroup", () => {
  it("is the union of tag matches of every category in the group, best rated first", async () => {
    const result = await service.getHotelGroup("by-type");
    expect(result?.group).toEqual({ slug: "by-type", title: "By Type" });
    expect(ids(result?.items)).toEqual(["r1", "r2", "l1", "r3", "l2"]);
    expect(result?.chips.map((chip) => chip.slug)).toEqual(["resorts", "lodges", "safari"]);
  });

  it("includes price-range matches for budget groups, without fillers when there are enough", async () => {
    const result = await service.getHotelGroup("by-budget");
    expect(ids(result?.items)).toEqual(["r1", "l1", "r3"]);
    expect(result?.total).toBe(3);
  });

  it("returns exactly the category listing for a valid in-group category", async () => {
    const category = await service.getHotelsByCategory("cheap");
    const result = await service.getHotelGroup("by-budget", "cheap");
    expect(result?.items).toEqual(category?.items);
    expect(result?.active).toEqual({ slug: "cheap", label: "Cheap" });
  });

  it("ignores a category from another group and returns null for an unknown group", async () => {
    expect(await service.getHotelGroup("by-budget", "resorts")).toEqual(await service.getHotelGroup("by-budget"));
    expect(await service.getHotelGroup("nope")).toBeNull();
  });

  it("has the same cards whatever the fixture order (chips follow the registry order)", async () => {
    expect((await createCatalogService(reordered(data)).getHotelGroup("by-budget"))?.items).toEqual((await service.getHotelGroup("by-budget"))?.items);
  });
});
