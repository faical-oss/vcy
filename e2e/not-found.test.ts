import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, it } from "vitest";
import { DYNAMIC_ROUTES } from "./dynamic-routes";

/*
 * The 404 page against the BUILT server: a real 404 status on the first request (an unmatched URL and the unknown slug of
 * every dynamic route), the page's own content (one h1, "Back to home", links to the main sections), a noindex robots tag,
 * the site header and footer, and links that all resolve. The status checks for every slug are in soft-404.test.ts.
 */
const baseUrl = process.env.E2E_BASE_URL as string;
const stamp = Date.now().toString(36);

/** URLs that match no route: the server renders the whole 404 page into the HTML. */
const unmatched = [`/no-such-page-${stamp}`, `/no-such-section-${stamp}/deeper`];
/**
 * Unknown slugs of the dynamic routes: the lookup in generateMetadata() calls notFound() before anything streams (that is
 * what makes the first response a real 404), and Next then sends its error shell: status, noindex and the same 404 page
 * as page data, rendered into the document when the browser hydrates (so no h1 in the raw HTML, as for every 404 before).
 */
const dynamicUnknown = Object.entries(DYNAMIC_ROUTES).map(([pattern, route]): [string, string] => [pattern, route.path(`no-such-slug-${stamp}`)]);

async function load(route: string) {
  const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
  const html = await response.text();
  return { status: response.status, document: new JSDOM(html).window.document, header: response.headers.get("x-robots-tag") };
}

describe("the 404 page", () => {
  it.each(dynamicUnknown)("%s: unknown slug is a real 404, noindex, with the same 404 page", async (_pattern, route) => {
    const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
    const html = await response.text();
    expect(response.status, `status of ${route}`).toBe(404);
    expect(html, `robots on ${route}`).toMatch(/<meta name="robots" content="noindex/);
    expect(html, `404 page content on ${route}`).toContain("We can't find that page");
    expect(html).toContain("Back to home");
  });

  it.each(unmatched)("%s: real 404, one h1, noindex", async (route) => {
    const { status, document } = await load(route);
    expect(status, `status of ${route}`).toBe(404);
    expect(document.querySelectorAll("h1"), `h1 count on ${route}`).toHaveLength(1);
    expect(document.querySelector("h1")?.textContent).toBe("We can't find that page");
    const robots = [...document.querySelectorAll('meta[name="robots"]')].map((meta) => meta.getAttribute("content") ?? "");
    expect(robots.some((content) => content.includes("noindex")), `robots on ${route}: ${robots.join(" | ")}`).toBe(true);
  });

  describe("content", () => {
    let page: Awaited<ReturnType<typeof load>>;
    beforeAll(async () => {
      page = await load(`/no-such-page-content-${stamp}`);
    });

    it("renders the site header and footer around it", () => {
      expect(page.document.querySelector("header")).not.toBeNull();
      expect(page.document.querySelector("footer")).not.toBeNull();
      expect(page.document.querySelectorAll("main"), "one main landmark").toHaveLength(1);
    });

    it("has a primary button back to Home and links to the main sections", () => {
      const home = [...page.document.querySelectorAll("main a")].find((link) => link.textContent?.trim() === "Back to home");
      expect(home?.getAttribute("href")).toBe("/");
      const nav = page.document.querySelector('nav[aria-label="Explore Vacayou"]');
      const labels = [...(nav?.querySelectorAll("a") ?? [])].map((link) => link.textContent?.trim());
      expect(labels).toEqual(["Experiences", "Destinations", "Hotels", "Lifestyle"]);
    });

    it("links only to pages that exist (every internal link in the page body answers 200)", async () => {
      const links = [...page.document.querySelectorAll("main a")].map((link) => link.getAttribute("href") ?? "").filter((href) => href.startsWith("/"));
      expect(links.length).toBeGreaterThanOrEqual(5);
      for (const href of new Set(links)) expect((await fetch(`${baseUrl}${href}`, { redirect: "manual" })).status, href).toBe(200);
    });
  });
});
