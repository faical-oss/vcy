import { expect, it } from "vitest";
import { destinations } from "@/mocks/fixtures/home/destinations";
import { popularSearches } from "@/mocks/fixtures/home/popular-searches";
import { destinationRegistry } from "@/mocks/fixtures/catalog/destinations";
import { experienceCategories } from "@/mocks/fixtures/catalog/categories";
it("Home destination cards and popular searches link to pages that exist", () => {
  const dest = new Set(destinationRegistry.map((d) => d.slug));
  const cats = new Set(experienceCategories.map((c) => c.slug));
  for (const item of [...destinations, ...popularSearches]) {
    const slug = item.href.split("/").pop() as string;
    expect(dest.has(slug) || cats.has(slug), item.href).toBe(true);
  }
});
