import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { DYNAMIC_ROUTES } from "./dynamic-routes";
import { flags } from "./flags";

/*
 * Hotel detail page against the BUILT server: the static shell, the availability flow (no price and no availability on the server), and what must
 * not happen (no search-dependent HTML, no second h1). Needs the mock catalog (USE_MOCKS=true).
 */
const baseUrl = process.env.E2E_BASE_URL as string;
const route = DYNAMIC_ROUTES["/hotels/h/[slug]"];
const path = route.path(route.sample);

const isoPlusDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
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

describe("hotel detail: static shell", () => {
  it("returns 200 with one h1 holding the hotel name, the four tabs and the three similar hotels", async () => {
    const { response, document } = await get(path);
    expect(response.status).toBe(200);
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector("h1")?.textContent).toBe("Azure Spa & Wellness Resort");
    expect([...document.querySelectorAll('[data-detail="tabs"] [role="tab"]')].map((tab) => tab.textContent)).toEqual(["Overview", "Rooms", "Location", "Reviews"]);
    expect(document.querySelectorAll('[data-detail="tabs"] [role="tabpanel"]')).toHaveLength(4);
    const similar = [...document.querySelectorAll("h2")].find((heading) => heading.textContent === "Similar hotels")?.parentElement;
    expect(similar?.querySelectorAll("article")).toHaveLength(3);
  });

  it("puts all tab content in the HTML, and no price: the booking box asks for dates and the rooms are shown for reference", async () => {
    const { html, document } = await get(path);
    for (const text of ["About the hotel", "Our rooms", "Nearby attractions", "Guest reviews"]) expect(html, text).toContain(text);
    expect(document.querySelector("#booking")?.textContent).toContain("Select your dates to see prices");
    expect(document.querySelector("#booking")?.textContent).not.toMatch(/\$\s*\d/);
    expect(html).toContain("Rooms depend on your dates. The room types below are shown for reference. Availability and prices are confirmed after you select Check availability.");
    const rooms = document.querySelector('[role="tabpanel"]#rooms, #rooms-heading')?.closest("section");
    expect(rooms?.textContent ?? "").not.toMatch(/\$\s*\d/);
    expect(html, "no steppers and no select buttons").not.toMatch(/Select room|Add one|Remove one/);
  });

  it("shows the review form only when its flag is on, and has a map link, but no video button", async () => {
    const { html } = await get(path);
    expect(html.includes("Travelled on this trip?"), `review form must follow FEATURE_REVIEW_FORM (flag on: ${flags.reviewForm})`).toBe(flags.reviewForm);
    expect(html).toContain("Open in Maps");
    expect(html).not.toContain("Watch video");
  });

  it("uses real alt text and loads only the first gallery image eagerly", async () => {
    const { document } = await get(path);
    const gallery = [...document.querySelectorAll("img")].filter((image) => image.getAttribute("alt")?.includes("Azure Spa & Wellness Resort, Krabi: photo"));
    expect(gallery.length).toBeGreaterThanOrEqual(4);
    expect(gallery[0].getAttribute("alt")).toContain("photo 1 of");
    const eager = gallery.filter((image) => image.getAttribute("fetchpriority") === "high" || image.getAttribute("loading") === "eager");
    expect(eager).toHaveLength(1);
    for (const image of document.querySelectorAll("img")) expect(image.getAttribute("alt"), "every image has an alt attribute").not.toBeNull();
  });

  it("has the Hotel and BreadcrumbList JSON-LD, with no rating or price while on mocks", async () => {
    const { document } = await get(path);
    const data = [...document.querySelectorAll('script[type="application/ld+json"]')].map((script) => JSON.parse(script.textContent ?? ""));
    expect(data.map((entry) => entry["@type"]).sort()).toEqual(["BreadcrumbList", "Hotel"]);
    const hotel = data.find((entry) => entry["@type"] === "Hotel");
    expect(hotel).toMatchObject({ name: "Azure Spa & Wellness Resort", address: { addressLocality: "Krabi", addressCountry: "Thailand" } });
    expect(JSON.stringify(hotel)).not.toMatch(/aggregateRating|Review|price|offer/i);
  });
});

describe("hotel detail: availability flow", () => {
  const dated = `${path}?checkIn=${isoPlusDays(45)}&checkOut=${isoPlusDays(48)}&adults=2&rooms=1&mock=none`;

  it("serves the same HTML for every search (availability is never fetched on the server)", async () => {
    const clean = await get(path);
    const searched = await get(dated);
    expect(searched.response.status).toBe(200);
    expect(markup(searched.document)).toBe(markup(clean.document));
    expect(searched.html).toContain("Select your dates to see prices");
    expect(searched.html).not.toMatch(/No rooms are available|Sold out for your dates/);
  });

  it("keeps one h1 and the clean canonical on a searched URL, and noindexes it by header", async () => {
    const { response, document } = await get(dated);
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, follow");
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "";
    expect(canonical).toMatch(new RegExp(`${path}$`));
    expect(canonical).not.toContain("?");
  });

  it("offers one primary 'Check availability' button and no 'Reserve now' in the HTML", async () => {
    const { document } = await get(path);
    const labels = [...document.querySelectorAll("button")].map((button) => button.textContent?.trim());
    expect(labels).toContain("Check availability");
    expect(labels).not.toContain("Reserve now");
  });

  it("has a mobile bottom bar with a prompt and a button, the booking box and one h1", async () => {
    const { document } = await get(path);
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect([...document.querySelectorAll("button")].some((button) => button.textContent === "Select dates")).toBe(true);
    expect(document.querySelector("#booking")).not.toBeNull();
  });

  it("answers /api/rooms/availability for a valid search, rejects an incomplete one, and never caches", async () => {
    const ok = await fetch(`${baseUrl}/api/rooms/availability?type=hotel&id=${route.sample}&checkIn=${isoPlusDays(45)}&checkOut=${isoPlusDays(48)}&adults=2&children=0&rooms=1`);
    expect(ok.status).toBe(200);
    expect(ok.headers.get("cache-control")).toBe("no-store");
    const body = (await ok.json()) as { rooms: { roomId: string; available: boolean; price: { amount: number }; unit: string }[] };
    expect(body.rooms.length).toBeGreaterThan(0);
    expect(body.rooms[0]).toMatchObject({ unit: "night" });
    expect((await fetch(`${baseUrl}/api/rooms/availability?type=hotel&id=${route.sample}`)).status).toBe(400);
  });

  it("serves /checkout only with its flag", async () => {
    expect((await get("/checkout")).response.status, `/checkout must follow FEATURE_CHECKOUT_STUB (flag on: ${flags.checkoutStub})`).toBe(flags.checkoutStub ? 200 : 404);
  });

  it("offers no flexibility chips in the HTML", async () => {
    const { html } = await get(path);
    expect(html).not.toContain("Exact dates");
  });
});

describe("hotel detail: unknown hotels", () => {
  it("returns a real 404 on the first request, before anything streams", async () => {
    const { response } = await get(route.path(`no-such-hotel-${Date.now().toString(36)}`));
    expect(response.status).toBe(404);
  });
});
