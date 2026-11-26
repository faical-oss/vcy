import { beforeEach, describe, expect, it, vi } from "vitest";

const { cacheLife, cacheTag } = vi.hoisted(() => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("next/cache", () => ({ cacheLife, cacheTag }));

import {
  EXTERNAL_URLS,
  ROUTES,
  destination,
  destinationRegion,
  experienceCategory,
  experienceDetail,
  experienceGroup,
  hotelCategory,
  hotelDetail,
  hotelGroup,
} from "@/constants/routes";
import { slugify } from "@/helpers/slugify";
import type { NavLink, NavMenu } from "@/interfaces";
import { getDestination, getExperienceGroup, getExperienceGroupSlugs, getExperiencesByCategory, getHotelGroup, getHotelGroupSlugs, getHotelsByCategory, getRegion } from "@/features/catalog/get-catalog";
import { getNavigation } from "./get-navigation";

const SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";

function menu(menus: NavMenu[], id: NavMenu["id"]): NavMenu {
  const found = menus.find((entry) => entry.id === id);
  if (!found) throw new Error(`Missing menu ${id}`);
  return found;
}

function linksOf(entry: NavMenu): NavLink[] {
  return entry.groups.flatMap((group) => group.links);
}

describe("getNavigation", () => {
  beforeEach(() => {
    vi.stubEnv("USE_MOCKS", "true");
    vi.clearAllMocks();
  });

  it("returns the four menus with the listed link counts", async () => {
    const menus = await getNavigation();
    expect(menus.map((entry) => entry.id)).toEqual(["experiences", "destinations", "hotels", "lifestyle"]);
    expect(menus.map((entry) => entry.groups.length)).toEqual([6, 6, 6, 2]);
    expect(linksOf(menu(menus, "experiences"))).toHaveLength(46);
    expect(linksOf(menu(menus, "destinations"))).toHaveLength(57);
    expect(linksOf(menu(menus, "hotels"))).toHaveLength(43);
    expect(linksOf(menu(menus, "lifestyle"))).toHaveLength(7);
    expect(menus.filter((entry) => entry.featured)).toHaveLength(4);
  });

  it("declares its cache lifetime and tag, and is JSON-serialisable", async () => {
    const menus = await getNavigation();
    expect(cacheLife).toHaveBeenCalledWith("days");
    expect(cacheTag).toHaveBeenCalledWith("navigation");
    expect(JSON.parse(JSON.stringify(menus))).toEqual(menus);
  });

  it("no trigger is a link (an item only opens its dropdown); every dropdown but Lifestyle's ends with a 'View all' link to its section", async () => {
    const menus = await getNavigation();
    expect(menu(menus, "destinations").href).toBe(ROUTES.destinations); // the section page, kept in the data
    expect(menu(menus, "experiences").href).toBeUndefined();
    expect(menu(menus, "hotels").href).toBeUndefined();
    expect(menu(menus, "lifestyle").href).toBeUndefined();
    expect(menu(menus, "destinations").footerLink).toEqual({ label: "View all destinations", href: ROUTES.destinations });
    expect(menu(menus, "experiences").footerLink).toEqual({ label: "View all experiences", href: ROUTES.browseExperiences });
    expect(menu(menus, "hotels").footerLink).toEqual({ label: "View all hotels", href: ROUTES.browseHotels });
    expect(menu(menus, "lifestyle").footerLink).toBeUndefined(); // no section page of its own
  });

  it("keeps featured cards with eyebrow, price and a route-helper href", async () => {
    const menus = await getNavigation();
    expect(menu(menus, "experiences").featured).toMatchObject({ eyebrow: "Editor's Pick", price: "$2,490", priceUnit: "per person", href: experienceDetail("mediterranean-wellness-retreat") });
    expect(menu(menus, "destinations").featured).toMatchObject({ eyebrow: "Top Destination", price: "$1,895", href: destination("bali-indonesia") });
    expect(menu(menus, "hotels").featured).toMatchObject({ eyebrow: "Special Offer", price: "$385", priceUnit: "per night", href: hotelDetail("azure-spa-and-wellness-resort-krabi") });
  });

  describe("every experience link", () => {
    it("is a route-helper href that resolves to its category with related cards", async () => {
      const menus = await getNavigation();
      for (const link of linksOf(menu(menus, "experiences"))) {
        expect(link.external).toBeUndefined();
        expect(link.href).toMatch(new RegExp(`^/experiences/${SLUG}$`));
        expect(link.href).toBe(experienceCategory(slugify(link.label)));
        const result = await getExperiencesByCategory(link.href.split("/").pop() ?? "");
        expect(result, link.label).not.toBeNull();
        expect(result?.category.label).toBe(link.label);
        expect(result?.total, link.label).toBeGreaterThanOrEqual(3);
        expect(result?.items).toHaveLength(result?.total ?? -1);
      }
    });
  });

  describe("every hotel link", () => {
    it("is a route-helper href that resolves to its category with related cards", async () => {
      const menus = await getNavigation();
      for (const link of linksOf(menu(menus, "hotels"))) {
        expect(link.href).toMatch(new RegExp(`^/hotels/${SLUG}$`));
        expect(link.href).toBe(hotelCategory(slugify(link.label)));
        const result = await getHotelsByCategory(link.href.split("/").pop() ?? "");
        expect(result, link.label).not.toBeNull();
        expect(result?.category.label).toBe(link.label);
        expect(result?.total, link.label).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe("group hrefs", () => {
    it("link destination groups to their region page, which resolves", async () => {
      for (const group of menu(await getNavigation(), "destinations").groups) {
        expect(group.href).toBe(destinationRegion(slugify(group.title)));
        const result = await getRegion((group.href ?? "").split("/").pop() ?? "");
        expect(result?.region.name, group.title).toBe(group.title);
        expect(result?.destinations.length, group.title).toBeGreaterThan(0);
      }
    });

    it("link experience and hotel groups to their group listing, matched by the slug lists and resolving to a page", async () => {
      const menus = await getNavigation();
      const experienceSlugs = await getExperienceGroupSlugs();
      const hotelSlugs = await getHotelGroupSlugs();
      expect(experienceSlugs).toEqual(["wellness", "active-and-adventure", "mind-and-spirit", "lifestyle-and-culture", "health-and-fitness", "curated-for-you"]);
      expect(hotelSlugs).toEqual(["by-type", "by-experience", "asia-and-pacific", "europe", "by-budget", "curated-for-you"]);
      for (const group of menu(menus, "experiences").groups) {
        expect(group.href).toBe(experienceGroup(slugify(group.title)));
        expect(experienceSlugs).toContain((group.href ?? "").split("/").pop());
        const result = await getExperienceGroup(slugify(group.title));
        expect(result?.group.title).toBe(group.title);
        expect(result?.chips.map((chip) => chip.label)).toEqual(group.links.map((link) => link.label));
        expect(result?.total, group.title).toBeGreaterThanOrEqual(3);
      }
      for (const group of menu(menus, "hotels").groups) {
        expect(group.href).toBe(hotelGroup(slugify(group.title)));
        expect(hotelSlugs).toContain((group.href ?? "").split("/").pop());
        const result = await getHotelGroup(slugify(group.title));
        expect(result?.group.title).toBe(group.title);
        expect(result?.chips.map((chip) => chip.label)).toEqual(group.links.map((link) => link.label));
        expect(result?.total, group.title).toBeGreaterThanOrEqual(3);
      }
      expect(experienceSlugs).toHaveLength(menu(menus, "experiences").groups.length);
      expect(hotelSlugs).toHaveLength(menu(menus, "hotels").groups.length);
    });

    it("never gives the experience or hotel triggers or any of their group slugs the reserved 'groups' category slug", async () => {
      const links = [...linksOf(menu(await getNavigation(), "experiences")), ...linksOf(menu(await getNavigation(), "hotels"))];
      expect(links.some((link) => link.href.endsWith("/groups"))).toBe(false);
    });

    it("leaves the per-link hrefs unchanged and the lifestyle group without href", async () => {
      const menus = await getNavigation();
      expect(menu(menus, "lifestyle").groups.every((group) => group.href === undefined)).toBe(true);
      expect(linksOf(menu(menus, "experiences"))[0].href).toBe("/experiences/yoga-retreats");
      expect(linksOf(menu(menus, "destinations"))[0].href).toBe("/destinations/bali-indonesia");
    });
  });

  describe("every destination link", () => {
    it("is a route-helper href that resolves to a destination with facts and cards", async () => {
      const menus = await getNavigation();
      const slugs = new Set<string>();
      for (const link of linksOf(menu(menus, "destinations"))) {
        expect(link.href).toMatch(new RegExp(`^/destinations/${SLUG}$`));
        expect(link.href).toBe(destination(slugify(link.label)));
        const slug = link.href.split("/").pop() ?? "";
        slugs.add(slug);
        const result = await getDestination(slug);
        expect(result, link.label).not.toBeNull();
        expect(result?.destination.slug).toBe(slug);
        expect(result?.destination.heroImage).not.toBe("");
        expect(result?.total, link.label).toBeGreaterThanOrEqual(3);
      }
      expect(slugs.size).toBe(54);
    });

    it("resolves the duplicated links (Maldives, Sri Lanka, Zanzibar) to the same record", async () => {
      const links = linksOf(menu(await getNavigation(), "destinations"));
      for (const label of ["Maldives", "Sri Lanka", "Zanzibar"]) {
        const hrefs = links.filter((link) => link.label === label).map((link) => link.href);
        expect(hrefs).toHaveLength(2);
        expect(hrefs[0]).toBe(hrefs[1]);
        const [first, second] = await Promise.all(hrefs.map((href) => getDestination(href.split("/").pop() ?? "")));
        expect(first).not.toBeNull();
        expect(first).toEqual(second);
      }
    });

    it("accepts every experience category as the destination filter", async () => {
      const links = linksOf(menu(await getNavigation(), "experiences"));
      for (const link of links) {
        const category = slugify(link.label);
        const result = await getDestination("bali-indonesia", { category });
        expect(result?.category?.slug, link.label).toBe(category);
        expect(result?.total).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe("lifestyle links", () => {
    it("are external https links on vacayou.com", async () => {
      const links = linksOf(menu(await getNavigation(), "lifestyle")).slice(0, 2);
      expect(links.map((link) => link.label)).toEqual(["Magazine", "Glossary"]);
      expect(links.map((link) => link.href)).toEqual([EXTERNAL_URLS.magazine, EXTERNAL_URLS.glossary]);
      for (const link of links) {
        expect(link.external).toBe(true);
        expect(new URL(link.href).protocol).toBe("https:");
        expect(new URL(link.href).hostname).toBe("vacayou.com");
      }
    });
  });

  it("returns no menus and no catalog data when mocks are off and no real client exists", async () => {
    vi.stubEnv("USE_MOCKS", "false");
    expect(await getNavigation()).toEqual([]);
    expect(await getExperiencesByCategory("yoga-retreats")).toBeNull();
    expect(await getHotelsByCategory("eco-lodges")).toBeNull();
    expect(await getDestination("bali-indonesia")).toBeNull();
    expect(await getExperienceGroup("wellness")).toBeNull();
    expect(await getHotelGroup("by-type")).toBeNull();
  });
});
