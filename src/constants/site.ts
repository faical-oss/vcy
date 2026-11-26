export const SITE_NAME = "Vacayou";
export const SITE_TAGLINE = "Wellness & Active Travel That Moves You";
export const SITE_DESCRIPTION =
  "Find and book the world's best wellness resorts, retreats & tours, spa getaways and active adventures.";
export const SITE_FOOTER_BLURB =
  "Wellness travel, active adventures and transformative experiences — curated for the mindful explorer.";
export const SITE_COPYRIGHT = "© 2026 Vacayou.com. All rights reserved.";

/**
 * How many pages of each dynamic catalog route are prerendered at build time (the first N slugs, in menu order). Every
 * other slug renders on first request and is then cached like the prerendered ones. One value for all routes.
 */
export const STATIC_PARAMS_LIMIT = 100;

/**
 * Slugs prerendered when the real list cannot be read (API down at build time, empty or malformed menu, no catalog
 * configured). `generateStaticParams` must never be empty (Cache Components rejects it) and must never fail the build.
 * A seed slug that does not exist just prerenders that route's 404.
 */
export const STATIC_PARAMS_SEED = {
  experienceCategories: ["yoga-retreats", "meditation-retreats"],
  hotelCategories: ["wellness-resorts", "luxury-spa-hotels"],
  experienceGroups: ["wellness", "active-and-adventure"],
  hotelGroups: ["by-type", "by-experience"],
  destinations: ["bali-indonesia", "thailand", "asia", "europe"],
  hotels: ["azure-spa-and-wellness-resort-krabi", "como-uma-ubud"],
  experiences: ["ubud-yoga-and-detox-retreat", "thai-holistic-wellness-journey"],
} as const;

/** Currency of live prices until the site supports more than one. */
export const DEFAULT_CURRENCY = "USD";

/** Live price and availability are cached for this long, keyed on hotel, dates, guests and currency. */
export const AVAILABILITY_TTL_SECONDS = 60;
