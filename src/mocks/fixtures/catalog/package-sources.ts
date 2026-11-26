import type { Money, StayDuration } from "@/interfaces";
import { packages as homePackages } from "../home/packages";
import { lifestylePackages, lifestylePages } from "../lifestyle";

/**
 * The one source of the packages: the 17 packages of the Lifestyle pages plus the 5 only Home showed, 22 in all (every one has a
 * detail page). Home's Tuscany and Maldives cards use the Lifestyle ids. The badge and label come from the first Lifestyle page
 * that lists the package (or the Home card); ratings only exist for the Home cards. TODO(api): packages come from Trip Fusion.
 */
export interface PackageSource {
  id: string;
  title: string;
  provider: string;
  location: string;
  nights: number;
  price: Money;
  images: string[];
  badge: string;
  category: string;
  /** Only the Home cards carry one (a placeholder); never shown as a real rating. */
  rating?: number;
  reviewCount?: number;
}

const homeById = new Map(homePackages.map((card) => [card.id, card]));

function fromLifestyle(id: string): { badge: string; category: string } {
  for (const page of Object.values(lifestylePages)) {
    const ref = page.packageRefs.find((entry) => entry.id === id);
    if (ref) return { badge: ref.badge, category: ref.category };
  }
  return { badge: "Package", category: "Wellness Package" };
}

const lifestyleSources: PackageSource[] = lifestylePackages.map((record) => {
  const home = homeById.get(record.id);
  const { badge, category } = fromLifestyle(record.id);
  return { id: record.id, title: record.title, provider: record.provider, location: record.location, nights: record.nights, price: record.price ?? { amount: 0, currency: "USD" }, images: record.images, badge, category, rating: home?.rating, reviewCount: home?.reviewCount };
});

const known = new Set(lifestyleSources.map((source) => source.id));
const homeOnly: PackageSource[] = homePackages
  .filter((card) => !known.has(card.id))
  .map((card) => ({ id: card.id, title: card.title, provider: card.provider, location: card.location, nights: card.nights, price: card.price ?? { amount: 0, currency: "USD" }, images: card.images, badge: card.badge, category: card.category, rating: card.rating, reviewCount: card.reviewCount }));

export const packageSources: readonly PackageSource[] = [...lifestyleSources, ...homeOnly];
export const packageSourceById = new Map(packageSources.map((source) => [source.id, source]));

/** Packages with a flexible duration (one example); every other package is fixed at its nights. TODO(api): comes with the package. */
export const PACKAGE_DURATIONS: Readonly<Record<string, StayDuration>> = {
  "tuscany-wellness": { type: "flexible", minNights: 3, maxNights: 7 },
};
