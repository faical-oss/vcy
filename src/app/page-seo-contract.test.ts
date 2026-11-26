import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { NOINDEX_ALLOWLIST, SITE_DIR, isAllowlisted, sitePages } from "@/test-support/site-pages";
import { DYNAMIC_ROUTES, STATIC_ROUTES } from "../../e2e/dynamic-routes";

/*
 * Route contract: every public page must take its metadata through pageSeo() (canonical + robots from the one policy),
 * and every dynamic page must be covered by the soft-404 e2e test. A new page that skips either fails here.
 */
const pages = sitePages();

describe("public pages go through pageSeo()", () => {
  it("finds the site pages", () => {
    expect(pages.length).toBeGreaterThan(5);
  });

  it.each(pages.filter((page) => !isAllowlisted(page.route)))("$route ($relative)", ({ file, relative }) => {
    const source = readFileSync(file, "utf8");
    expect(
      /export\s+(async\s+)?function\s+generateMetadata\b/.test(source),
      `${relative} must export generateMetadata. Add one that returns { title, description, ...pageSeo({ type, path }) } (see CLAUDE.md, "SEO definition of done"), or add the route to NOINDEX_ALLOWLIST in src/test-support/site-pages.ts if it must never be indexed.`,
    ).toBe(true);
    expect(/\bpageSeo\(/.test(source), `${relative} exports generateMetadata but does not call pageSeo(). Spread ...pageSeo({ type, path }) into its result so canonical and robots come from the url policy.`).toBe(true);
    expect(/from\s+["']@\/features\/seo\/url-policy["']/.test(source), `${relative} must import pageSeo from "@/features/seo/url-policy".`).toBe(true);
    expect(
      /from\s+["']@\/components\/sections\/listing\/listing-hero["']/.test(source),
      `${relative} imports ListingHero directly. Use ListingPageHero from "@/features/seo/listing-page-hero": it renders the BreadcrumbList JSON-LD from the same crumbs as the visible breadcrumb.`,
    ).toBe(false);
  });
});

describe("noindex allowlist", () => {
  it("only lists routes that exist or are planned noindex sections, and stays small", () => {
    expect(NOINDEX_ALLOWLIST.length).toBeLessThanOrEqual(5);
    const existing = pages.filter((page) => isAllowlisted(page.route));
    expect(existing.length, "the account pages must still exist under the allowlist").toBeGreaterThan(0);
  });

  it("noindexes every allowlisted section that exists (robots index:false in its layout or pages)", () => {
    const covered = new Set<string>();
    const sections = [...new Set(pages.filter((page) => isAllowlisted(page.route)).map((page) => `/${page.route.split("/")[1]}`))];
    for (const section of sections) {
      const dir = path.join(SITE_DIR, section.slice(1));
      const sources = readdirSync(dir, { withFileTypes: true, recursive: true })
        .filter((entry) => entry.isFile() && /^(layout|page)\.tsx$/.test(entry.name))
        .map((entry) => readFileSync(path.join(entry.parentPath, entry.name), "utf8"));
      // `pageSeo({ type: "search" })` is noindex by urlPolicy (url-policy.test.ts), so it counts as setting it.
      expect(sources.some((source) => /index:\s*false|pageSeo\(\{\s*type:\s*"search"/.test(source)), `${section} is on the noindex allowlist but sets no robots { index: false }`).toBe(true);
      covered.add(section);
    }
    expect(covered.size).toBeGreaterThan(0);
  });
});

describe("dynamic routes are covered by the soft-404 e2e test", () => {
  const dynamic = pages.filter((page) => page.route.includes("[") && !isAllowlisted(page.route));

  it("finds the dynamic pages", () => {
    expect(dynamic.length).toBeGreaterThan(0);
  });

  it.each(dynamic)("$route is in e2e/dynamic-routes.ts", ({ route }) => {
    expect(Object.keys(DYNAMIC_ROUTES), `Dynamic route ${route} must be added to DYNAMIC_ROUTES in e2e/dynamic-routes.ts so an unknown slug is tested for a real 404 on the first request and its rendered HTML is checked.`).toContain(route);
  });

  it("lists no route that no longer exists", () => {
    const routes = pages.map((page) => page.route);
    for (const pattern of Object.keys(DYNAMIC_ROUTES)) expect(routes, `DYNAMIC_ROUTES has ${pattern} but no such page exists`).toContain(pattern);
  });
});

describe("static pages are covered by the rendered-HTML e2e checks", () => {
  const staticPages = pages.filter((page) => !page.route.includes("[") && !isAllowlisted(page.route)).map((page) => page.route);

  it.each(staticPages)("%s is in STATIC_ROUTES (e2e/dynamic-routes.ts)", (route) => {
    expect(Object.keys(STATIC_ROUTES), `Static page ${route} must be added to STATIC_ROUTES in e2e/dynamic-routes.ts so its rendered HTML (h1, title, canonical, robots, JSON-LD) is checked.`).toContain(route);
  });

  it("lists no static route that no longer exists", () => {
    for (const route of Object.keys(STATIC_ROUTES)) expect(staticPages, `STATIC_ROUTES has ${route} but no such page exists`).toContain(route);
  });
});
