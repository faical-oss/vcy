import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { DYNAMIC_ROUTES } from "./dynamic-routes";

/*
 * Experience detail page against the BUILT server, read like a crawler (HTML only, no JavaScript): all four tab panels, the
 * title, description, canonical and JSON-LD are in the response, and nothing on the page asks the visitor to pick rooms.
 */
const baseUrl = process.env.E2E_BASE_URL as string;
const route = DYNAMIC_ROUTES["/experiences/e/[slug]"];
const path = route.path(route.sample);
const get = async (url: string) => {
  const response = await fetch(`${baseUrl}${url}`, { redirect: "manual" });
  const html = await response.text();
  return { response, html, document: new JSDOM(html).window.document };
};

/** The page as rendered, without the framework's own flight-data scripts (they echo the request URL; the markup does not change). */
const markup = (document: Document) => {
  const body = document.body.cloneNode(true) as HTMLElement;
  body.querySelectorAll("script:not([type='application/ld+json'])").forEach((script) => script.remove());
  return body.innerHTML;
};

describe("experience detail: server HTML", () => {
  it("returns 200 with one h1, the four tabs and a panel for each, all with their content in the HTML", async () => {
    const { response, document } = await get(path);
    expect(response.status).toBe(200);
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector("h1")?.textContent).toBe("6-Day Ubud Yoga & Detox Retreat");
    expect([...document.querySelectorAll('[data-detail="tabs"] [role="tab"]')].map((tab) => tab.textContent)).toEqual(["Overview", "Itinerary", "Hotel & Rooms", "Reviews"]);
    expect(document.querySelectorAll('[data-detail="tabs"] [role="tabpanel"]')).toHaveLength(4);
    for (const text of ["About this experience", "Highlights", "What's included", "Day-by-day itinerary", "Your accommodation", "Room options", "Guest reviews"]) expect(document.body.textContent, text).toContain(text);
    // Every itinerary day is in the markup, not only the open one.
    expect(document.querySelectorAll("ol [role=region]").length).toBeGreaterThanOrEqual(4);
    const panelText = [...document.querySelectorAll('[data-detail="tabs"] [role="tabpanel"]')].map((panel) => panel.textContent ?? "").join(" ");
    expect(panelText).toContain("Deluxe Garden View"); // rooms
    expect(panelText).toContain("Overall experience"); // reviews
  });

  it("has a unique title, a description of at most 160 characters, one absolute canonical and Product and BreadcrumbList JSON-LD", async () => {
    const { document } = await get(path);
    expect(document.title).toMatch(/^6-Day Ubud Yoga & Detox Retreat in Ubud/);
    const description = document.querySelectorAll('meta[name="description"]');
    expect(description).toHaveLength(1);
    expect((description[0].getAttribute("content") ?? "").length).toBeLessThanOrEqual(160);
    const canonicals = document.querySelectorAll('link[rel="canonical"]');
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].getAttribute("href")).toMatch(new RegExp(`^https?://.+${path}$`));
    const data = [...document.querySelectorAll('script[type="application/ld+json"]')].map((script) => JSON.parse(script.textContent ?? ""));
    expect(data.map((entry) => entry["@type"]).sort()).toEqual(["BreadcrumbList", "Product"]);
    expect(JSON.stringify(data.find((entry) => entry["@type"] === "Product"))).not.toMatch(/aggregateRating|offers/); // mocks: no invented rating or price
  });

  it("shows no price and no room selection: 'Check availability', 'Select your dates to see prices', reference rooms, no Reserve now", async () => {
    const { html, document } = await get(path);
    expect([...document.querySelectorAll("button")].map((button) => button.textContent?.trim())).toContain("Check availability");
    expect(html).not.toContain("Reserve now");
    expect(html).not.toContain("Select room");
    expect(html).not.toMatch(/rooms? selected|Add one|Remove one/);
    expect(document.querySelector("#booking")?.textContent).toContain("Select your dates to see prices");
    expect(document.querySelector("#booking")?.textContent).not.toMatch(/\$\s*\d/);
    expect(html).toContain("Rooms depend on your dates. The room types below are shown for reference.");
    expect(html).toContain("All prices are per person, based on shared occupancy.");
  });

  it("serves the same HTML for every search, and answers /api/rooms/availability per person", async () => {
    const start = new Date(Date.now() + 45 * 86_400_000);
    const end = new Date(start.getTime() + 6 * 86_400_000);
    const iso = (date: Date) => date.toISOString().slice(0, 10);
    const clean = await get(path);
    const searched = await get(`${path}?checkIn=${iso(start)}&checkOut=${iso(end)}&adults=2&mock=error`);
    expect(markup(searched.document)).toBe(markup(clean.document));
    const api = await fetch(`${baseUrl}/api/rooms/availability?type=experience&id=${route.sample}&checkIn=${iso(start)}&checkOut=${iso(end)}&adults=4&children=0&rooms=1`);
    expect(api.status).toBe(200);
    const body = (await api.json()) as { rooms: { unit: string }[] };
    expect(body.rooms.length).toBeGreaterThan(0);
    expect(body.rooms[0].unit).toBe("person");
  });

  it("keeps the dated URL canonical to the clean URL and noindexed by header, and 404s an unknown slug on the first request", async () => {
    const start = new Date(Date.now() + 45 * 86_400_000);
    const end = new Date(start.getTime() + 6 * 86_400_000);
    const { response, document } = await get(`${path}?checkIn=${start.toISOString().slice(0, 10)}&checkOut=${end.toISOString().slice(0, 10)}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, follow");
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toMatch(new RegExp(`${path}$`));
    expect((await get(route.path(`no-such-experience-${Date.now().toString(36)}`))).response.status).toBe(404);
  });
});
