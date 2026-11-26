import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseRedirectMap, toSitePath, validateRedirectMap } from "./redirect-map";

const HEADER = "old_url,new_url,status,notes\n";

describe("parseRedirectMap and validateRedirectMap", () => {
  it("rejects a file with the wrong header", () => {
    expect(() => parseRedirectMap("from,to\n/a,/b")).toThrow(/header/);
  });

  it("parses quoted notes and accepts valid 301s to built pages", () => {
    const rows = parseRedirectMap(`${HEADER}https://vacayou.com/old-asia,/destinations/asia,301,"region, renamed"\n/old-yoga,/experiences/yoga-retreats,301,\n`);
    expect(rows).toHaveLength(2);
    expect(rows[0].notes).toBe("region, renamed");
    expect(validateRedirectMap(rows)).toEqual([]);
  });

  it("flags non-301 statuses, duplicates, self-redirects, chains, queries and unserved targets", () => {
    const rows = parseRedirectMap(
      `${HEADER}/a,/destinations/asia,302,\n/a,/destinations/europe,301,\n/b,/b,301,\n/c,/d,301,\n/d,/privacy,301,\n/e,/privacy?x=1,301,\n/f,/hotels/h/amanpuri,301,\n/g,,301,\n`,
    );
    const problems = validateRedirectMap(rows).join("\n");
    expect(problems).toMatch(/status must be 301/);
    expect(problems).toMatch(/more than once/);
    expect(problems).toMatch(/redirects to itself/);
    expect(problems).toMatch(/redirect chain/);
    expect(problems).toMatch(/query string/);
    expect(problems).toMatch(/not a page the site serves/);
    expect(problems).toMatch(/new_url is not a URL/);
  });

  it("reads absolute and relative URLs as site paths", () => {
    expect(toSitePath("https://vacayou.com/tours/bali?x=1")).toBe("/tours/bali?x=1");
    expect(toSitePath("/privacy")).toBe("/privacy");
    expect(toSitePath("")).toBeNull();
    expect(toSitePath("mailto:a@b.c")).toBeNull();
  });
});

/*
 * Launch blocker, enforced only when INDEXING_ENABLED=true (`npm run build` runs this file first, see "prebuild").
 * With indexing off the old URLs are not live yet and the map may still be empty, so the block is skipped.
 * Set REDIRECT_MAP_PATH to read the map from elsewhere (default: ../vku-migration/seo/redirect-map.csv).
 * Set E2E_BASE_URL (a running production server) to also check every old URL answers 301 to a target that returns 200.
 */
const indexingOn = process.env.INDEXING_ENABLED === "true";
const mapPath = process.env.REDIRECT_MAP_PATH ?? path.resolve(import.meta.dirname, "../../../../vku-migration/seo/redirect-map.csv");

describe.skipIf(!indexingOn)("redirect map (launch blocker, INDEXING_ENABLED=true)", () => {
  it("exists and has at least one redirect", () => {
    expect(existsSync(mapPath), `redirect map not found at ${mapPath}`).toBe(true);
    expect(parseRedirectMap(readFileSync(mapPath, "utf8")).length, "redirect map has no rows: indexing cannot go live without the old-URL redirects").toBeGreaterThan(0);
  });

  it("has only valid 301s to pages the site serves", () => {
    expect(validateRedirectMap(parseRedirectMap(readFileSync(mapPath, "utf8")))).toEqual([]);
  });

  it.skipIf(!process.env.E2E_BASE_URL)("every old URL answers 301 to a target that returns 200 on the running server", async () => {
    const base = process.env.E2E_BASE_URL as string;
    const failures: string[] = [];
    for (const row of parseRedirectMap(readFileSync(mapPath, "utf8"))) {
      const oldPath = toSitePath(row.oldUrl) as string;
      const newPath = toSitePath(row.newUrl) as string;
      const first = await fetch(new URL(oldPath, base), { redirect: "manual" });
      const location = first.headers.get("location");
      if (first.status !== 301 || !location || toSitePath(new URL(location, base).toString()) !== newPath) {
        failures.push(`${oldPath}: expected 301 to ${newPath}, got ${first.status} ${location ?? ""}`);
        continue;
      }
      const target = await fetch(new URL(newPath, base), { redirect: "manual" });
      if (target.status !== 200) failures.push(`${oldPath}: target ${newPath} returned ${target.status}`);
    }
    expect(failures).toEqual([]);
  }, 120_000);
});
