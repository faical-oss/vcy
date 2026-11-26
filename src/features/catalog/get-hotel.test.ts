import { beforeEach, describe, expect, it, vi } from "vitest";

const { cacheLife, cacheTag } = vi.hoisted(() => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("next/cache", () => ({ cacheLife, cacheTag }));

import { hotelDetail } from "@/constants/routes";
import { STATIC_PARAMS_SEED } from "@/constants/site";
import { getCatalogSitemapPaths, getHotel, getHotelSlugs, getSimilarHotels } from "./get-catalog";

const SLUG = "azure-spa-and-wellness-resort-krabi";

describe("hotel detail reads (mock catalog)", () => {
  beforeEach(() => {
    vi.stubEnv("USE_MOCKS", "true");
    vi.clearAllMocks();
  });

  it("returns the static detail of a known hotel, cached for hours with the hotel and category tags", async () => {
    const hotel = await getHotel(SLUG);
    expect(hotel).toMatchObject({ slug: SLUG, name: "Azure Spa & Wellness Resort", type: { slug: "wellness-resorts" } });
    expect(cacheLife).toHaveBeenCalledWith("hours");
    const tags = cacheTag.mock.calls.flat();
    expect(tags).toEqual(expect.arrayContaining(["catalog", `hotel:${SLUG}`, "category:wellness-resorts"]));
  });

  it("returns null for unknown or malformed slugs and when no catalog is configured", async () => {
    expect(await getHotel("nope")).toBeNull();
    expect(await getHotel("Bad_Slug")).toBeNull();
    vi.stubEnv("USE_MOCKS", "false");
    expect(await getHotel(SLUG)).toBeNull();
    expect(await getSimilarHotels(SLUG)).toEqual([]);
  });

  it("returns three similar hotels, never the hotel itself, same type first, and tags them with the hotel and its cards", async () => {
    const similar = await getSimilarHotels(SLUG, 3);
    expect(similar).toHaveLength(3);
    expect(similar.every((card) => !card.href.endsWith(SLUG))).toBe(true);
    expect(similar.every((card) => card.badge === "Wellness Resort")).toBe(true);
    const tags = cacheTag.mock.calls.flat();
    expect(tags).toContain(`hotel:${SLUG}`);
    for (const card of similar) expect(tags).toContain(`hotel:${card.href.split("/").pop()}`);
  });

  it("lists static slugs (best first, at most the limit) with a seed fallback, and hotel pages in the sitemap", async () => {
    const slugs = await getHotelSlugs();
    expect(slugs.length).toBeGreaterThan(5);
    expect(slugs).toContain(SLUG);
    expect(await getCatalogSitemapPaths()).toContain(hotelDetail(SLUG));
    vi.stubEnv("USE_MOCKS", "false");
    expect(await getHotelSlugs()).toEqual([...STATIC_PARAMS_SEED.hotels]);
  });
});
