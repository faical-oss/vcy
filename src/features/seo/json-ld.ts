import { absoluteUrl } from "@/constants/routes";
import type { BreadcrumbItem, Money } from "@/interfaces";
import { shouldUseMocks } from "@/lib/env";

/*
 * Pure JSON-LD builders: data in, plain object out, no I/O. Every JSON-LD in the site comes from here.
 * Rules (also in CLAUDE.md, enforced by json-ld.test.ts):
 *  - Prices come only from a `Money`, the same value the page formats with `formatMoney`. No builder takes a raw price.
 *    No price or offer is emitted while USE_MOCKS=true.
 *  - `aggregateRating` is emitted only for a real rating and never while USE_MOCKS=true.
 *  - Every builder is named `*JsonLd`, and json-ld.test.ts must list a sample input for it.
 */

export type JsonLd = Record<string, unknown>;

export interface RealRating {
  /** 0 to 5. */
  value: number;
  /** Number of reviews behind the value; must be at least 1. */
  count: number;
}

/** True only when ratings may go into markup: never with mock data (the ratings are invented). */
export function ratingAllowed(): boolean {
  return !shouldUseMocks();
}

/** True only when prices may go into markup: never with mock data (the prices are invented). */
export function priceAllowed(): boolean {
  return !shouldUseMocks();
}

function validRating(rating: RealRating | undefined): rating is RealRating {
  return !!rating && Number.isFinite(rating.value) && rating.value >= 0 && rating.value <= 5 && Number.isInteger(rating.count) && rating.count >= 1;
}

/** Offer markup for a price. The amount and currency are copied from the `Money` the page displays. */
function offerJsonLd(price: Money, url: string): JsonLd {
  return { "@type": "Offer", price: String(price.amount), priceCurrency: price.currency, url };
}

/** BreadcrumbList for the page's breadcrumb. A crumb without a link (the current page, an unlinked group) has no `item`. */
export function breadcrumbListJsonLd(crumbs: readonly BreadcrumbItem[], siteUrl: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      ...(crumb.href ? { item: absoluteUrl(crumb.href, siteUrl) } : {}),
    })),
  };
}

export interface LodgingJsonLdInput {
  name: string;
  /** Path from the route helpers (`hotelDetail(slug)`). */
  path: string;
  image: string;
  description?: string;
  address?: { locality: string; country: string };
  /** The price shown on the page, as `Money`. Left out of the markup while mocks are on. */
  price?: Money;
  rating?: RealRating;
}

/** Hotel. The offer needs a real price and mocks off; the rating needs a real rating and mocks off. */
export function lodgingJsonLd(input: LodgingJsonLdInput, siteUrl: string): JsonLd {
  const url = absoluteUrl(input.path, siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: input.name,
    url,
    image: input.image,
    ...(input.description ? { description: input.description } : {}),
    ...(input.address ? { address: { "@type": "PostalAddress", addressLocality: input.address.locality, addressCountry: input.address.country } } : {}),
    ...(ratingAllowed() && validRating(input.rating)
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: input.rating.value, reviewCount: input.rating.count } }
      : {}),
    ...(priceAllowed() && input.price ? { makesOffer: offerJsonLd(input.price, url) } : {}),
  };
}

export interface ProductJsonLdInput {
  name: string;
  path: string;
  image: string;
  /** The price shown on the page. Absent when the page shows none (prices appear once dates are chosen): no offer is written. */
  price?: Money;
  rating?: RealRating;
}

/** Experience or package with one offer, when a price is given. Same rating and price rules as `lodgingJsonLd`. */
export function productJsonLd(input: ProductJsonLdInput, siteUrl: string): JsonLd {
  const url = absoluteUrl(input.path, siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    url,
    image: input.image,
    ...(ratingAllowed() && validRating(input.rating)
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: input.rating.value, reviewCount: input.rating.count } }
      : {}),
    ...(priceAllowed() && input.price ? { offers: offerJsonLd(input.price, url) } : {}),
  };
}
