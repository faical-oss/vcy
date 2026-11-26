import { describe, expect, it } from "vitest";
import { detailSlug, slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Four Seasons Resort Scottsdale")).toBe("four-seasons-resort-scottsdale");
  });
  it("handles ampersands and diacritics", () => {
    expect(slugify("Boulders Resort & Spa")).toBe("boulders-resort-and-spa");
    expect(slugify("Palmaïa, The House of AïA")).toBe("palmaia-the-house-of-aia");
  });
  it("keeps the slugs the header navigation already produced", () => {
    expect(slugify("Yoga Retreats")).toBe("yoga-retreats");
    expect(slugify("Bali, Indonesia")).toBe("bali-indonesia");
    expect(slugify("Eco Lodges")).toBe("eco-lodges");
  });
  it("handles menu labels with ampersands, accents and punctuation", () => {
    expect(slugify("UK & Ireland")).toBe("uk-and-ireland");
    expect(slugify("Réunion")).toBe("reunion");
    expect(slugify("Spa & Thermal Retreats")).toBe("spa-and-thermal-retreats");
    expect(slugify("Chiva-Som Samui")).toBe("chiva-som-samui");
  });
  it("drops apostrophes instead of splitting the word", () => {
    expect(slugify("Editor's Picks")).toBe("editors-picks");
    expect(slugify("Editor’s Selection")).toBe("editors-selection");
  });
  it("handles price-range labels and keeps them distinct", () => {
    const slugs = ["Under $150/night", "$150–$300/night", "$300–$600/night", "Luxury $600+/night"].map(slugify);
    expect(slugs).toEqual(["under-150-night", "150-300-night", "300-600-night", "luxury-600-night"]);
    expect(new Set(slugs).size).toBe(4);
  });
});

describe("detailSlug", () => {
  it("joins name and city, lowercase and readable", () => {
    expect(detailSlug("Amanpuri", "Phuket")).toBe("amanpuri-phuket");
    expect(detailSlug("Palmaïa, The House of AïA", "Ibiza")).toBe("palmaia-the-house-of-aia-ibiza");
  });
  it("leaves the city out when the name already has it, or when there is none", () => {
    expect(detailSlug("Ubud Yoga Retreat", "Ubud")).toBe("ubud-yoga-retreat");
    expect(detailSlug("Amanpuri", "")).toBe("amanpuri");
  });
});
