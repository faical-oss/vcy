import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROUTES } from "@/constants/routes";
import { showsDockedSearch, type DockedSearchMode } from "./docked-search";

/** Every route of `src/app` (and the planned results page), as a sample path. A new route is not here until someone adds it: it is shown by default. */
const ROUTE_TABLE: [route: string, path: string, expected: DockedSearchMode][] = [
  ["/", "/", "scroll"],
  ["/destinations", "/destinations", "scroll"],
  ["/destinations/[slug]", "/destinations/bali", "scroll"],
  ["/experiences/[category]", "/experiences/yoga-retreats", "scroll"],
  ["/experiences/groups/[group]", "/experiences/groups/wellness", "scroll"],
  ["/hotels/[category]", "/hotels/spa-resorts", "scroll"],
  ["/hotels/groups/[group]", "/hotels/groups/luxury", "scroll"],
  ["/lifestyle/[slug]", "/lifestyle/golf", "scroll"],
  ["/search", ROUTES.search, "top"],
  ["/account", "/account", false],
  ["/account/favorites", "/account/favorites", false],
  ["/account/preferences", "/account/preferences", false],
  ["/account/profile", "/account/profile", false],
  ["/account/trips", "/account/trips", false],
  ["/support", "/support", false],
  ["/privacy", "/privacy", false],
  ["/terms", "/terms", false],
  ["about us (no page yet)", ROUTES.about, false],
  ["/hotels/h/[slug]", "/hotels/h/azure-spa-and-wellness-resort-krabi", "top"],
  ["/experiences/e/[slug]", "/experiences/e/bali-yoga", "top"],
  ["/packages/p/[slug]", "/packages/p/tuscany-wellness", "top"],
  ["/checkout", "/checkout", false],
  ["unknown slug (404) under a listing", "/destinations/no-such-place", "scroll"],
  ["unknown slug (404) under a detail path", "/hotels/h/no-such-hotel", "top"],
];

describe("showsDockedSearch", () => {
  it.each(ROUTE_TABLE)("%s → %s", (_route, path, expected) => {
    expect(showsDockedSearch(path)).toBe(expected);
  });

  it("ignores a trailing slash", () => {
    expect(showsDockedSearch("/account/")).toBe(false);
    expect(showsDockedSearch("/search/")).toBe("top");
  });

  it("shows a path nobody has listed, and does not confuse a prefix with a path that only starts like it", () => {
    expect(showsDockedSearch("/some-new-page")).toBe("scroll");
    expect(showsDockedSearch("/accounting")).toBe("scroll");
    expect(showsDockedSearch("/hotels/hello")).toBe("scroll"); // not /hotels/h/
    expect(showsDockedSearch("/information/travel-insurance")).toBe("scroll");
  });

  it("excludes exactly the groups that were asked for (the detail pages now have the bar, from the first pixel)", () => {
    const excluded = ROUTE_TABLE.filter(([, , mode]) => mode === false).map(([, path]) => path);
    expect(excluded).toHaveLength(10);
  });

  it("has a row for every page under src/app, so a new page is a conscious decision in this table", () => {
    const pages = (dir: string, route: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        if (entry.isDirectory()) return pages(join(dir, entry.name), entry.name.startsWith("(") ? route : `${route}/${entry.name}`);
        return entry.name === "page.tsx" ? [route || "/"] : [];
      });
    const known = new Set(ROUTE_TABLE.map(([route]) => route));
    const missing = pages(join(process.cwd(), "src/app"), "").filter((route) => !known.has(route));
    expect(missing).toEqual([]);
  });
});
