import "server-only";
import { getExperienceCards, getHotelCards } from "@/features/catalog/get-catalog";
import type { HomeContent } from "@/interfaces";
import { homeFixture } from "@/mocks/fixtures/home";

/**
 * Single entry point for Home page content. The featured experiences and hotels are catalog items (their cards link to the
 * real detail pages); the rest is the fixture.
 * TODO: replace the fixture with real service calls (destinations, magazine, testimonials)
 * once the API map is known; the return type stays the same.
 */
export async function getHomeContent(): Promise<HomeContent> {
  const { featuredExperienceIds, featuredHotelIds, ...rest } = homeFixture;
  const [experiences, hotels] = await Promise.all([getExperienceCards(featuredExperienceIds), getHotelCards(featuredHotelIds)]);
  return { ...rest, experiences, hotels };
}
