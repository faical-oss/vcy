import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

import { LIFESTYLE_SLUGS, isBuiltRoute, packageDetail } from "@/constants/routes";
import { getLifestylePage } from "@/features/lifestyle/get-lifestyle-page";
import { durationLabel } from "@/helpers/stay-duration";
import { packages as homePackages } from "@/mocks/fixtures/home/packages";
import { getPackage, getPackageSitemapPaths, getPackageSlugs, getSimilarPackages } from "./get-package";
import { PACKAGE_DETAIL_CONTENT, packageDetailCrumbs, packageDetailMetadata } from "./package-content";

describe("one source of packages", () => {
  it("has 22 packages with unique ids, a page for each, and every built path", () => {
    const slugs = getPackageSlugs();
    expect(slugs).toHaveLength(22);
    expect(new Set(slugs).size).toBe(22);
    for (const path of getPackageSitemapPaths()) expect(isBuiltRoute(path), path).toBe(true);
    expect(getPackageSitemapPaths()[0]).toBe(packageDetail(slugs[0]));
  });

  it("covers every package the Home and Lifestyle cards show", async () => {
    const slugs = new Set(getPackageSlugs());
    for (const card of homePackages) expect(slugs.has(card.id), `home: ${card.id}`).toBe(true);
    for (const slug of LIFESTYLE_SLUGS) for (const { card } of (await getLifestylePage(slug))!.packages.items) expect(slugs.has(card.id), `lifestyle: ${card.id}`).toBe(true);
  });

  it("links every Home card to its own package page, and none to the missing /packages listing", () => {
    for (const card of homePackages) expect(card.href, card.id).toBe(packageDetail(card.id));
    expect(homePackages.some((card) => card.href === "/packages")).toBe(false);
  });

  it("returns null for an unknown or malformed slug", async () => {
    expect(await getPackage("no-such-package")).toBeNull();
    expect(await getPackage("Bad Slug")).toBeNull();
    expect(await getPackage("")).toBeNull();
  });
});

describe("package detail content", () => {
  it("is fixed at its nights, except the one flexible example", async () => {
    const details = await Promise.all(getPackageSlugs().map((slug) => getPackage(slug)));
    const flexible = details.filter((detail) => detail!.duration.type === "flexible");
    expect(flexible.map((detail) => detail!.slug)).toEqual(["tuscany-wellness"]);
    expect(durationLabel(flexible[0]!.duration)).toBe("3–7 nights");
    for (const detail of details.filter((entry) => entry!.duration.type === "fixed")) expect(detail!.duration).toEqual({ type: "fixed", nights: detail!.nights });
  });

  it("has a group size of 1 to 12, the 'Package includes' list, a price per person and no rating-bearing markup fields", async () => {
    const detail = (await getPackage("bali-soul-surf"))!;
    expect(detail.groupSize).toEqual({ min: 1, max: 12 });
    expect(detail.includedInAll[0]).toBe("7 nights accommodation");
    expect(detail.priceFrom).toEqual({ amount: 2495, currency: "USD" });
    expect(detail.stays).toHaveLength(1);
    expect(detail.itinerary).toHaveLength(7);
  });

  it("has several stays for the multi-property packages, with nights that add up and unique room ids", async () => {
    for (const slug of ["scottish-links", "patagonia-peaks", "kerala", "cyclades"]) {
      const detail = (await getPackage(slug))!;
      expect(detail.stays.length, slug).toBeGreaterThan(1);
      expect(detail.stays.reduce((sum, stay) => sum + stay.nights, 0), slug).toBe(detail.nights);
      expect(detail.stays[0].fromNight).toBe(1);
      const ids = detail.stays.flatMap((stay) => stay.rooms.map((room) => room.id));
      expect(new Set(ids).size, slug).toBe(ids.length);
      expect(detail.includedInAll[0]).toBe(`${detail.nights} nights across ${detail.stays.length} properties`);
    }
    const flexible = (await getPackage("tuscany-wellness"))!;
    expect(flexible.includedInAll[0]).toBe("Accommodation for every night");
  });

  it("gives every package a unique title and description", async () => {
    const details = await Promise.all(getPackageSlugs().map((slug) => getPackage(slug)));
    const metadata = details.map((detail) => packageDetailMetadata(detail!));
    expect(new Set(metadata.map((entry) => entry.title)).size).toBe(22);
    expect(new Set(metadata.map((entry) => entry.description)).size).toBe(22);
    for (const entry of metadata) expect(entry.description.length).toBeLessThanOrEqual(160);
    expect(packageDetailMetadata((await getPackage("tuscany-wellness"))!).title).toContain("3–7 nights");
  });

  it("uses the package wording and a breadcrumb with an unlinked Packages crumb", async () => {
    expect(PACKAGE_DETAIL_CONTENT.accommodationTab).toBe("Accommodation");
    expect(PACKAGE_DETAIL_CONTENT.includesTitle).toBe("Package includes");
    expect(packageDetailCrumbs({ title: "X" })).toEqual([{ label: "Home", href: "/" }, { label: "Packages" }, { label: "X" }]);
  });
});

describe("similar packages", () => {
  it("returns three other packages, those with the same label first, linked to their pages, with no price", async () => {
    const similar = await getSimilarPackages("bali-soul-surf", 3);
    expect(similar).toHaveLength(3);
    expect(similar.map((card) => card.id)).not.toContain("bali-soul-surf");
    for (const card of similar) {
      expect(card.href).toBe(packageDetail(card.id));
      expect(card.price).toBeUndefined();
      expect(card.rating).toBeUndefined();
      expect(card.highlights).toHaveLength(3);
    }
    expect(await getSimilarPackages("nope", 3)).toEqual([]);
  });
});
