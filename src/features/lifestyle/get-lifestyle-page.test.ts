import { beforeEach, describe, expect, it, vi } from "vitest";

const cacheTag = vi.fn();
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: (...tags: string[]) => cacheTag(...tags) }));

import { LIFESTYLE_SLUGS } from "@/constants/routes";
import { destinationBySlug } from "@/mocks/fixtures/catalog/destinations";
import { getPackage, getPackageSitemapPaths } from "@/features/packages/get-package";
import { getLifestylePage, getLifestyleSitemapPaths, getLifestyleSlugs } from "./get-lifestyle-page";
import { lifestyleCrumbs } from "./lifestyle-content";

const ALLOWED_IMAGE_HOSTS = ["images.unsplash.com", "glad-red-27377678.figma.site"];

beforeEach(() => cacheTag.mockClear());

describe("getLifestylePage", () => {
  it("returns null for an unknown slug and tags the entry for a known one", async () => {
    expect(await getLifestylePage("skiing")).toBeNull();
    expect(await getLifestylePage("")).toBeNull();
    await getLifestylePage("golf");
    expect(cacheTag).toHaveBeenCalledWith("lifestyle");
    expect(cacheTag).toHaveBeenCalledWith("lifestyle:golf");
  });

  it("lists the five pages for static params and the sitemap", () => {
    expect(getLifestyleSlugs()).toEqual(LIFESTYLE_SLUGS);
    expect(getLifestyleSitemapPaths()).toEqual(LIFESTYLE_SLUGS.map((slug) => `/lifestyle/${slug}`));
  });

  it.each(LIFESTYLE_SLUGS)("%s: has the template's content, with a unique title and description", async (slug) => {
    const page = await getLifestylePage(slug);
    expect(page?.slug).toBe(slug);
    expect(page?.rows.items).toHaveLength(3);
    expect(page?.magazine.items).toHaveLength(3);
    expect(page?.destinations.items).toHaveLength(8);
    expect(page?.subNav).toHaveLength(3);
    expect(page?.seo.title.length).toBeGreaterThan(5);
    expect(page?.seo.description.length).toBeGreaterThan(60);
    expect(page?.seo.description.length).toBeLessThanOrEqual(200);
  });

  it("has a different title and description on every page", async () => {
    const pages = await Promise.all(LIFESTYLE_SLUGS.map((slug) => getLifestylePage(slug)));
    expect(new Set(pages.map((page) => page?.seo.title)).size).toBe(5);
    expect(new Set(pages.map((page) => page?.seo.description)).size).toBe(5);
  });

  it.each(LIFESTYLE_SLUGS)("%s: every filter chip has a card, every card is on a known chip, and packages carry a detail link and no rating", async (slug) => {
    const page = (await getLifestylePage(slug))!;
    const chips = page.packages.filters;
    for (const chip of chips) expect(page.packages.items.some((item) => item.filters.includes(chip)), chip).toBe(true);
    for (const { card, filters } of page.packages.items) {
      expect(filters.length).toBeGreaterThan(0);
      for (const filter of filters) expect(chips, `${card.id}: ${filter}`).toContain(filter);
      expect(card.rating).toBeUndefined();
      expect(card.reviewCount).toBeUndefined();
      expect(card.href).toBe(`/packages/p/${card.id}`);
      expect(card.highlights).toHaveLength(3);
      expect(card.price?.amount).toBeGreaterThan(0);
    }
  });

  it("has the card counts of the spec: 4, 4, 3, 4 and 6", async () => {
    const counts = await Promise.all(LIFESTYLE_SLUGS.map(async (slug) => (await getLifestylePage(slug))!.packages.items.length));
    expect(counts).toEqual([4, 4, 3, 4, 6]);
  });

  it("uses one package record on several pages with the page's own label, highlights and photos", async () => {
    const meditation = (await getLifestylePage("meditation"))!.packages.items.find((item) => item.card.id === "joshua-tree-solo")!.card;
    const spa = (await getLifestylePage("spa"))!.packages.items.find((item) => item.card.id === "joshua-tree-solo")!.card;
    expect(meditation.title).toBe(spa.title);
    expect(meditation.price).toEqual(spa.price);
    expect(meditation.category).not.toBe(spa.category);
    expect(meditation.highlights).not.toEqual(spa.highlights);
    expect(meditation.images).not.toEqual(spa.images);
  });

  it("gives the yoga cards a four-photo carousel and the other pages one photo", async () => {
    for (const { card } of (await getLifestylePage("yoga"))!.packages.items) expect(card.images).toHaveLength(4);
    for (const { card } of (await getLifestylePage("adventure"))!.packages.items) expect(card.images).toHaveLength(1);
  });

  it("links every destination tile to a destination or region page that exists, and never repeats a tile photo on a page", async () => {
    const regions = ["asia", "europe", "americas", "africa-and-middle-east", "oceania-and-pacific", "indian-ocean"];
    for (const slug of LIFESTYLE_SLUGS) {
      const { items } = (await getLifestylePage(slug))!.destinations;
      for (const tile of items) expect(destinationBySlug.has(tile.destinationSlug!) || regions.includes(tile.destinationSlug!), `${slug}: ${tile.name}`).toBe(true);
      expect(new Set(items.map((tile) => tile.image)).size).toBe(items.length);
    }
  });

  it("serves every image from an allowed host, and magazine links open the external magazine", async () => {
    for (const slug of LIFESTYLE_SLUGS) {
      const page = (await getLifestylePage(slug))!;
      const images = [page.hero.image.src, page.quote.imageSrc!, ...page.rows.items.map((row) => row.image.src), ...page.packages.items.flatMap((item) => item.card.images), ...[page.magazine.featured, ...page.magazine.items].map((article) => article.imageSrc!), ...page.destinations.items.map((tile) => tile.image)];
      for (const src of images) expect(ALLOWED_IMAGE_HOSTS, src).toContain(new URL(src).hostname);
      for (const article of [page.magazine.featured, ...page.magazine.items]) {
        expect(article.external).toBe(true);
        expect(article.href.startsWith("https://")).toBe(true);
      }
      for (const row of page.rows.items) expect(row.image.alt.length).toBeGreaterThan(10);
    }
  });

  it("has no unsourced statistic in the golf intro and no link in the traveller story", async () => {
    expect((await getLifestylePage("golf"))!.intro.body).not.toMatch(/million/i);
    for (const slug of LIFESTYLE_SLUGS) {
      const { quote } = (await getLifestylePage(slug))!;
      expect(quote.eyebrow).toBe("Traveller story");
      expect(quote.href).toBeUndefined();
      expect(quote.ctaLabel).toBeUndefined();
    }
  });

  it("builds Home > Lifestyle (no link) > the page as breadcrumb", async () => {
    const crumbs = lifestyleCrumbs((await getLifestylePage("spa"))!);
    expect(crumbs).toEqual([{ label: "Home", href: "/" }, { label: "Lifestyle" }, { label: "Spa vacations" }]);
  });

  it("has a placeholder page for every package a card links to, and none for an unknown slug", async () => {
    const hrefs = new Set<string>();
    for (const slug of LIFESTYLE_SLUGS) for (const { card } of (await getLifestylePage(slug))!.packages.items) hrefs.add(card.href!);
    expect([...hrefs].sort()).toEqual(expect.arrayContaining(getPackageSitemapPaths().filter((path) => hrefs.has(path))));
    for (const href of hrefs) expect(await getPackage(href.split("/").pop()!), href).not.toBeNull();
    expect(await getPackage("no-such-package")).toBeNull();
  });
});
