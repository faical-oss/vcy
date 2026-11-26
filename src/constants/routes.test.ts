import { describe, expect, it } from "vitest";
import { slugify } from "@/helpers/slugify";
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
  isBuiltRoute,
  LEGACY_PATHS,
  LIFESTYLE_SLUGS,
  lifestyleVacation,
  packageDetail,
} from "./routes";

describe("catalog route helpers", () => {
  it("builds category routes under the listing routes", () => {
    expect(experienceCategory("yoga-retreats")).toBe("/experiences/yoga-retreats");
    expect(hotelCategory("eco-lodges")).toBe("/hotels/eco-lodges");
    expect(experienceCategory(slugify("Yoga Retreats")).startsWith(`${ROUTES.experiences}/`)).toBe(true);
  });

  it("builds group routes below the static groups segment", () => {
    expect(experienceGroup("wellness")).toBe("/experiences/groups/wellness");
    expect(hotelGroup("by-type")).toBe("/hotels/groups/by-type");
    expect(experienceGroup(slugify("Active & Adventure"))).toBe("/experiences/groups/active-and-adventure");
    expect(experienceGroup("curated-for-you")).not.toBe(hotelGroup("curated-for-you"));
  });

  it("builds destination routes with an optional category query", () => {
    expect(destination("bali-indonesia")).toBe("/destinations/bali-indonesia");
    expect(destination("bali-indonesia", {})).toBe("/destinations/bali-indonesia");
    expect(destination("bali-indonesia", { category: "yoga-retreats" })).toBe(
      "/destinations/bali-indonesia?category=yoga-retreats",
    );
  });

  it("builds region routes in the destination path space", () => {
    expect(destinationRegion("asia")).toBe("/destinations/asia");
    expect(destinationRegion(slugify("Africa & Middle East"))).toBe("/destinations/africa-and-middle-east");
    expect(destinationRegion("asia")).toBe(destination("asia"));
  });

  it("encodes the category query value", () => {
    expect(destination("italy", { category: "a&b=c" })).toBe("/destinations/italy?category=a%26b%3Dc");
  });

  it("builds detail routes with a one-letter marker (Option A), without the category", () => {
    expect(experienceDetail("ubud-yoga")).toBe("/experiences/e/ubud-yoga");
    expect(hotelDetail("rainforest-lodge-ubud")).toBe("/hotels/h/rainforest-lodge-ubud");
    expect(packageDetail("bali-soul-surf")).toBe("/packages/p/bali-soul-surf");
  });

  it("keeps Magazine and Glossary as external https URLs", () => {
    expect(EXTERNAL_URLS.magazine).toBe("https://vacayou.com/magazine/");
    expect(EXTERNAL_URLS.glossary).toBe("https://vacayou.com/magazine/wellness-glossary/");
  });
});

describe("isBuiltRoute", () => {
  it("accepts the pages that exist and rejects unbuilt or malformed paths", () => {
    for (const ok of ["/", "/destinations", "/destinations/asia", "/experiences/yoga-retreats", "/hotels/groups/by-type", "/hotels/h/azure-spa-and-wellness-resort-krabi", "/experiences/e/ubud-yoga-and-detox-retreat", "/privacy", "/account/trips"]) {
      expect(isBuiltRoute(ok), ok).toBe(true);
    }
    for (const bad of ["/hotels", "/packages", "/packages/p/Bad_Slug", "/experiences/e/Yoga", "/destinations/Asia", "/destinations/asia/bali", "/destinations/asia?x=1", "http://x.test/privacy", ""]) {
      expect(isBuiltRoute(bad), bad).toBe(false);
    }
  });
});

describe("lifestyle route helper", () => {
  it("builds /lifestyle/<slug> for the five pages, which are built routes; /lifestyle itself is not", () => {
    expect(LIFESTYLE_SLUGS).toEqual(["adventure", "golf", "meditation", "spa", "yoga"]);
    for (const slug of LIFESTYLE_SLUGS) {
      expect(lifestyleVacation(slug)).toBe(`/lifestyle/${slug}`);
      expect(isBuiltRoute(lifestyleVacation(slug))).toBe(true);
    }
    expect(isBuiltRoute(ROUTES.lifestyle)).toBe(false);
    expect(isBuiltRoute("/lifestyle/skiing")).toBe(false);
  });
});

describe("the external magazine", () => {
  it("is not a route of this site: no ROUTES entry, not a built route, and /magazine is only a legacy path to redirect", () => {
    expect(ROUTES).not.toHaveProperty("magazine");
    expect(ROUTES).not.toHaveProperty("glossary");
    expect(isBuiltRoute(LEGACY_PATHS.magazine)).toBe(false);
    expect(isBuiltRoute("/glossary")).toBe(false);
    expect(EXTERNAL_URLS.magazine.startsWith("https://")).toBe(true);
  });
});
