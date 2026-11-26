// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { PackageStay } from "@/interfaces";
import { PackageStays, stayNights } from "./package-stays";

afterEach(cleanup);

const stay = (id: string, name: string, nights: number, fromNight: number, hotelSlug?: string): PackageStay => ({
  id,
  hotel: { name, stars: 4, location: "Place, Country", description: `About ${name}.`, amenities: ["Spa"], images: [{ src: "https://images.unsplash.com/photo-1?w=200", alt: name }] },
  nights,
  fromNight,
  hotelSlug,
  rooms: [],
});

describe("stayNights", () => {
  it("names the nights of a stay", () => {
    expect(stayNights({ fromNight: 1, nights: 3 })).toBe("Nights 1–3 · 3 nights");
    expect(stayNights({ fromNight: 4, nights: 1 })).toBe("Night 4 · 1 night");
  });
});

describe("PackageStays", () => {
  const stays = [stay("stay-1", "First Lodge", 3, 1, "first-lodge"), stay("stay-2", "Second Lodge", 2, 4, "second-lodge"), stay("stay-3", "Third Lodge", 2, 6)];

  it("lists one card per property in order, with its nights, under one heading", () => {
    render(<PackageStays stays={stays} heading="Your accommodation" hotelSlugs={new Set()} />);
    expect(screen.getByRole("heading", { level: 2, name: "Your accommodation" })).toBeTruthy();
    const items = screen.getAllByRole("listitem").filter((item) => item.querySelector("h3"));
    expect(items.map((item) => within(item).getByRole("heading", { level: 3 }).textContent?.replace(/\d-star stay/, "").trim())).toEqual(["First Lodge", "Second Lodge", "Third Lodge"]);
    expect(screen.getByText("Nights 1–3 · 3 nights")).toBeTruthy();
    expect(screen.getByText("Nights 4–5 · 2 nights")).toBeTruthy();
    expect(screen.getByText("Nights 6–7 · 2 nights")).toBeTruthy();
  });

  it("links a stay to its hotel page only when that page exists", () => {
    render(<PackageStays stays={stays} heading="Your accommodation" hotelSlugs={new Set(["second-lodge"])} />);
    expect(screen.getByRole("link", { name: "Second Lodge" }).getAttribute("href")).toBe("/hotels/h/second-lodge");
    expect(screen.queryByRole("link", { name: "First Lodge" })).toBeNull(); // has a slug, but no page
    expect(screen.queryByRole("link", { name: "Third Lodge" })).toBeNull(); // no slug
  });
});
