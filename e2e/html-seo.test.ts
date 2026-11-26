import path from "node:path";
import nextEnv from "@next/env";
import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, it } from "vitest";
import { urlPolicy } from "@/features/seo/url-policy";
import { DYNAMIC_ROUTES, REGION_SAMPLE, STATIC_ROUTES } from "./dynamic-routes";

/*
 * Rendered-HTML SEO checks against the BUILT server (the part of the SEO definition of done that only shows in the
 * final markup): one h1, one non-empty title and description, an absolute canonical equal to the clean URL, robots as
 * urlPolicy says, valid JSON-LD, a BreadcrumbList that matches the visible breadcrumb, and no invented ratings.
 * Every message names the route and the check. The routes come from e2e/dynamic-routes.ts.
 *
 * The expectations use the same environment the server was built with (.env.local plus the shell): INDEXING_ENABLED,
 * USE_MOCKS and NEXT_PUBLIC_SITE_URL. Run this suite in the shell that ran `npm run build`.
 */
nextEnv.loadEnvConfig(path.resolve(import.meta.dirname, ".."));
const baseUrl = process.env.E2E_BASE_URL as string;
const indexing = process.env.INDEXING_ENABLED === "true";
const mocks = process.env.USE_MOCKS === "true";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

interface Case {
  route: string;
  type: "home" | "static" | "category" | "destination" | "detail";
  /** Path of the clean URL the canonical must point to. */
  clean: string;
  /** Request URL; differs from `clean` for a filtered variant. */
  request: string;
}

const CASES: Case[] = [
  ...Object.entries(STATIC_ROUTES).map(([route, { type }]): Case => ({ route, type, clean: route, request: route })),
  ...Object.entries(DYNAMIC_ROUTES).map(([, { path: build, sample, type }]): Case => ({ route: build(sample), type, clean: build(sample), request: build(sample) })),
  { route: DYNAMIC_ROUTES["/destinations/[slug]"].path(REGION_SAMPLE), type: "destination", clean: DYNAMIC_ROUTES["/destinations/[slug]"].path(REGION_SAMPLE), request: DYNAMIC_ROUTES["/destinations/[slug]"].path(REGION_SAMPLE) },
  { route: "/destinations/bali-indonesia?category=yoga-retreats (filtered)", type: "destination", clean: "/destinations/bali-indonesia", request: "/destinations/bali-indonesia?category=yoga-retreats" },
  { route: "/destinations?region=asia (filtered)", type: "destination", clean: "/destinations", request: "/destinations?region=asia" },
];

function robotsString({ index, follow }: { index: boolean; follow: boolean }): string {
  return `${index ? "index" : "noindex"}, ${follow ? "follow" : "nofollow"}`;
}

/** Every value under one of the keys, and every `@type` equal to one of the values, anywhere in the object. */
function containsKeyOrType(value: unknown, forbidden: readonly string[]): string | null {
  if (Array.isArray(value)) return value.map((entry) => containsKeyOrType(entry, forbidden)).find(Boolean) ?? null;
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      if (forbidden.includes(key)) return key;
      if (key === "@type" && typeof entry === "string" && forbidden.includes(entry)) return entry;
      const nested = containsKeyOrType(entry, forbidden);
      if (nested) return nested;
    }
  }
  return null;
}

const pages = new Map<string, { document: Document; status: number; xRobots: string }>();

beforeAll(async () => {
  for (const testCase of CASES) {
    const response = await fetch(`${baseUrl}${testCase.request}`);
    pages.set(testCase.route, { document: new JSDOM(await response.text()).window.document, status: response.status, xRobots: response.headers.get("x-robots-tag") ?? "" });
  }
});

describe.each(CASES)("rendered HTML of $route", (testCase) => {
  const get = () => pages.get(testCase.route) as { document: Document; status: number; xRobots: string };
  const fail = (check: string) => `${testCase.route}: ${check}`;

  it("returns 200 with exactly one h1", () => {
    const { document, status } = get();
    expect(status, fail("status")).toBe(200);
    expect(document.querySelectorAll("h1").length, fail("must have exactly one <h1>")).toBe(1);
    expect(document.querySelector("h1")?.textContent?.trim(), fail("the <h1> must not be empty")).toBeTruthy();
  });

  it("has one non-empty title and one non-empty meta description", () => {
    const { document } = get();
    const titles = document.querySelectorAll("title");
    expect(titles.length, fail("must have exactly one <title>")).toBe(1);
    expect(titles[0].textContent?.trim(), fail("<title> must not be empty")).toBeTruthy();
    const descriptions = document.querySelectorAll('meta[name="description"]');
    expect(descriptions.length, fail('must have exactly one <meta name="description">')).toBe(1);
    expect(descriptions[0].getAttribute("content")?.trim(), fail("meta description must not be empty")).toBeTruthy();
  });

  it("has an absolute canonical equal to the clean URL", () => {
    const canonicals = get().document.querySelectorAll('link[rel="canonical"]');
    expect(canonicals.length, fail('must have exactly one <link rel="canonical">')).toBe(1);
    const href = canonicals[0].getAttribute("href") ?? "";
    expect(href, fail("canonical must be an absolute URL")).toMatch(/^https?:\/\//);
    expect(href, fail(`canonical must be the clean URL ${siteUrl}${testCase.clean}`)).toBe(`${siteUrl}${testCase.clean === "/" ? "" : testCase.clean}`);
  });

  it("has the robots meta the url policy says", () => {
    const robots = get().document.querySelectorAll('meta[name="robots"]');
    expect(robots.length, fail('must have exactly one <meta name="robots">')).toBe(1);
    // Metadata is static, so a filtered variant carries the robots meta of its clean page. The noindex,follow for filtered
    // variants is the X-Robots-Tag response header, checked in e2e/filtered-variants.test.ts.
    const expected = robotsString(urlPolicy({ type: testCase.type, path: testCase.clean }, indexing).robots);
    expect(robots[0].getAttribute("content"), fail(`robots meta must be "${expected}" (INDEXING_ENABLED=${indexing})`)).toBe(expected);
  });

  it("has only valid JSON-LD, with no invented ratings while USE_MOCKS=true", () => {
    const scripts = [...get().document.querySelectorAll('script[type="application/ld+json"]')];
    for (const script of scripts) {
      let data: unknown;
      expect(() => (data = JSON.parse(script.textContent ?? "")), fail("a JSON-LD script is not valid JSON")).not.toThrow();
      if (mocks) {
        const found = containsKeyOrType(data, ["aggregateRating", "AggregateRating", "Review", "review", "reviewRating"]);
        expect(found, fail(`JSON-LD contains "${found}" while USE_MOCKS=true`)).toBeNull();
        const price = containsKeyOrType(data, ["price", "priceCurrency", "lowPrice", "highPrice", "priceRange", "Offer", "offers", "makesOffer"]);
        expect(price, fail(`JSON-LD contains a price ("${price}") while USE_MOCKS=true`)).toBeNull();
      }
    }
  });

  it("has a BreadcrumbList that matches the visible breadcrumb, in the same order", () => {
    const { document } = get();
    const nav = document.querySelector('nav[aria-label*="readcrumb" i]');
    const lists = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((script) => JSON.parse(script.textContent ?? "null") as { "@type"?: string; itemListElement?: { position: number; name: string; item?: string }[] } | null)
      .filter((data) => data?.["@type"] === "BreadcrumbList");
    if (!nav) {
      expect(lists, fail("has a BreadcrumbList JSON-LD but no visible breadcrumb")).toHaveLength(0);
      return;
    }
    expect(lists.length, fail("shows a breadcrumb, so it needs exactly one BreadcrumbList JSON-LD")).toBe(1);
    const visible = [...nav.querySelectorAll("ol > li:not([aria-hidden])")].map((item) => ({ name: item.textContent?.trim() ?? "", href: item.querySelector("a")?.getAttribute("href") ?? null }));
    const markup = lists[0]?.itemListElement ?? [];
    expect(markup.map((entry) => entry.name), fail("BreadcrumbList names must equal the visible breadcrumb, in order")).toEqual(visible.map((entry) => entry.name));
    expect(markup.map((entry) => entry.position), fail("BreadcrumbList positions must be 1..n")).toEqual(visible.map((_, index) => index + 1));
    expect(markup.map((entry) => entry.item ?? null), fail("BreadcrumbList item URLs must be the absolute form of the visible links")).toEqual(visible.map((entry) => (entry.href ? `${siteUrl}${entry.href === "/" ? "/" : entry.href}` : null)));
  });
});
