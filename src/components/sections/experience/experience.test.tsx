// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DetailTabs } from "@/components/sections/detail/detail-tabs";
import { stayStore } from "@/store/stay-store";
import type { ExperienceDetail } from "@/interfaces";
import { ExperienceBookingPrice } from "./experience-booking-price";
import { ExperienceHeader } from "./experience-header";
import { ExperienceOverview } from "./experience-overview";
import { ItineraryTab } from "./itinerary-tab";

// The URL the components read (the stay store reads `window.location`): setting `search.value` rewrites it.
const { replace, push, search } = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  search: {
    get value(): string {
      return window.location.search.replace(/^\?/, "");
    },
    set value(next: string) {
      window.history.replaceState(null, "", next ? `/?${next}` : "/");
    },
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push }), usePathname: () => "/experiences/e/test", useSearchParams: () => new URLSearchParams(search.value) }));
vi.mock("@/components/auth/auth-provider", () => ({ useAuth: () => ({ session: null, openAuth: vi.fn() }) }));

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

const photo = (index: number) => ({ src: `/images/p${index}.jpg`, alt: `Photo ${index}` });
const room = (tier: number) => ({
  id: `room-${tier}`,
  name: `Room ${tier}`,
  sizeSqm: 30 + tier * 10,
  bed: "King",
  board: "Full board",
  features: ["A", "B", "C", "D"],
  description: "A room.",
  amenityGroups: [{ label: "Bathroom", items: ["Shower"] }],
  maxAdults: 2,
  maxOccupancy: 3,
  images: [photo(tier)],
  priceFrom: { amount: 1000 * tier, currency: "USD" },
});
/** A small experience: six nights, so six itinerary days. */
const experience: ExperienceDetail = {
  id: "test",
  slug: "test",
  title: "6-Day Test Retreat",
  category: { slug: "yoga-retreats", label: "Yoga Retreats" },
  provider: "Test Retreat Centre",
  location: { label: "Ubud, Bali", city: "Ubud", country: "Bali" },
  nights: 6,
  duration: { type: "fixed", nights: 6 },
  groupSize: { min: 4, max: 12 },
  images: [1, 2, 3].map(photo),
  about: ["First paragraph about Ubud.", "Second paragraph."],
  highlights: (["sun", "leaf", "utensils", "sparkles", "pin", "heart"] as const).map((icon) => ({ icon, text: `Highlight ${icon}` })),
  included: [{ text: "6 nights accommodation", included: true }, { text: "All meals", included: true }, { text: "Spa treatments", included: false }],
  itinerary: Array.from({ length: 6 }, (_, index) => ({ day: index + 1, title: `Title ${index + 1}`, description: `Description of day ${index + 1}.`, image: photo(index) })),
  hotel: { name: "Test Retreat Centre", stars: 5, location: "Ubud, Bali", description: "A stay.", amenities: ["Free Wi-Fi"], images: [photo(9)] },
  rooms: [room(1), room(2), room(3)],
  reviews: { overall: 4.8, count: 212, categories: [{ label: "Overall experience", score: 4.9 }], items: [] },
  includedInAll: ["a", "b", "c", "d"],
  freeCancellationDays: 30,
  priceFrom: { amount: 1000, currency: "USD" },
};

describe("ExperienceHeader", () => {
  it("shows the category and badge, one h1, the provider, and location, nights, group size and rating", () => {
    render(<ExperienceHeader experience={{ ...experience, badge: "Best seller" }} breadcrumb={<nav>crumbs</nav>} actions={<button type="button">actions</button>} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(experience.title);
    expect(screen.getByText(experience.provider)).toBeTruthy();
    expect(screen.getByText("Best seller")).toBeTruthy();
    expect(screen.getByText(experience.location.label)).toBeTruthy();
    expect(screen.getByText(`${experience.nights} nights`)).toBeTruthy();
    expect(screen.getByText("4–12 people")).toBeTruthy();
    expect(screen.getByText(`(${experience.reviews.count} reviews)`)).toBeTruthy();
  });
});

describe("ExperienceOverview", () => {
  it("has About, six highlights, the included list with one greyed exclusion, and Location", () => {
    render(<ExperienceOverview experience={experience} />);
    for (const name of ["About this experience", "Highlights", "What's included", "Location"]) expect(screen.getByRole("heading", { name })).toBeTruthy();
    const highlights = within(screen.getByRole("heading", { name: "Highlights" }).closest("section") as HTMLElement).getAllByRole("listitem");
    expect(highlights).toHaveLength(6);
    expect(screen.getByText("(not included)")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Open in Maps/ }).getAttribute("target")).toBe("_blank");
  });
});

describe("ItineraryTab", () => {
  it("opens the first day, keeps only one open, and keeps every day's text in the markup", () => {
    const { container } = render(<ItineraryTab days={experience.itinerary} />);
    const buttons = screen.getAllByRole("button", { name: /Day \d/ });
    expect(buttons).toHaveLength(experience.nights);
    expect(buttons[0].getAttribute("aria-expanded")).toBe("true");
    expect(buttons[1].getAttribute("aria-expanded")).toBe("false");
    for (const day of experience.itinerary) expect(container.textContent).toContain(day.description); // closed panels are hidden, not removed

    fireEvent.click(buttons[2]);
    expect(buttons[2].getAttribute("aria-expanded")).toBe("true");
    expect(buttons[0].getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelectorAll("[role=region]:not([hidden])")).toHaveLength(1);
    fireEvent.click(buttons[2]);
    expect(buttons[2].getAttribute("aria-expanded")).toBe("false");
  });
});

describe("DetailTabs with scrollOnSelect", () => {
  const tabs = [
    { id: "overview", label: "Overview", content: <p>overview text</p> },
    { id: "rooms", label: "Hotel & Rooms", content: <p>rooms text</p> },
  ];

  it("renders every panel in the markup, shows the one named by the hash, and brings the bar into view on a later hash change", () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    window.history.replaceState(null, "", "/#rooms");
    const { container } = render(<DetailTabs label="Info" tabs={tabs} scrollOnSelect />);
    expect(container.textContent).toContain("overview text");
    expect(container.textContent).toContain("rooms text");
    expect(screen.getByRole("tab", { name: "Hotel & Rooms" }).getAttribute("aria-selected")).toBe("true");
    expect(scroll).not.toHaveBeenCalled(); // the first read of the URL does not scroll

    act(() => {
      window.history.replaceState(null, "", "/#overview");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(screen.getByRole("tab", { name: "Overview" }).getAttribute("aria-selected")).toBe("true");
    expect(scroll).toHaveBeenCalledTimes(1);
  });
});

describe("ExperienceBookingPrice", () => {
  const rooms = experience.rooms.slice(0, 2).map((room, index) => ({ id: room.id, name: room.name, perPerson: { amount: 1000 + index * 500, currency: "USD" }, maxAdults: room.maxAdults, maxOccupancy: room.maxOccupancy }));
  beforeEach(() => {
    search.value = "rooms=2&adults=2";
    stayStore.hydrate("reset", { rooms: 1, adults: 2, children: 0, childAges: [] });
  });

  it("follows the selection: from price per person, then a running subtotal, then the total per traveller with its details", () => {
    render(<ExperienceBookingPrice nights={6} rooms={rooms} />);
    expect(screen.getByText("$1,000")).toBeTruthy();
    expect(screen.getByText("per person")).toBeTruthy();
    expect(screen.getByText("Choose 2 rooms below to see your total.")).toBeTruthy();

    act(() => stayStore.adjustRoom(rooms[0].id, 1));
    expect(screen.getByText("1 of 2 rooms selected")).toBeTruthy();
    expect(screen.getByText("Choose 1 more room below to complete your stay.")).toBeTruthy();

    act(() => stayStore.adjustRoom(rooms[1].id, 1));
    expect(screen.getByText("$2,500")).toBeTruthy(); // one guest in each room: 1 x 1000 + 1 x 1500
    expect(screen.getByText("total for 2 travellers, 6 nights")).toBeTruthy();
    expect(screen.getByText("Price details")).toBeTruthy();
  });
});

describe("HotelReviewsPanel avatars", () => {
  const reviews = { overall: 4.8, count: 2, categories: [{ label: "Overall experience", score: 4.9 }], items: [{ id: "1", author: "Sarah Mills", location: "London, UK", title: "Great", date: "2026-03-15", rating: 5, text: "Loved it." }] };

  it("shows one initial in a square for experiences and two initials in a circle for hotels", async () => {
    const { HotelReviewsPanel } = await import("@/components/sections/hotel/hotel-reviews");
    const { container, rerender } = render(<HotelReviewsPanel slug="x" reviews={reviews} avatar="square" />);
    expect(container.querySelector("li span[aria-hidden]")?.textContent).toBe("S");
    expect(container.querySelector("li span[aria-hidden]")?.className).not.toContain("rounded-full");
    rerender(<HotelReviewsPanel slug="x" reviews={reviews} />);
    expect(container.querySelector("li span[aria-hidden]")?.textContent).toBe("SM");
    expect(container.querySelector("li span[aria-hidden]")?.className).toContain("rounded-full");
  });
});
