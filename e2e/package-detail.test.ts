import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { DYNAMIC_ROUTES } from "./dynamic-routes";

/*
 * Package detail page against the BUILT server, read like a crawler (HTML only): the four tab panels (Overview, Itinerary,
 * Accommodation, Reviews) with all their content, one h1, a unique title and description, canonical, Product and BreadcrumbList
 * JSON-LD without an invented rating or price, the package wording, no price before dates, and the availability API per person.
 * A package of several properties lists every property and shows availability only.
 */
const baseUrl = process.env.E2E_BASE_URL as string;
const route = DYNAMIC_ROUTES["/packages/p/[slug]"];
const path = route.path(route.sample);
const get = async (url: string) => {
  const response = await fetch(`${baseUrl}${url}`, { redirect: "manual" });
  const html = await response.text();
  return { response, html, document: new JSDOM(html).window.document };
};
const markup = (document: Document) => {
  const body = document.body.cloneNode(true) as HTMLElement;
  body.querySelectorAll("script:not([type='application/ld+json'])").forEach((script) => script.remove());
  return body.innerHTML;
};
const iso = (date: Date) => date.toISOString().slice(0, 10);
const inDays = (days: number) => iso(new Date(Date.now() + days * 86_400_000));

describe("package detail: server HTML", () => {
  it("returns 200 with one h1, the four tabs with Accommodation, and every panel's content in the HTML", async () => {
    const { response, document } = await get(path);
    expect(response.status).toBe(200);
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector("h1")?.textContent).toBe("Bali Soul & Surf");
    expect([...document.querySelectorAll('[data-detail="tabs"] [role="tab"]')].map((tab) => tab.textContent)).toEqual(["Overview", "Itinerary", "Accommodation", "Reviews"]);
    expect(document.querySelectorAll('[data-detail="tabs"] [role="tabpanel"]')).toHaveLength(4);
    for (const text of ["About this package", "Highlights", "What's included", "Day-by-day itinerary", "Your accommodation", "Room options", "Guest reviews"]) expect(document.body.textContent, text).toContain(text);
    expect(document.body.textContent).not.toContain("Hotel & Rooms");
    expect(document.body.textContent).not.toContain("About this experience");
  });

  it("has a unique title, a description of at most 160 characters, one absolute canonical, and Product and BreadcrumbList JSON-LD without a rating or price", async () => {
    const { document } = await get(path);
    expect(document.title).toMatch(/^Bali Soul & Surf in Bali: 7 nights package/);
    const description = document.querySelectorAll('meta[name="description"]');
    expect(description).toHaveLength(1);
    expect((description[0].getAttribute("content") ?? "").length).toBeLessThanOrEqual(160);
    const canonicals = document.querySelectorAll('link[rel="canonical"]');
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].getAttribute("href")).toMatch(new RegExp(`^https?://.+${path}$`));
    const data = [...document.querySelectorAll('script[type="application/ld+json"]')].map((script) => JSON.parse(script.textContent ?? ""));
    expect(data.map((entry) => entry["@type"]).sort()).toEqual(["BreadcrumbList", "Product"]);
    expect(JSON.stringify(data.find((entry) => entry["@type"] === "Product"))).not.toMatch(/aggregateRating|offers/);
    const crumbs = JSON.parse(document.querySelectorAll('script[type="application/ld+json"]')[0].textContent ?? "{}");
    const list = (data.find((entry) => entry["@type"] === "BreadcrumbList") ?? crumbs).itemListElement.map((item: { name: string }) => item.name);
    expect(list).toEqual(["Home", "Packages", "Bali Soul & Surf"]);
  });

  it("uses the package wording in the booking card and shows no price or room selection before dates", async () => {
    const { html, document } = await get(path);
    expect(document.querySelector("#booking")?.textContent).toContain("Package includes");
    expect(document.querySelector("#booking")?.textContent).not.toContain("Included in all rooms");
    expect(document.querySelector("#booking")?.textContent).toContain("Select your dates to see prices");
    expect(document.querySelector("#booking")?.textContent).not.toMatch(/\$\s*\d/);
    expect([...document.querySelectorAll("button")].map((button) => button.textContent?.trim())).toContain("Check availability");
    expect(html).not.toContain("Reserve now");
    expect(html).not.toContain("Select room");
    expect(html).toContain("All prices are per person, based on shared occupancy.");
  });

  it("lists every property of a multi-property package, with its nights and its rooms", async () => {
    const { document } = await get(route.path("scottish-links"));
    const text = document.body.textContent ?? "";
    for (const part of ["Links House", "Spey Valley Golf Lodge", "The Old Course Hotel", "Nights 1–3 · 3 nights", "Nights 4–5 · 2 nights", "Nights 6–7 · 2 nights"]) expect(text, part).toContain(part);
    expect(text).toContain("All prices are per person, based on shared occupancy.");
    expect(text).not.toMatch(/included in the package/i);
    expect(document.querySelector("#booking")?.textContent).toContain("7 nights across 3 properties");
  });

  it("serves the same HTML for every search, and answers /api/rooms/availability per person", async () => {
    const clean = await get(path);
    const searched = await get(`${path}?checkIn=${inDays(45)}&checkOut=${inDays(52)}&adults=2&mock=error`);
    expect(markup(searched.document)).toBe(markup(clean.document));
    const api = await fetch(`${baseUrl}/api/rooms/availability?type=package&id=${route.sample}&checkIn=${inDays(45)}&checkOut=${inDays(52)}&adults=4&children=0&rooms=1`);
    expect(api.status).toBe(200);
    const body = (await api.json()) as { rooms: { unit: string }[] };
    expect(body.rooms.length).toBeGreaterThan(0);
    expect(body.rooms[0].unit).toBe("person");
  });

  it("answers the availability API by the package's duration: a fixed end is recomputed, a flexible range is limited", async () => {
    const fixed = await fetch(`${baseUrl}/api/rooms/availability?type=package&id=${route.sample}&checkIn=${inDays(45)}&checkOut=${inDays(47)}&adults=2&rooms=1`);
    expect(fixed.status).toBe(200); // 2 nights in the URL, 7 nights fixed: repaired, not refused
    const flexible = "tuscany-wellness"; // 3 to 7 nights
    expect((await fetch(`${baseUrl}/api/rooms/availability?type=package&id=${flexible}&checkIn=${inDays(45)}&checkOut=${inDays(49)}&adults=2&rooms=1`)).status).toBe(200);
    expect((await fetch(`${baseUrl}/api/rooms/availability?type=package&id=${flexible}&checkIn=${inDays(45)}&checkOut=${inDays(46)}&adults=2&rooms=1`)).status).toBe(400);
    expect((await fetch(`${baseUrl}/api/rooms/availability?type=package&id=${flexible}&checkIn=${inDays(45)}&checkOut=${inDays(55)}&adults=2&rooms=1`)).status).toBe(400);
    expect((await fetch(`${baseUrl}/api/rooms/availability?type=package&id=no-such-package&checkIn=${inDays(45)}&checkOut=${inDays(52)}`)).status).toBe(404);
  });

  it("links the similar packages to their own pages", async () => {
    const { document } = await get(path);
    const links = [...document.querySelectorAll("li a")].map((link) => link.getAttribute("href") ?? "").filter((href) => href.startsWith("/packages/p/"));
    expect(links.length).toBeGreaterThanOrEqual(3);
    for (const href of links) expect((await fetch(`${baseUrl}${href}`)).status, href).toBe(200);
  });
});
