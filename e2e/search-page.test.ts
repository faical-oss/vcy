import path from "node:path";
import nextEnv from "@next/env";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { FILTERED_ROBOTS_HEADER } from "@/constants/seo";
import { urlPolicy } from "@/features/seo/url-policy";

/*
 * The results page, in the BUILT server's HTML: noindex with a canonical to /search, one h1, a title and description, and the
 * same shell for every search (the results are fetched in the browser, never rendered on the server). The expectations use
 * the environment the server was built with (INDEXING_ENABLED, NEXT_PUBLIC_SITE_URL): run this in the shell that ran `npm run build`.
 */
nextEnv.loadEnvConfig(path.resolve(import.meta.dirname, ".."));
const baseUrl = process.env.E2E_BASE_URL as string;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const policy = urlPolicy({ type: "search", path: "/search" }, process.env.INDEXING_ENABLED === "true");

const DATES = "checkIn=2099-10-14&checkOut=2099-10-21&adults=2";
const SEARCHES = ["/search", `/search?type=hotel&${DATES}`, `/search?type=experience&destination=bali&${DATES}&sort=price-asc&types=yoga-retreats&page=2`, `/search?type=package&${DATES}&mock=none`];

async function load(url: string) {
  const response = await fetch(`${baseUrl}${url}`);
  const html = await response.text();
  return { response, html, document: new JSDOM(html).window.document };
}

describe("/search rendered HTML", () => {
  it.each(SEARCHES)("%s: 200, one h1, a title and description, noindex, canonical to /search", async (url) => {
    const { response, document } = await load(url);
    expect(response.status, `${url}: status`).toBe(200);
    expect(document.querySelectorAll("h1"), `${url}: exactly one h1`).toHaveLength(1);
    expect(document.querySelector("h1")?.textContent).toBe("Search results");
    expect(document.title.trim(), `${url}: title`).not.toBe("");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")?.trim(), `${url}: description`).toBeTruthy();
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href"), `${url}: canonical is the clean /search`).toBe(`${siteUrl}/search`);
    const robots = document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "";
    expect(robots, `${url}: robots meta`).toContain("noindex");
    expect(robots.includes("nofollow"), `${url}: robots follow`).toBe(!policy.robots.follow);
  });

  it("is the same markup for every search and has no results in it", async () => {
    const pages = await Promise.all(SEARCHES.map(load));
    // Compared without <script>: Next's own flight data in them repeats the requested URL, the visible markup is what must not change.
    const markup = (page: (typeof pages)[number]) => {
      page.document.querySelectorAll("script").forEach((script) => script.remove());
      return page.document.documentElement.outerHTML;
    };
    const first = markup(pages[0]);
    for (const page of pages.slice(1)) expect(markup(page)).toBe(first);
    for (const page of pages) {
      expect(page.document.querySelectorAll("article"), "no result card in the server HTML").toHaveLength(0);
      expect(page.document.querySelector("main")?.textContent, "no price in the server HTML of the page").not.toMatch(/per night|per person|\$\d/);
    }
  });

  it("answers noindex,follow by header for a search URL, like any filtered variant", async () => {
    const response = await fetch(`${baseUrl}/search?type=hotel&${DATES}&sort=price-asc`);
    expect(response.headers.get("x-robots-tag")).toBe(FILTERED_ROBOTS_HEADER);
  });

  it("is not in the sitemap", async () => {
    const xml = await (await fetch(`${baseUrl}/sitemap.xml`)).text();
    expect(xml).not.toContain("/search");
  });

  it("serves the results call without prices or availability when there are no dates, and with them when there are", async () => {
    const without = (await (await fetch(`${baseUrl}/api/search?type=hotel&rooms=1&adults=2&children=0`)).json()) as { items: { price?: unknown; availability: string }[] };
    expect(without.items.length).toBeGreaterThan(0);
    expect(without.items.every((item) => item.price === undefined && item.availability === "unknown")).toBe(true);
    const withDates = (await (await fetch(`${baseUrl}/api/search?type=hotel&${DATES}&rooms=1&children=0`)).json()) as { items: { price?: unknown; availability: string }[] };
    expect(withDates.items.every((item) => item.price !== undefined && item.availability === "available")).toBe(true);
    expect((await fetch(`${baseUrl}/api/search`)).status).toBe(400);
  });
});
