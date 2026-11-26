import { describe, expect, it } from "vitest";
import { FILTERED_ROBOTS_HEADER, FILTER_PARAMS, PAGINATION_PARAM } from "@/constants/seo";
import { REQUIRED_FILTER_PARAMS } from "@/test-support/seo-expectations";
import nextConfig from "../../../next.config";
import { urlPolicy } from "./url-policy";

/*
 * The filter parameters live in one list (FILTER_PARAMS). urlPolicy and the X-Robots-Tag header rules in next.config.ts
 * both derive from it; this test fails if either stops following it, or if pagination becomes a filter.
 */
type HeaderRule = { source: string; has?: { type: string; key: string }[]; headers: { key: string; value: string }[] };
const rules = (await nextConfig.headers?.()) as HeaderRule[];
const robotsRules = rules.filter((rule) => rule.headers.some((header) => header.key === "X-Robots-Tag"));
const keysOf = (rule: HeaderRule) => (rule.has ?? []).filter((item) => item.type === "query").map((item) => item.key);

describe("filter parameters: urlPolicy and the X-Robots-Tag header rules", () => {
  it("still lists every required filter parameter (a removed one would silently become indexable)", () => {
    for (const name of REQUIRED_FILTER_PARAMS) {
      expect(FILTER_PARAMS as readonly string[], `"${name}" was removed from FILTER_PARAMS (src/constants/seo.ts): ?${name}= would be indexable. If that is intended, remove it from REQUIRED_FILTER_PARAMS in src/test-support/seo-expectations.ts too.`).toContain(name);
      expect(urlPolicy({ type: "category", path: "/x", query: { [name]: "v" } }, true).robots, `urlPolicy must treat ?${name}= as a filter`).toEqual({ index: false, follow: true });
      expect(robotsRules.some((rule) => keysOf(rule).includes(name)), `next.config.ts has no X-Robots-Tag header rule for "${name}"`).toBe(true);
    }
  });

  it("has a header rule for every parameter urlPolicy treats as a filter, with the noindex,follow value", () => {
    for (const name of FILTER_PARAMS) {
      const policy = urlPolicy({ type: "category", path: "/x", query: { [name]: "v" } }, true);
      expect(policy.robots, `urlPolicy must treat ?${name}= as a filter`).toEqual({ index: false, follow: true });
      const matching = robotsRules.filter((rule) => keysOf(rule).includes(name));
      expect(matching.length, `next.config.ts has no X-Robots-Tag header rule for the filter parameter "${name}"`).toBe(1);
      expect(matching[0].headers.find((header) => header.key === "X-Robots-Tag")?.value, `rule for "${name}"`).toBe(FILTERED_ROBOTS_HEADER);
    }
  });

  it("has no header rule for a parameter that is not in FILTER_PARAMS, and none for ?page=", () => {
    const keys = robotsRules.flatMap(keysOf);
    expect(keys.filter((key) => !(FILTER_PARAMS as readonly string[]).includes(key)), "header rules for parameters outside FILTER_PARAMS").toEqual([]);
    expect(keys, "pagination must stay indexable").not.toContain(PAGINATION_PARAM);
    expect(FILTER_PARAMS as readonly string[], "pagination must not be a filter").not.toContain(PAGINATION_PARAM);
    expect(urlPolicy({ type: "category", path: "/x", query: { [PAGINATION_PARAM]: "2" } }, true).robots.index).toBe(true);
  });

  it("matches one query parameter per rule (has items are ANDed), on pages only", () => {
    for (const rule of robotsRules) {
      expect(keysOf(rule), "each X-Robots-Tag rule must test exactly one query parameter").toHaveLength(1);
      expect(new RegExp(`^${rule.source.replace(/^\//, "\\/")}$`).test("/_next/image"), "must not match /_next/").toBe(false);
      expect(new RegExp(`^${rule.source.replace(/^\//, "\\/")}$`).test("/api/revalidate"), "must not match /api/").toBe(false);
      expect(new RegExp(`^${rule.source.replace(/^\//, "\\/")}$`).test("/destinations/asia"), "must match site pages").toBe(true);
    }
  });
});
