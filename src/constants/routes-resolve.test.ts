import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import {
  LIFESTYLE_SLUGS,
  ROUTES,
  destination,
  destinationRegion,
  experienceCategory,
  experienceDetail,
  experienceGroup,
  hotelCategory,
  hotelDetail,
  hotelGroup,
  lifestyleVacation,
  packageCategory,
  packageDetail,
} from "./routes";

/** The pages that exist: one pattern per `page.tsx` under src/app (`[slug]` segments match any one segment, route groups are not in the URL). */
function appRoutes(dir = join(process.cwd(), "src/app"), route = ""): RegExp[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return appRoutes(join(dir, entry.name), entry.name.startsWith("(") ? route : `${route}/${entry.name}`);
    return entry.name === "page.tsx" ? [new RegExp(`^${(route || "/").replace(/\[[^\]]+\]/g, "[^/]+")}$`)] : [];
  });
}
const pages = appRoutes();
const exists = (path: string) => pages.some((pattern) => pattern.test(path.split("?")[0]));

/** Paths in `ROUTES` that are NOT pages today, each with its reason. An entry that starts to resolve must be removed (a test fails). */
const NOT_A_PAGE: Record<string, string> = {
  [ROUTES.experiences]: "no index page: temporary 307 redirect to ROUTES.browseExperiences in next.config.ts",
  [ROUTES.hotels]: "no index page: temporary 307 redirect to ROUTES.browseHotels in next.config.ts",
  [ROUTES.packages]: "no index page; nothing links to it (packageCategory is unused)",
  [ROUTES.lifestyle]: "not a page, only the parent of /lifestyle/<slug>; nothing links to it",
  [ROUTES.about]: "provisional slug, page not built",
  [ROUTES.whyBook]: "provisional slug, page not built",
  [ROUTES.insurance]: "provisional slug, page not built",
  [ROUTES.partnerResorts]: "provisional slug, page not built",
  [ROUTES.partnerTourProviders]: "provisional slug, page not built",
  [ROUTES.partnerHotels]: "provisional slug, page not built",
  [ROUTES.partnerList]: "provisional slug, page not built",
};

describe("ROUTES", () => {
  it.each(Object.entries(ROUTES))("%s = %s is a page, or is listed with the reason it is not", (_key, path) => {
    if (exists(path)) expect(NOT_A_PAGE[path], `${path} exists now: remove it from NOT_A_PAGE`).toBeUndefined();
    else expect(NOT_A_PAGE[path], `${path} is not a page: fix the route, or list it in NOT_A_PAGE with a reason`).toBeTruthy();
  });

  it("the default browse targets are pages (the redirects of /experiences and /hotels point at them)", () => {
    expect(exists(ROUTES.browseExperiences)).toBe(true);
    expect(exists(ROUTES.browseHotels)).toBe(true);
  });
});

describe("redirects of the missing index pages", () => {
  it("/experiences and /hotels redirect (307) to the default browse pages", async () => {
    const redirects = await nextConfig.redirects!();
    expect(redirects).toContainEqual({ source: ROUTES.experiences, destination: ROUTES.browseExperiences, permanent: false });
    expect(redirects).toContainEqual({ source: ROUTES.hotels, destination: ROUTES.browseHotels, permanent: false });
  });
});

describe("route builders", () => {
  it("every builder returns a path a page serves", () => {
    const built = [
      experienceCategory("yoga-retreats"),
      hotelCategory("wellness-resorts"),
      experienceGroup("wellness"),
      hotelGroup("by-type"),
      destination("bali-indonesia"),
      destination("bali-indonesia", { category: "yoga-retreats" }),
      destinationRegion("asia"),
      experienceDetail("some-experience"),
      hotelDetail("some-hotel"),
      packageDetail("some-package"),
      ...LIFESTYLE_SLUGS.map(lifestyleVacation),
    ];
    for (const path of built) expect(exists(path), path).toBe(true);
  });

  it("packageCategory has no page behind it (no packages index), which is why nothing may link to it", () => {
    expect(exists(packageCategory("some-package"))).toBe(false);
  });
});
