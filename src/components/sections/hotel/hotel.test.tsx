// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { HotelDetail } from "@/interfaces";
import { DateRangePicker } from "./date-range-picker";
import { HotelHeader } from "./hotel-header";
import { HotelLocation } from "./hotel-location";
import { HotelOverview } from "./hotel-overview";
import { HotelReviewsPanel } from "./hotel-reviews";
import { HotelRooms } from "./hotel-rooms";
import { ReserveCta } from "./reserve-cta";
import { ReserveGate } from "./reserve-gate";
import { RoomDetailsDialog } from "./room-details-dialog";
import { RoomCheckoutLink } from "./room-checkout-link";
import { RoomPicker } from "./room-picker";
import { RoomsSummaryBar } from "./rooms-summary-bar";
import { stayStore } from "@/store/stay-store";

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
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push }), usePathname: () => "/hotels/h/azure", useSearchParams: () => new URLSearchParams(search.value) }));
vi.mock("@/components/auth/auth-provider", () => ({ useAuth: () => ({ session: null, openAuth: vi.fn() }) }));

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  window.localStorage.clear(); // saved room selections must not leak between tests
});

const photo = (index: number) => ({ src: `/images/p${index}.jpg`, alt: `Azure Spa, Krabi: photo ${index}` });
const hotel: HotelDetail = {
  id: "azure",
  slug: "azure-spa-and-wellness-resort-krabi",
  name: "Azure Spa & Wellness Resort",
  stars: 5,
  badge: "Wellness Resort",
  highlights: ["Top rated"],
  type: { slug: "wellness-resorts", label: "Wellness Resorts" },
  location: { label: "Krabi, Thailand", city: "Krabi", country: "Thailand", coordinates: { lat: 8.0863, lng: 98.9063 } },
  images: [1, 2, 3, 4, 5].map(photo),
  description: ["A spa resort on the Andaman coast.", "Rooms are set in tropical gardens."],
  amenities: Array.from({ length: 9 }, (_, index) => ({ icon: "pool" as const, label: `Amenity ${index + 1}` })),
  goodToKnow: [{ label: "Check-in", value: "3:00 PM" }, { label: "Check-out", value: "12:00 PM" }],
  roomsInclude: ["Daily breakfast", "Wi-Fi throughout"],
  cancellationNote: "Cancellation terms are shown before you book.",
  priceFrom: { amount: 385, currency: "USD" },
  rooms: [1, 2, 3].map((tier) => ({
    id: `room-${tier}`,
    name: `Room ${tier}`,
    sizeSqm: 30 + tier * 10,
    bed: "King bed",
    board: "Breakfast included",
    features: ["A", "B", "C", "D"],
    description: `About room ${tier}.`,
    amenityGroups: [{ label: "Bathroom", items: ["Rainfall shower", "Hairdryer"] }],
    maxAdults: tier === 3 ? 3 : 2,
    maxOccupancy: tier === 3 ? 4 : 3,
    images: [photo(tier)],
    priceFrom: { amount: 385 * tier, currency: "USD" },
  })),
  transport: [
    { label: "Nearest airport", value: "Krabi International Airport · 32 km" },
    { label: "Krabi Town", value: "14 km" },
    { label: "Nearest beach", value: "Ao Nang Beach · 9 km" },
    { label: "Transfer time", value: "~40 min from airport" },
  ],
  attractions: ["Railay Beach", "Tiger Cave Temple", "Emerald Pool", "Krabi Town Night Market", "Hong Islands", "Wat Kaew Korawaram"].map((label, index) => ({ label, value: `${index + 4} km` })),
  reviews: {
    overall: 4.8,
    count: 312,
    categories: ["Location", "Room quality", "Service", "Food & dining", "Spa & wellness", "Value for money"].map((label) => ({ label, score: 4.6 })),
    items: [{ id: "r1", author: "Sarah M.", location: "London, UK", title: "A calm and well run stay", date: "2026-03-04", rating: 5, text: "The spa was the highlight of our stay in Krabi." }],
  },
};
const FUTURE_START = "2099-12-01";
const FUTURE_END = "2099-12-04";

describe("HotelHeader", () => {
  it("renders exactly one h1 with the hotel name, the location and the rating", () => {
    render(<HotelHeader hotel={hotel} breadcrumb={<nav aria-label="Breadcrumb" />} actions={<div />} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(hotel.name);
    expect(screen.getByText(hotel.location.label)).toBeTruthy();
    expect(screen.getByText(`(${hotel.reviews.count} reviews)`)).toBeTruthy();
  });

  it("shows the type badge and the filled 'Top rated' chip, and five rating stars", () => {
    render(<HotelHeader hotel={hotel} breadcrumb={<nav aria-label="Breadcrumb" />} actions={<div />} />);
    expect(screen.getByText("Wellness Resort")).toBeTruthy();
    expect(screen.getByText("Top rated").className).toContain("bg-primary");
    expect(screen.getByText("Top rated").className).toContain("border");
    const rating = screen.getByRole("img", { name: "4.8 out of 5" });
    expect(rating.querySelectorAll("svg")).toHaveLength(5);
    expect(rating.querySelectorAll("svg.fill-star")).toHaveLength(5);
  });
});

describe("tab panels", () => {
  it("shows About, nine amenities and Good to know in the overview", () => {
    render(<HotelOverview hotel={hotel} />);
    expect(screen.getByRole("heading", { name: "About the hotel" })).toBeTruthy();
    expect(within(screen.getByRole("heading", { name: "Amenities" }).closest("section") as HTMLElement).getAllByRole("listitem")).toHaveLength(9);
    expect(screen.getByText("Check-in")).toBeTruthy();
  });

  it("lists the rooms with a select button and says to select dates", () => {
    render(<HotelRooms rooms={hotel.rooms} hotelName={hotel.name} cancellationNote="Free cancellation" summary={<RoomsSummaryBar rooms={hotel.rooms.map(({ id, name, maxAdults, maxOccupancy, priceFrom }) => ({ id, name, maxAdults, maxOccupancy, priceFrom }))} hotelSlug={hotel.slug} continueHref={null} />} action={(room) => <RoomPicker roomId={room.id} roomName={room.name} />} livePrice={() => <span>live</span>} />);
    expect(screen.getByText("All rooms include daily breakfast. Select dates to see total prices.")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Your rooms" })).toBeTruthy(); // the sticky "N of M rooms selected" bar
    expect(screen.getAllByText("Per night from")).toHaveLength(3);
    expect(screen.getAllByText("Size:")).toHaveLength(3);
    expect(screen.getAllByText("Bed:")).toHaveLength(3);
    expect(screen.getAllByText("Board:")).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: /Select room/ })).toHaveLength(3);
    expect(screen.getAllByText("$385")).toHaveLength(1);
    expect(screen.getAllByText("Per night from")).toHaveLength(3);
    expect(screen.getAllByText("live")).toHaveLength(3);
  });

  it("shows the map card, four facts, six attractions with pins and an Open in Maps link that opens in a new tab", () => {
    render(<HotelLocation hotel={hotel} />);
    expect(screen.getAllByText("Krabi, Thailand").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Azure Spa & Wellness Resort")).toBeTruthy();
    for (const label of ["Nearest airport", "Krabi Town", "Nearest beach", "Transfer time"]) expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Nearby attractions" })).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.getByText("Railay Beach · 4 km")).toBeTruthy();
    const map = screen.getByRole("link", { name: /Open in Maps/ });
    expect(map.getAttribute("target")).toBe("_blank");
    expect(map.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("shows the overall score, six category bars and the reviews; the form only when given", () => {
    const { rerender } = render(<HotelReviewsPanel slug="x" reviews={hotel.reviews} />);
    expect(screen.getAllByRole("img", { name: /out of 5/ }).length).toBeGreaterThanOrEqual(6);
    for (const label of ["Location", "Room quality", "Service", "Food & dining", "Spa & wellness", "Value for money"]) expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText("4.8")).toBeTruthy();
    expect(screen.getByText(hotel.reviews.items[0].text)).toBeTruthy();
    expect(screen.getByText("A calm and well run stay")).toBeTruthy();
    expect(screen.getByText("London, UK")).toBeTruthy();
    expect(screen.getByText("March 2026")).toBeTruthy();
    const avatar = screen.getByText("SM");
    expect(avatar.className).toContain("rounded-full");
    expect(avatar.textContent).toHaveLength(2);
    expect(screen.queryByText("Travelled on this trip?")).toBeNull();
    rerender(<HotelReviewsPanel slug="x" reviews={hotel.reviews} form={<p>Travelled on this trip?</p>} />);
    expect(screen.getByText("Travelled on this trip?")).toBeTruthy();
  });
});

describe("DateRangePicker", () => {
  it("picks a start, then a later end, shows two months and disables past days", () => {
    const onChange = vi.fn();
    const { rerender } = render(<DateRangePicker value={{ start: null, end: null }} onChange={onChange} minDate="2099-12-10" />);
    expect(screen.getAllByText(/December 2099|January 2100/)).toHaveLength(2);
    expect((screen.getByRole("button", { name: /Wednesday, December 9, 2099/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Thursday, December 10, 2099/ }));
    expect(onChange).toHaveBeenLastCalledWith({ start: "2099-12-10", end: null });
    rerender(<DateRangePicker value={{ start: "2099-12-10", end: null }} onChange={onChange} minDate="2099-12-10" />);
    fireEvent.click(screen.getByRole("button", { name: /Sunday, December 13, 2099/ }));
    expect(onChange).toHaveBeenLastCalledWith({ start: "2099-12-10", end: "2099-12-13" });
  });
});

describe("DateRangePicker: every date after the start can be picked", () => {
  it("keeps all days enabled once a start is chosen (a product's minimum and maximum nights are checked on the range, not by disabling days)", () => {
    render(<DateRangePicker value={{ start: "2099-12-10", end: null }} onChange={vi.fn()} minDate="2099-12-01" />);
    for (const label of [/Friday, December 11, 2099/, /Sunday, December 13, 2099/, /Wednesday, December 16, 2099/, /Wednesday, December 9, 2099/]) expect((screen.getByRole("button", { name: label }) as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("ReserveCta", () => {
  it("is a disabled button with the reason when there is no link, and a link when there is one", () => {
    const { rerender } = render(<ReserveCta note="Online booking opens soon." />);
    expect((screen.getByRole("button", { name: /Reserve now/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("To lock in this price!")).toBeTruthy();
    expect(screen.getByText("Online booking opens soon.").className).toContain("sr-only");
    rerender(<ReserveCta href="/checkout?hotel=a" />);
    expect(screen.getByRole("link", { name: /Reserve now/ }).getAttribute("href")).toBe("/checkout?hotel=a");
    expect(screen.queryByRole("button", { name: /Reserve now/ })).toBeNull();
  });
});

describe("room selection", () => {
  const rooms = hotel.rooms.map(({ id, name, maxAdults, maxOccupancy, priceFrom }) => ({ id, name, maxAdults, maxOccupancy, priceFrom }));
  beforeEach(() => {
    vi.clearAllMocks();
    search.value = "";
    stayStore.hydrate("reset", { rooms: 1, adults: 2, children: 0, childAges: [] });
  });
  const picker = (index: number) => <RoomPicker roomId={hotel.rooms[index].id} roomName={hotel.rooms[index].name} />;

  it("turns 'Select room' into a stepper and disables every '+' once the searched rooms are reached", () => {
    search.value = "rooms=2&adults=2";
    render(
      <>
        {picker(0)}
        {picker(1)}
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Select room\s*Room 1/ }));
    expect(screen.getByRole("group", { name: "Room 1: rooms selected" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Add one Room 1" }));
    expect(screen.getByText("2")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Add one Room 1" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: /Select room\s*Room 2/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Remove one Room 1" }));
    expect((screen.getByRole("button", { name: /Select room\s*Room 2/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("swaps the choice when one room is searched", () => {
    render(
      <>
        {picker(0)}
        {picker(1)}
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Select room\s*Room 1/ }));
    fireEvent.click(screen.getByRole("button", { name: /Select room\s*Room 2/ }));
    expect(screen.queryByRole("group", { name: "Room 1: rooms selected" })).toBeNull();
    expect(screen.getByRole("group", { name: "Room 2: rooms selected" })).toBeTruthy();
  });

  it("shows 'N of M rooms selected', a hint without dates, and keeps Continue disabled until N = M", () => {
    search.value = "rooms=2&adults=2";
    render(
      <>
        {picker(0)}
        <RoomsSummaryBar rooms={rooms} hotelSlug={hotel.slug} continueHref="/checkout" />
      </>,
    );
    expect(screen.getByText("0 of 2 rooms selected")).toBeTruthy();
    expect(screen.getByText("Select your dates to see total prices.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Select room/ }));
    expect(screen.getByText("1 of 2 rooms selected")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the total for the stay and enables Continue when the rooms fit everybody", () => {
    search.value = `checkIn=${FUTURE_START}&checkOut=${FUTURE_END}&rooms=1&adults=2&children=1&childAges=4`;
    render(
      <>
        {picker(0)}
        <RoomsSummaryBar rooms={rooms} hotelSlug={hotel.slug} continueHref="/checkout" />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Select room/ }));
    expect(screen.getAllByText("$1,155").length).toBeGreaterThan(0); // 3 nights x $385: the total and its line
    const link = screen.getByRole("link", { name: "Continue" });
    expect(link.getAttribute("href")).toContain("selection=");
  });

  it("uses the live one-room prices for the total and lists what it is made of", () => {
    search.value = `checkIn=${FUTURE_START}&checkOut=${FUTURE_END}&rooms=2&adults=2`;
    const live = { [hotel.rooms[0].id]: { amount: 1000, currency: "USD" }, [hotel.rooms[1].id]: { amount: 1500, currency: "USD" } };
    render(
      <>
        {picker(0)}
        {picker(1)}
        <RoomsSummaryBar rooms={rooms} hotelSlug={hotel.slug} continueHref="/checkout" livePrices={live} />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Select room\s*Room 1/ }));
    fireEvent.click(screen.getByRole("button", { name: /Select room\s*Room 2/ }));
    expect(screen.getByText("$2,500")).toBeTruthy();
    const details = screen.getByText("Price details").closest("details") as HTMLElement;
    expect(within(details).getByText(/Room 1/)).toBeTruthy();
    expect(within(details).getByText("$1,500")).toBeTruthy();
  });

  it("hides the price details for one room, shows them for several, and says why Continue is off without a checkout", () => {
    search.value = `checkIn=${FUTURE_START}&checkOut=${FUTURE_END}&rooms=2&adults=2`;
    render(
      <>
        {picker(0)}
        {picker(1)}
        <RoomsSummaryBar rooms={rooms} hotelSlug={hotel.slug} continueHref={null} />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Select room\s*Room 1/ }));
    expect(screen.queryByText("Price details")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Select room\s*Room 2/ }));
    expect(screen.getByText("Price details")).toBeTruthy();
    expect(screen.getByText(/Online booking opens soon/)).toBeTruthy();
  });

  it("drops a selected room when it turns out to be sold out for the dates", () => {
    const { rerender } = render(<RoomPicker roomId="room-1" roomName="Room 1" />);
    fireEvent.click(screen.getByRole("button", { name: /Select room/ }));
    expect(stayStore.getSnapshot().selection).toEqual({ "room-1": 1 });
    rerender(<RoomPicker roomId="room-1" roomName="Room 1" unavailable />);
    expect(stayStore.getSnapshot().selection).toEqual({});
  });

  it("shows an unavailable room as a disabled 'Unavailable' button", () => {
    render(<RoomPicker roomId="room-1" roomName="Room 1" unavailable />);
    expect((screen.getByRole("button", { name: /Unavailable/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("explains when the selected rooms cannot hold the guests, and keeps Continue disabled", () => {
    search.value = `checkIn=${FUTURE_START}&checkOut=${FUTURE_END}&rooms=1&adults=2&children=2&childAges=4,5`;
    render(
      <>
        {picker(0)}
        <RoomsSummaryBar rooms={rooms} hotelSlug={hotel.slug} continueHref="/checkout" />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Select room/ }));
    expect(screen.getByRole("alert").textContent).toContain("hold 3 guests");
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("RESERVE NOW follows the room selection", () => {
  const limits = hotel.rooms.map(({ id, maxAdults, maxOccupancy }) => ({ id, maxAdults, maxOccupancy }));
  beforeEach(() => {
    search.value = "rooms=2&adults=2";
    stayStore.hydrate("reset", { rooms: 1, adults: 2, children: 0, childAges: [] });
  });

  it("stays off, saying what is missing, until the rooms add up to the rooms searched", () => {
    render(<ReserveGate href="/checkout?x=1" rooms={limits} />);
    expect((screen.getByRole("button", { name: /Reserve now/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Choose 2 rooms first")).toBeTruthy();
    act(() => stayStore.adjustRoom(hotel.rooms[0].id, 1));
    expect(screen.getByText("Choose 1 room first")).toBeTruthy();
    act(() => stayStore.adjustRoom(hotel.rooms[1].id, 1));
    expect(screen.getByRole("link", { name: /Reserve now/ }).getAttribute("href")).toMatch(/^\/checkout\?x=1&selection=/); // the chosen rooms travel with the link
  });

  it("stays off when the chosen rooms cannot hold the guests, and keeps the server's reason when there is no link", () => {
    search.value = "rooms=1&adults=2&children=2&childAges=4,5";
    render(<ReserveGate href="/checkout?x=1" rooms={limits} />);
    act(() => stayStore.adjustRoom(hotel.rooms[0].id, 1)); // holds 3 of 4 guests
    expect(screen.getByText("Rooms too small for your group")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Reserve now/ })).toBeNull();
    cleanup();
    stayStore.hydrate("reset", { rooms: 1, adults: 2, children: 0, childAges: [] });
    search.value = "rooms=1&adults=2";
    render(<ReserveGate note="Online booking opens soon." rooms={limits} />);
    act(() => stayStore.adjustRoom(hotel.rooms[0].id, 1));
    expect(screen.getByText("Online booking opens soon.")).toBeTruthy();
  });
});

describe("RoomDetailsDialog", () => {
  const room = { ...hotel.rooms[0], images: [photo(1), photo(2)] };
  const open = () => {
    render(<RoomDetailsDialog room={room} cancellationNote="Free cancellation" action={<button type="button">Select room</button>} />);
    const trigger = screen.getByRole("button", { name: /Room 1/ });
    fireEvent.click(trigger);
    return trigger; // the page behind the dialog is hidden from queries while it is open
  };

  it("opens from the room name with photos, facts, tabs and a footer with the price and the select control", () => {
    open();
    const dialog = screen.getByRole("dialog", { name: "Room 1" });
    expect(within(dialog).getByText("Per night from")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Select room" })).toBeTruthy();
    expect(within(dialog).getByText("About room 1.")).toBeTruthy();
    expect(within(dialog).getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Overview", "Amenities", "Good to know"]);
    expect(within(dialog).getByRole("button", { name: "Next photo" })).toBeTruthy();
  });

  it("switches tabs with a click and the arrow keys, and shows amenities and facts", () => {
    open();
    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[1]);
    expect(screen.getByText("Rainfall shower")).toBeTruthy();
    fireEvent.keyDown(tabs[1], { key: "ArrowRight" });
    expect(screen.getAllByRole("tab")[2].getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Free cancellation")).toBeTruthy();
    expect(screen.getAllByText(/Up to 3 guests/).length).toBeGreaterThan(0);
  });

  it("closes with Escape and gives focus back to the room name", async () => {
    const trigger = open();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});

describe("RoomCheckoutLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search.value = "";
  });

  it("links to checkout with the room preselected and the stay of the page URL", () => {
    search.value = `checkIn=${FUTURE_START}&checkOut=${FUTURE_END}&rooms=1&adults=2&children=1&childAges=4&other=x`;
    render(<RoomCheckoutLink roomId="room-2" roomName="Spa Suite" kind="hotel" id="azure" enabled />);
    const href = screen.getByRole("link", { name: /Select room\s*Spa Suite/ }).getAttribute("href") as string;
    expect(Object.fromEntries(new URLSearchParams(href.split("?")[1]))).toEqual({ type: "hotel", id: "azure", checkIn: FUTURE_START, checkOut: FUTURE_END, rooms: "1", adults: "2", children: "1", childAges: "4", roomId: "room-2" });
  });

  it("works without any stay (it is never required), and is a disabled button without a checkout or for a sold-out room", () => {
    const { rerender } = render(<RoomCheckoutLink roomId="room-2" roomName="Spa Suite" kind="experience" id="ubud" enabled />);
    expect(screen.getByRole("link", { name: /Select room/ }).getAttribute("href")).toBe("/checkout?type=experience&id=ubud&roomId=room-2");
    rerender(<RoomCheckoutLink roomId="room-2" roomName="Spa Suite" kind="experience" id="ubud" enabled={false} />);
    expect((screen.getByRole("button", { name: /Select room/ }) as HTMLButtonElement).disabled).toBe(true);
    rerender(<RoomCheckoutLink roomId="room-2" roomName="Spa Suite" kind="experience" id="ubud" enabled unavailable />);
    expect((screen.getByRole("button", { name: /Unavailable/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("informational rooms without a shortcut", () => {
  it("shows no select button on the cards or in the details dialog when no action is given", () => {
    render(<HotelRooms rooms={hotel.rooms} hotelName={hotel.name} cancellationNote="Free cancellation" livePrice={() => null} />);
    expect(screen.queryByRole("button", { name: /Select room/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Select room/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Room 1/ }));
    expect(within(screen.getByRole("dialog")).queryByText(/Select room/)).toBeNull();
    expect(within(screen.getByRole("dialog")).getByText("Per night from")).toBeTruthy(); // the price stays
  });
});

describe("inline room price (experiences)", () => {
  it("shows only 'From $X per person' on each card: no live price line and no select button", () => {
    render(<HotelRooms rooms={hotel.rooms} hotelName={hotel.name} cancellationNote="Free cancellation" priceCaption="From" priceSuffix="per person" priceLayout="inline" />);
    expect(screen.getAllByText("From")).toHaveLength(3);
    expect(screen.getAllByText("per person")).toHaveLength(3);
    expect(screen.getByText("$385")).toBeTruthy();
    expect(screen.queryByText(/for your dates|Not available/)).toBeNull();
    expect(screen.queryByRole("button", { name: /Select room/ })).toBeNull();
  });
});
