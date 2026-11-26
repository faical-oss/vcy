import type { HomeContent } from "@/interfaces";
import { destinations } from "./destinations";
import { experienceFilters, featuredExperienceIds } from "./experiences";
import { featuredHotelIds } from "./hotels";
import { articles, editorial } from "./magazine";
import { moments } from "./moments";
import { packages } from "./packages";
import { popularSearches } from "./popular-searches";
import { testimonials } from "./testimonials";

/** Home page payload, assembled from per-section fixtures. Each file mirrors one future API endpoint. */
/** Home's featured rows hold catalog ids, not cards: `getHomeContent()` resolves them through the catalog, so each card links to its real detail page. */
export type HomeFixture = Omit<HomeContent, "experiences" | "hotels"> & { featuredExperienceIds: readonly string[]; featuredHotelIds: readonly string[] };

export const homeFixture: HomeFixture = {
  popularSearches,
  experienceFilters,
  featuredExperienceIds,
  destinations,
  packages,
  editorial,
  articles,
  featuredHotelIds,
  testimonials,
  moments,
};
