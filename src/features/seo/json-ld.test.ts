import { afterEach, describe, expect, it, vi } from "vitest";
import { formatMoney } from "@/helpers/format";
import type { Money } from "@/interfaces";
import * as builders from "./json-ld";
import { breadcrumbListJsonLd, lodgingJsonLd, priceAllowed, productJsonLd, ratingAllowed, type JsonLd } from "./json-ld";

const SITE = "https://vacayou.example";
const PRICE: Money = { amount: 1295, currency: "USD" };
const RATING = { value: 4.8, count: 124 };

/**
 * One sample call per builder. A new `*JsonLd` function in json-ld.ts fails the first test below until it is listed here
 * with the `Money` it was given (or `null` when it has no price), so no builder escapes the checks.
 */
const SAMPLES: Record<string, { build: () => JsonLd; price: Money | null; rating: boolean }> = {
  breadcrumbListJsonLd: { build: () => breadcrumbListJsonLd([{ label: "Home", href: "/" }, { label: "Hotels" }, { label: "Amanpuri" }], SITE), price: null, rating: false },
  lodgingJsonLd: { build: () => lodgingJsonLd({ name: "Amanpuri", path: "/hotels/h/amanpuri-phuket", image: "https://img.example/a.jpg", price: PRICE, rating: RATING }, SITE), price: PRICE, rating: true },
  productJsonLd: { build: () => productJsonLd({ name: "Ubud Yoga", path: "/experiences/e/ubud-yoga", image: "https://img.example/b.jpg", price: PRICE, rating: RATING }, SITE), price: PRICE, rating: true },
};

const builderNames = Object.keys(builders).filter((name) => name.endsWith("JsonLd") && typeof (builders as Record<string, unknown>)[name] === "function");

/** Every value stored under one of `keys`, anywhere in the object. */
function collect(value: unknown, keys: readonly string[], found: unknown[] = []): unknown[] {
  if (Array.isArray(value)) value.forEach((entry) => collect(entry, keys, found));
  else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      if (keys.includes(key)) found.push(entry);
      collect(entry, keys, found);
    }
  }
  return found;
}

afterEach(() => vi.unstubAllEnvs());

describe("JSON-LD builders: registry", () => {
  it("has a sample for every exported builder (add one to SAMPLES when you add a builder)", () => {
    expect(builderNames.sort()).toEqual(Object.keys(SAMPLES).sort());
  });
});

describe("JSON-LD builders: ratings", () => {
  it.each(Object.keys(SAMPLES))("%s never emits aggregateRating or Review while USE_MOCKS=true", (name) => {
    vi.stubEnv("USE_MOCKS", "true");
    expect(ratingAllowed()).toBe(false);
    const output = JSON.stringify(SAMPLES[name].build());
    expect(output).not.toContain("aggregateRating");
    expect(output).not.toContain("AggregateRating");
    expect(output).not.toContain('"Review"');
    expect(output).not.toContain("reviewRating");
  });

  it("emits a real rating only with mocks off, and drops invalid ones", () => {
    vi.stubEnv("USE_MOCKS", "false");
    const input = { name: "A", path: "/hotels/h/a", image: "i", price: PRICE };
    expect(lodgingJsonLd({ ...input, rating: RATING }, SITE).aggregateRating).toEqual({ "@type": "AggregateRating", ratingValue: 4.8, reviewCount: 124 });
    for (const bad of [{ value: 5.5, count: 10 }, { value: 4, count: 0 }, { value: Number.NaN, count: 3 }, { value: 4, count: 1.5 }]) {
      expect(lodgingJsonLd({ ...input, rating: bad }, SITE)).not.toHaveProperty("aggregateRating");
    }
    expect(productJsonLd(input, SITE)).not.toHaveProperty("aggregateRating");
  });
});

describe("JSON-LD builders: no price while on mocks", () => {
  it.each(Object.keys(SAMPLES))("%s emits no price, currency or offer while USE_MOCKS=true", (name) => {
    vi.stubEnv("USE_MOCKS", "true");
    expect(priceAllowed()).toBe(false);
    expect(collect(SAMPLES[name].build(), ["price", "priceCurrency", "offers", "makesOffer", "lowPrice", "highPrice", "priceRange"])).toEqual([]);
  });

  it("emits the offer again with mocks off", () => {
    vi.stubEnv("USE_MOCKS", "false");
    expect(priceAllowed()).toBe(true);
    expect(JSON.stringify(SAMPLES.lodgingJsonLd.build())).toContain("priceCurrency");
  });

  it("builds a Hotel with an address and description", () => {
    vi.stubEnv("USE_MOCKS", "true");
    const hotel = lodgingJsonLd({ name: "A", path: "/hotels/h/a", image: "i", description: "About A.", address: { locality: "Ubud", country: "Indonesia" }, price: PRICE }, SITE);
    expect(hotel).toMatchObject({ "@type": "Hotel", description: "About A.", address: { "@type": "PostalAddress", addressLocality: "Ubud", addressCountry: "Indonesia" } });
  });
});

describe("JSON-LD builders: prices", () => {
  it.each(Object.keys(SAMPLES).filter((name) => SAMPLES[name].price))("%s takes its price only from the Money it was given", (name) => {
    vi.stubEnv("USE_MOCKS", "false");
    const { build, price } = SAMPLES[name];
    const offers = collect(build(), ["makesOffer", "offers"]);
    expect(offers.length).toBeGreaterThan(0);
    for (const offer of offers as { price: string; priceCurrency: string }[]) {
      // Formatting the markup price back must give exactly what the page shows for the same Money.
      expect(formatMoney({ amount: Number(offer.price), currency: offer.priceCurrency })).toBe(formatMoney(price as Money));
    }
  });

  it("changes the markup price when the displayed Money changes (no second source)", () => {
    const other: Money = { amount: 410, currency: "EUR" };
    const output = lodgingJsonLd({ name: "A", path: "/hotels/h/a", image: "i", price: other }, SITE) as { makesOffer: { price: string; priceCurrency: string } };
    expect(output.makesOffer).toMatchObject({ price: "410", priceCurrency: "EUR" });
  });

  it("does not put a price in builders that have no Money input", () => {
    const output = SAMPLES.breadcrumbListJsonLd.build();
    expect(collect(output, ["price", "lowPrice", "highPrice", "priceCurrency", "offers", "makesOffer"])).toEqual([]);
  });

  it("uses only absolute URLs built from the site URL", () => {
    const output = JSON.stringify(SAMPLES.lodgingJsonLd.build());
    expect(output).toContain(`${SITE}/hotels/h/amanpuri-phuket`);
  });
});

describe("breadcrumbListJsonLd", () => {
  it("numbers the crumbs, links the linked ones and leaves out the item of unlinked ones", () => {
    const list = breadcrumbListJsonLd([{ label: "Home", href: "/" }, { label: "Experiences" }, { label: "Yoga" }], SITE) as { itemListElement: Record<string, unknown>[] };
    expect(list.itemListElement.map((entry) => entry.position)).toEqual([1, 2, 3]);
    expect(list.itemListElement[0].item).toBe(`${SITE}/`);
    expect(list.itemListElement[1]).not.toHaveProperty("item");
    expect(list.itemListElement[2].name).toBe("Yoga");
  });
});

describe("product JSON-LD without a price", () => {
  it("writes no offers (prices appear only once dates are chosen)", () => {
    const ld = productJsonLd({ name: "Bali Retreat", path: "/experiences/e/bali", image: "https://img.example/b.jpg" }, SITE);
    expect(ld).not.toHaveProperty("offers");
    expect(ld.name).toBe("Bali Retreat");
  });
});

