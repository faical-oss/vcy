import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

import { experienceDetail } from "@/constants/routes";
import { getExperience, getHotel } from "@/features/catalog/get-catalog";
import { homeFixture } from "@/mocks/fixtures/home";
import { getHomeContent } from "./get-home-content";

describe("getHomeContent: the featured rows", () => {
  beforeEach(() => vi.stubEnv("USE_MOCKS", "true"));

  it("shows every featured experience and hotel, each linking to its own detail page", async () => {
    const { experiences, hotels } = await getHomeContent();
    expect(experiences.map((card) => card.id)).toEqual([...homeFixture.featuredExperienceIds]);
    expect(hotels.map((card) => card.id)).toEqual([...homeFixture.featuredHotelIds]);
    for (const card of experiences) expect(card.href).toBe(experienceDetail(card.id));
    for (const card of experiences) expect(await getExperience(card.id), card.href).not.toBeNull(); // the page the card links to exists
    for (const card of hotels) expect(await getHotel(card.href.split("/").pop()!), card.href).not.toBeNull();
    for (const card of hotels) expect(card.href).toMatch(/^\/hotels\/h\/[a-z0-9-]+$/);
  });
});
