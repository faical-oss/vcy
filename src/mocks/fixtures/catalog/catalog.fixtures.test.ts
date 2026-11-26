import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { experienceDetail, hotelDetail } from "@/constants/routes";
import { slugify } from "@/helpers/slugify";
import { EXPERIENCE_GROUPS, HOTEL_GROUPS, experienceCategories, hotelCategories } from "./categories";
import { catalogFixture } from "./index";
import { destinationFromPrice, destinationRegistry } from "./destinations";
import { experienceRecords, EXPERIENCE_IMAGE_THEMES } from "./experiences";
import { packages as homePackages } from "../home/packages";
import { hotelRecords } from "./hotels";
import { packageRecords } from "./packages";
import { regionEditorial } from "./regions";
import { IMAGE_POOLS } from "./images";

const ALLOWED_REMOTE_HOSTS = ["images.unsplash.com", "i.assetzen.net"];
const PUBLIC_DIR = path.resolve(import.meta.dirname, "../../../../public");
const allPoolImages = new Set(Object.values(IMAGE_POOLS).flat());

function isAllowedImage(src: string): boolean {
  if (src.startsWith("/")) return existsSync(path.join(PUBLIC_DIR, src));
  return ALLOWED_REMOTE_HOSTS.includes(new URL(src).hostname);
}

describe("catalog fixture sizes", () => {
  it("has the category registries from the menu", () => {
    expect(experienceCategories).toHaveLength(46);
    expect(hotelCategories).toHaveLength(43);
    expect(EXPERIENCE_GROUPS).toHaveLength(6);
    expect(HOTEL_GROUPS).toHaveLength(6);
  });

  it("has unique category slugs", () => {
    expect(new Set(experienceCategories.map((c) => c.slug)).size).toBe(46);
    expect(new Set(hotelCategories.map((c) => c.slug)).size).toBe(43);
  });

  it("has the content pools", () => {
    expect(experienceRecords).toHaveLength(24);
    expect(hotelRecords).toHaveLength(20);
    expect(destinationRegistry).toHaveLength(54);
    expect(new Set(destinationRegistry.map((d) => d.slug)).size).toBe(54);
  });
});

describe("destination registry", () => {
  it("gives every destination complete facts", () => {
    for (const entry of destinationRegistry) {
      expect(entry.slug).toBe(slugify(entry.slug));
      expect(entry.name).not.toBe("");
      expect(entry.bestTimeToVisit).toMatch(/^[A-Z][a-z]{2} – [A-Z][a-z]{2}$/);
      expect(entry.averageStay).toMatch(/^\d+ nights$/);
      expect(entry.fromPrice.currency).toBe("USD");
      expect(entry.fromPrice.amount).toBeGreaterThan(0);
      expect(entry.experienceCount).toBeGreaterThan(0);
      expect(entry.subtitle).toBe(`${entry.subtitle.split(" · ")[0]} · ${entry.experienceCount}+ experiences`);
      expect(entry.intro.length).toBeGreaterThan(30);
      expect(isAllowedImage(entry.heroImage)).toBe(true);
    }
  });

  it("uses the reference facts for Bali, Thailand and Italy", () => {
    const bySlug = new Map(destinationRegistry.map((d) => [d.slug, d]));
    expect(bySlug.get("bali-indonesia")).toMatchObject({ subtitle: "Indonesia · 240+ experiences", bestTimeToVisit: "Apr – Oct", averageStay: "10 nights", fromPrice: { amount: 899, currency: "USD" } });
    expect(bySlug.get("thailand")).toMatchObject({ subtitle: "Southeast Asia · 310+ experiences", bestTimeToVisit: "Nov – Apr", averageStay: "9 nights", fromPrice: { amount: 749, currency: "USD" } });
    expect(bySlug.get("italy")).toMatchObject({ subtitle: "Europe · 190+ experiences", bestTimeToVisit: "Apr – Jun", averageStay: "8 nights", fromPrice: { amount: 749, currency: "USD" } });
  });

  it("hand-writes the eight core destinations", () => {
    const core = ["bali-indonesia", "thailand", "italy", "japan", "costa-rica", "greece", "morocco", "maldives"];
    for (const slug of core) expect(destinationRegistry.some((d) => d.slug === slug)).toBe(true);
  });
});

describe("experience records", () => {
  const categorySlugs = new Set(experienceCategories.map((c) => c.slug));
  const destinationSlugs = new Map(destinationRegistry.map((d) => [d.slug, d]));

  it("only uses known categories and destinations, with unique ids", () => {
    expect(new Set(experienceRecords.map((r) => r.card.id)).size).toBe(experienceRecords.length);
    for (const record of experienceRecords) {
      for (const slug of record.categories) expect(categorySlugs.has(slug)).toBe(true);
      expect(destinationSlugs.has(record.destination)).toBe(true);
    }
  });

  it("keeps each location inside its destination", () => {
    for (const record of experienceRecords) {
      expect(record.card.location.endsWith(destinationSlugs.get(record.destination)?.name ?? "?")).toBe(true);
    }
  });

  it("spreads over 6-8 destinations and 6 base categories of 4", () => {
    expect(new Set(experienceRecords.map((r) => r.destination)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(experienceRecords.map((r) => r.destination)).size).toBeLessThanOrEqual(8);
    const primaries = new Map<string, number>();
    for (const record of experienceRecords) primaries.set(record.categories[0], (primaries.get(record.categories[0]) ?? 0) + 1);
    expect([...primaries.values()]).toEqual([4, 4, 4, 4, 4, 4]);
  });

  it("varies ratings, review counts, nights and prices", () => {
    const cards = experienceRecords.map((r) => r.card);
    expect(new Set(cards.map((c) => c.reviewCount)).size).toBeGreaterThan(15);
    expect(new Set(cards.map((c) => c.rating)).size).toBeGreaterThan(4);
    expect(new Set(cards.map((c) => c.nights)).size).toBeGreaterThan(4);
    expect(new Set(cards.map((c) => c.price)).size).toBeGreaterThan(15);
    expect(cards.some((c) => c.reviewCount === 124)).toBe(false);
  });

  it("links to the detail route built by the route helper, with lowercase unique slugs", () => {
    for (const record of experienceRecords) expect(record.card.href).toBe(experienceDetail(record.card.id));
    const slugs = experienceRecords.map((record) => record.card.id);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it("tags images by category: photos come from the primary category's themes", () => {
    for (const record of experienceRecords) {
      const themes = EXPERIENCE_IMAGE_THEMES[record.categories[0]];
      expect(themes, record.card.id).toBeDefined();
      const allowed = new Set(themes.flatMap((theme) => IMAGE_POOLS[theme]));
      for (const image of record.card.images) expect(allowed.has(image), `${record.card.id}: ${image}`).toBe(true);
    }
  });

  it("tags each collection on some items", () => {
    for (const label of ["Trending Now", "Exclusive Offers", "Best Value", "New & Noteworthy", "Editor's Picks"]) {
      const slug = slugify(label);
      expect(experienceRecords.filter((r) => r.categories.includes(slug)).length).toBeGreaterThanOrEqual(3);
    }
  });

  it("includes the featured menu experience at its advertised price", () => {
    expect(experienceRecords.find((r) => r.card.id === "mediterranean-wellness-retreat")?.card.price).toEqual({ amount: 2490, currency: "USD" });
  });
});

describe("hotel records", () => {
  const tagSlugs = new Set(hotelCategories.map((c) => c.slug));
  const destinationSlugs = new Map(destinationRegistry.map((d) => [d.slug, d]));

  it("only uses known tags and destinations, with unique ids", () => {
    expect(new Set(hotelRecords.map((r) => r.card.id)).size).toBe(hotelRecords.length);
    for (const record of hotelRecords) {
      for (const slug of record.tags) expect(tagSlugs.has(slug)).toBe(true);
      expect(destinationSlugs.has(record.destination)).toBe(true);
      expect(record.card.location.endsWith(destinationSlugs.get(record.destination)?.name ?? "?")).toBe(true);
    }
  });

  it("has 3 base types of 6 hotels, plus one boutique retreat and one beach resort", () => {
    const primaries = new Map<string, number>();
    for (const record of hotelRecords) primaries.set(record.tags[0], (primaries.get(record.tags[0]) ?? 0) + 1);
    expect([...primaries.values()]).toEqual([6, 6, 6, 1, 1]);
  });

  it("varies ratings, review counts and prices, with card prices matching the numeric price", () => {
    const cards = hotelRecords.map((r) => r.card);
    expect(new Set(cards.map((c) => c.reviewCount)).size).toBeGreaterThan(14);
    expect(new Set(cards.map((c) => (c.price?.amount ?? 0))).size).toBe(20);
    expect(cards.some((c) => c.reviewCount === 124)).toBe(false);
    for (const record of hotelRecords) expect(record.card.price).toEqual({ amount: record.priceFrom, currency: "USD" });
  });

  it("links to the detail route built by the route helper, with lowercase unique slugs", () => {
    for (const record of hotelRecords) expect(record.card.href).toBe(hotelDetail(record.slug));
    const slugs = hotelRecords.map((record) => record.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it("covers every price range with at least 3 hotels", () => {
    const { hotelBudgetRanges } = catalogFixture;
    for (const range of Object.values(hotelBudgetRanges)) {
      const inRange = hotelRecords.filter((r) => r.priceFrom >= range.min && (range.max === undefined || r.priceFrom < range.max));
      expect(inRange.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("images", () => {
  it("only uses existing local files and allowed remote hosts", () => {
    const images = [
      ...experienceRecords.flatMap((r) => r.card.images),
      ...hotelRecords.flatMap((r) => r.card.images),
      ...allPoolImages,
    ];
    for (const image of images) expect(isAllowedImage(image), image).toBe(true);
    expect(images.every((image) => allPoolImages.has(image))).toBe(true);
  });

  it("gives every card a gallery of distinct images", () => {
    for (const record of [...experienceRecords, ...hotelRecords]) {
      expect(record.card.images.length).toBeGreaterThanOrEqual(3);
      expect(new Set(record.card.images).size).toBe(record.card.images.length);
    }
  });
});

describe("package records", () => {
  it("covers the 8 home packages, each with an existing destination", () => {
    expect(packageRecords).toHaveLength(8);
    expect(packageRecords.map((record) => record.card.id)).toEqual(homePackages.map((card) => card.id));
    const slugs = new Set(destinationRegistry.map((entry) => entry.slug));
    for (const record of packageRecords) expect(slugs.has(record.destinationSlug), record.card.id).toBe(true);
  });

  it("uses the agreed destination per package", () => {
    expect(Object.fromEntries(packageRecords.map((record) => [record.card.id, record.destinationSlug]))).toEqual({
      "bali-soul-surf": slugify("Bali, Indonesia"),
      "tuscany-wellness": "italy",
      "maldives-escape": "maldives",
      "pura-vida": "costa-rica",
      cyclades: "greece",
      himalaya: "nepal",
      kerala: "india",
      "samui-detox": "thailand",
    });
  });
});

describe("region fixtures", () => {
  it("lists the six menu regions in order with the expected slugs", () => {
    expect(regionEditorial.map((entry) => slugify(entry.label))).toEqual(["asia", "europe", "americas", "africa-and-middle-east", "oceania-and-pacific", "indian-ocean"]);
  });

  it("gives every destination one of the region labels, and every region a destination", () => {
    const labels = new Set(regionEditorial.map((entry) => entry.label));
    for (const entry of destinationRegistry) expect(labels.has(entry.region), entry.slug).toBe(true);
    for (const label of labels) expect(destinationRegistry.some((entry) => entry.region === label), label).toBe(true);
  });

  it("keeps region and destination slugs disjoint", () => {
    const destinationSlugs = new Set(destinationRegistry.map((entry) => entry.slug));
    for (const entry of regionEditorial) expect(destinationSlugs.has(slugify(entry.label)), entry.label).toBe(false);
  });

  it("has editorial content for every region", () => {
    for (const entry of regionEditorial) expect(entry.bestTimeToVisit && entry.averageStay && entry.intro, entry.label).toBeTruthy();
    expect(regionEditorial[0]).toMatchObject({ label: "Asia", bestTimeToVisit: "Oct – Apr", averageStay: "10 nights" });
  });

  it("keeps a numeric price that matches the formatted one for every destination", () => {
    for (const entry of destinationRegistry) expect(entry.fromPrice, entry.slug).toEqual({ amount: destinationFromPrice[entry.slug], currency: "USD" });
  });
});
