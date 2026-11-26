import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NavMenu } from "@/interfaces";

const { getNavigation, getCatalogService } = vi.hoisted(() => ({ getNavigation: vi.fn(), getCatalogService: vi.fn() }));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/features/navigation/get-navigation", () => ({ getNavigation }));
vi.mock("@/services", () => ({ getCatalogService }));

import { CatalogNotConfiguredError } from "@/lib/catalog-errors";
import { STATIC_PARAMS_LIMIT, STATIC_PARAMS_SEED } from "@/constants/site";
import { getDestinationSlugs, getExperienceCategorySlugs, getExperienceGroup, getExperienceGroupSlugs, getExperiencesByCategory, getHotelCategorySlugs, getHotelGroupSlugs } from "./get-catalog";

function menuWith(id: NavMenu["id"], hrefs: { href: string; external?: true }[]): NavMenu {
  return { id, label: id, groups: [{ title: "G", links: hrefs.map((link, index) => ({ label: `L${index}`, ...link })) }] };
}

describe("menu-derived slugs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the seed slugs for an empty menu list", async () => {
    getNavigation.mockResolvedValue([]);
    expect(await getExperienceCategorySlugs()).toEqual([...STATIC_PARAMS_SEED.experienceCategories]);
  });

  it("uses the seed slugs for a menu without links", async () => {
    getNavigation.mockResolvedValue([{ id: "hotels", label: "Hotels", groups: [] }]);
    expect(await getHotelCategorySlugs()).toEqual([...STATIC_PARAMS_SEED.hotelCategories]);
  });

  it("uses the seed slugs and warns (never throws) when a menu has links but none under the expected prefix", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    getNavigation.mockResolvedValue([menuWith("experiences", [{ href: "/other/yoga" }, { href: "https://example.com/experiences/x", external: true }])]);
    expect(await getExperienceCategorySlugs()).toEqual([...STATIC_PARAMS_SEED.experienceCategories]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("uses the seed slugs when the menu cannot be read at all (API down)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    getNavigation.mockRejectedValue(new Error("API down"));
    expect(await getHotelCategorySlugs()).toEqual([...STATIC_PARAMS_SEED.hotelCategories]);
    warn.mockRestore();
  });

  it("returns at most STATIC_PARAMS_LIMIT slugs", async () => {
    getNavigation.mockResolvedValue([menuWith("hotels", Array.from({ length: STATIC_PARAMS_LIMIT + 40 }, (_, index) => ({ href: `/hotels/h-${index}` })))]);
    expect(await getHotelCategorySlugs()).toHaveLength(STATIC_PARAMS_LIMIT);
  });

  it("keeps matching hrefs and drops other-shaped ones when at least one matches", async () => {
    getNavigation.mockResolvedValue([menuWith("destinations", [{ href: "/destinations" }, { href: "/destinations/bali" }, { href: "/destinations/bali" }, { href: "/elsewhere/x" }])]);
    expect(await getDestinationSlugs()).toEqual(["bali"]);
  });
});

describe("menu-derived group slugs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function groupMenu(id: NavMenu["id"], hrefs: (string | undefined)[]): NavMenu {
    return { id, label: id, groups: hrefs.map((href, index) => ({ title: `G${index}`, ...(href ? { href } : {}), links: [] })) };
  }

  it("uses the seed slugs without menus or groups", async () => {
    getNavigation.mockResolvedValue([]);
    expect(await getExperienceGroupSlugs()).toEqual([...STATIC_PARAMS_SEED.experienceGroups]);
    getNavigation.mockResolvedValue([{ id: "hotels", label: "Hotels", groups: [] }]);
    expect(await getHotelGroupSlugs()).toEqual([...STATIC_PARAMS_SEED.hotelGroups]);
  });

  it("reads the slugs from the group hrefs, deduplicated", async () => {
    getNavigation.mockResolvedValue([groupMenu("experiences", ["/experiences/groups/wellness", "/experiences/groups/wellness", undefined, "/experiences/groups/mind-and-spirit"])]);
    expect(await getExperienceGroupSlugs()).toEqual(["wellness", "mind-and-spirit"]);
  });

  it("uses the seed slugs when groups exist but none has a group href", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    getNavigation.mockResolvedValue([groupMenu("hotels", [undefined, "/hotels/by-type"])]);
    expect(await getHotelGroupSlugs()).toEqual([...STATIC_PARAMS_SEED.hotelGroups]);
    warn.mockRestore();
  });
});

describe("catalog reads failure handling", () => {
  it("returns null when the catalog service is not configured", async () => {
    getCatalogService.mockRejectedValue(new CatalogNotConfiguredError());
    expect(await getExperiencesByCategory("yoga-retreats")).toBeNull();
  });

  it("returns null for a group when the catalog service is not configured", async () => {
    getCatalogService.mockRejectedValue(new CatalogNotConfiguredError());
    expect(await getExperienceGroup("wellness")).toBeNull();
  });

  it("rethrows any other error", async () => {
    getCatalogService.mockRejectedValue(new Error("upstream down"));
    await expect(getExperiencesByCategory("yoga-retreats")).rejects.toThrow("upstream down");
  });
});
