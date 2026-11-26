import {
  EXPERIENCE_TOP_UP_AFFINITY,
  HOTEL_BUDGET_RANGES,
  HOTEL_TOP_UP_AFFINITY,
  experienceCategories,
  hotelCategories,
} from "./categories";
import { destinationFromPrice, destinationRegistry } from "./destinations";
import { experienceRecords } from "./experiences";
import { hotelRecords } from "./hotels";
import { packageRecords } from "./packages";
import { regionEditorial } from "./regions";
import type { CatalogData } from "./types";

export const catalogFixture: CatalogData = {
  experienceCategories,
  hotelCategories,
  destinations: destinationRegistry,
  experiences: experienceRecords,
  hotels: hotelRecords,
  packages: packageRecords,
  regions: regionEditorial,
  destinationFromPrice,
  hotelBudgetRanges: HOTEL_BUDGET_RANGES,
  experienceTopUpAffinity: EXPERIENCE_TOP_UP_AFFINITY,
  hotelTopUpAffinity: HOTEL_TOP_UP_AFFINITY,
};
