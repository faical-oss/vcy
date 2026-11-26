// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HotelRoom, RoomAvailability, RoomAvailabilityRequest } from "@/interfaces";
import { availabilityStore } from "@/store/availability-store";
import { stayStore } from "@/store/stay-store";
import { BookingAvailabilityPrice } from "./availability-price";
import { RoomsPanel } from "./rooms-panel";

vi.mock("next/navigation", () => ({ usePathname: () => "/hotels/h/azure" }));

const photo = (n: number) => ({ src: `/p${n}.jpg`, alt: `Photo ${n}`, width: 800, height: 600 });
const rooms: HotelRoom[] = [1, 2].map((n) => ({
  id: `room-${n}`, name: `Room ${n}`, sizeSqm: 30, bed: "King bed", board: "Breakfast", features: ["A", "B", "C", "D"], description: "About.",
  amenityGroups: [{ label: "Bathroom", items: ["Shower"] }], maxAdults: 2, maxOccupancy: 3, images: [photo(n)],
}));
const req: RoomAvailabilityRequest = { kind: "hotel", id: "azure", checkIn: "2099-12-01", checkOut: "2099-12-04", adults: 2, children: 0, childAges: [], rooms: 1 };
const answer = (id: string, available: boolean, amount: number): RoomAvailability => ({ roomId: id, available, price: { amount, currency: "USD" }, unit: "night" });

let resolve: (value: { rooms: RoomAvailability[] }) => void = () => {};
let reject: (error: Error) => void = () => {};
const fetcher = vi.fn(() => new Promise<{ rooms: RoomAvailability[] }>((res, rej) => { resolve = res; reject = rej; }));

beforeEach(() => {
  availabilityStore.reset();
  fetcher.mockClear();
  availabilityStore.configure({ fetcher, debounceMs: 0, minLoadingMs: 0 });
});
afterEach(cleanup);

const panel = (unit: "night" | "person" = "night") => <RoomsPanel rooms={rooms} hotelName="Azure" cancellationNote="Terms." unit={unit} />;
const load = async () => { act(() => availabilityStore.request(req, { immediate: true })); };
const answerWith = async (value: RoomAvailability[]) => { await act(async () => { resolve({ rooms: value }); await Promise.resolve(); }); await act(async () => {}); };

describe("RoomsPanel", () => {
  it("without dates shows the rooms for reference with the notes, no prices, no steppers and no select buttons", () => {
    render(panel("person"));
    expect(screen.getByText(/Rooms depend on your dates\. The room types below are shown for reference\. Availability and prices are confirmed after you select Check availability\./)).toBeTruthy();
    expect(screen.getByText("All prices are per person, based on shared occupancy.")).toBeTruthy();
    expect(screen.getAllByText("Room 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Select your dates to see prices").length).toBe(2);
    expect(screen.queryByText(/\$\d/)).toBeNull();
    expect(screen.queryByRole("spinbutton")).toBeNull();
    expect(screen.queryByRole("button", { name: /select|choose|add|increase|decrease/i })).toBeNull();
  });

  it("while loading shows skeleton rows, marks the region busy and hides the room names", async () => {
    const { container } = render(panel());
    await load();
    expect(screen.getByLabelText("Loading rooms").children.length).toBe(2);
    expect(container.querySelector("[aria-busy='true']")).toBeTruthy();
    expect(screen.queryByText("Room 1")).toBeNull();
  });

  it("loaded shows exact per-night prices and marks sold-out rooms, then announces 'Rooms updated'", async () => {
    render(panel());
    await load();
    await answerWith([answer("room-1", true, 412), answer("room-2", false, 0)]);
    expect(screen.getByText("$412")).toBeTruthy();
    expect(screen.getByText("From")).toBeTruthy();
    expect(screen.getByText("per night")).toBeTruthy();
    expect(screen.getAllByText("Sold out").length).toBeGreaterThan(1); // the pill in the price column and the label on the photo
    expect(screen.getByText("for your dates")).toBeTruthy(); // for screen readers
    expect(screen.getAllByRole("status").some((region) => region.textContent === "Rooms updated")).toBe(true); // hotels: no search line
    expect(document.body.textContent).not.toMatch(/Prices for /);
    expect(screen.getByText("All prices are per room, per night.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /select|choose|add/i })).toBeNull();
  });

  it("per person for an experience", async () => {
    render(panel("person"));
    await load();
    await answerWith([answer("room-1", true, 820), answer("room-2", true, 900)]);
    expect(screen.getAllByText("per person").length).toBe(2);
  });

  it("none available shows a message with Retry that asks again", async () => {
    render(panel());
    await load();
    await answerWith([answer("room-1", false, 0), answer("room-2", false, 0)]);
    expect(screen.getByRole("alert").textContent).toContain("No rooms are available for your dates");
    act(() => screen.getByRole("button", { name: "Retry" }).click());
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("an error shows a message with Retry", async () => {
    render(panel());
    await load();
    await act(async () => { reject(new Error("boom")); await Promise.resolve(); });
    await act(async () => {});
    expect(screen.getByRole("alert").textContent).toContain("We could not load the rooms for your dates");
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });

  it("the server HTML is the no-dates state whatever the store holds, and nothing is fetched", async () => {
    const before = renderToString(panel());
    availabilityStore.request(req, { immediate: true });
    const during = renderToString(panel());
    expect(during).toBe(before);
    expect(before).toContain("Select your dates to see prices");
    expect(before).not.toMatch(/\$\d/);
    expect(renderToString(<BookingAvailabilityPrice />)).toContain("Select your dates to see prices");
  });
});

describe("BookingAvailabilityPrice", () => {
  it("idle prompt, loading skeleton, the lowest available price, and banners for none and error", async () => {
    render(<BookingAvailabilityPrice />);
    expect(screen.getByText("Select your dates to see prices")).toBeTruthy();
    await load();
    expect(screen.getByLabelText("Loading prices")).toBeTruthy();
    await answerWith([answer("room-1", true, 500), answer("room-2", true, 420)]);
    expect(screen.getByText("$420")).toBeTruthy();
    expect(screen.getByText("per night")).toBeTruthy();
  });

  it("none available says so", async () => {
    render(<BookingAvailabilityPrice />);
    await load();
    await answerWith([answer("room-1", false, 0)]);
    expect(screen.getByText("No rooms available")).toBeTruthy();
  });
});

describe("RoomsPanel: choosing rooms on a hotel page", () => {
  beforeEach(() => {
    stayStore.hydrate("reset", { rooms: 1, adults: 2, children: 0, childAges: [] });
    stayStore.hydrate("/hotels/h/azure", { rooms: 1, adults: 2, children: 0, childAges: [] });
  });
  const hotelPanel = <RoomsPanel rooms={rooms} hotelName="Azure" cancellationNote="Terms." unit="night" selectable />;

  it("shows a Select room button on each priced room only (none before the prices, none on sold-out rooms)", async () => {
    render(hotelPanel);
    expect(screen.queryByRole("button", { name: /Select room/ })).toBeNull();
    await load();
    await answerWith([answer("room-1", true, 412), answer("room-2", false, 0)]);
    expect(screen.getAllByRole("button", { name: /Select room\s*Room 1/ }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Select room\s*Room 2/ })).toBeNull();
  });

  it("leaves the rooms display-only when the page does not choose rooms (experiences)", async () => {
    render(<RoomsPanel rooms={rooms} hotelName="Azure" cancellationNote="Terms." unit="person" />);
    await load();
    await answerWith([answer("room-1", true, 412), answer("room-2", true, 500)]);
    expect(screen.queryByRole("button", { name: /Select room/ })).toBeNull();
  });

  it("selecting puts the room in the stay's selection, and a room that turns sold out is dropped", async () => {
    render(hotelPanel);
    await load();
    await answerWith([answer("room-1", true, 412), answer("room-2", true, 500)]);
    fireEvent.click(screen.getAllByRole("button", { name: /Select room\s*Room 1/ })[0]);
    expect(stayStore.getSnapshot().selection).toEqual({ "room-1": 1 });
    // a new search where room-1 is sold out
    act(() => availabilityStore.request({ ...req, checkOut: "2099-12-05" }, { immediate: true }));
    await answerWith([answer("room-1", false, 0), answer("room-2", true, 500)]);
    expect(stayStore.getSnapshot().selection).toEqual({});
  });
});

describe("BookingAvailabilityPrice: rooms chosen (hotels) and the checkout note (experiences)", () => {
  const selectable = [
    { id: "room-1", name: "Room 1", maxAdults: 2, maxOccupancy: 3 },
    { id: "room-2", name: "Room 2", maxAdults: 2, maxOccupancy: 3 },
  ];
  beforeEach(() => {
    stayStore.hydrate("reset", { rooms: 2, adults: 2, children: 0, childAges: [] });
    stayStore.hydrate("/hotels/h/azure", { rooms: 2, adults: 2, children: 0, childAges: [] });
    stayStore.setDates("2099-12-01", "2099-12-04");
  });

  it("hotels: no checkout note; points to the Rooms tab, then lists the chosen rooms and the total once complete", async () => {
    render(<BookingAvailabilityPrice selectable={selectable} />);
    await load();
    await answerWith([answer("room-1", true, 400), answer("room-2", true, 500)]);
    expect(screen.queryByText(/Rooms are confirmed at checkout/)).toBeNull();
    expect(screen.getByText("Select your rooms in the Rooms tab.")).toBeTruthy();
    act(() => stayStore.adjustRoom("room-1", 1));
    expect(screen.getByText("1 of 2 rooms selected")).toBeTruthy();
    expect(screen.getByText("1 × Room 1")).toBeTruthy();
    expect(screen.queryByText(/Total for/)).toBeNull();
    act(() => stayStore.adjustRoom("room-2", 1));
    expect(screen.getByText("2 of 2 rooms selected")).toBeTruthy();
    expect(screen.getByText("Total for 3 nights")).toBeTruthy();
    expect(screen.getByText("$2,700")).toBeTruthy(); // (400 + 500) x 3 nights
  });

  it("experiences: shows which search the prices are for, hides it while loading, and follows a new search", async () => {
    const trip: RoomAvailabilityRequest = { ...req, kind: "experience", id: "ubud", adults: 2, children: 1, childAges: [5] };
    render(<BookingAvailabilityPrice />);
    act(() => availabilityStore.request(trip, { immediate: true }));
    expect(document.body.textContent).not.toMatch(/Prices for /); // loading: the skeleton, no line
    await answerWith([answer("room-1", true, 400)]);
    expect(document.body.textContent).not.toContain("Rooms are confirmed at checkout");
    expect(document.body.textContent).toMatch(/Prices for .* · 3 travellers, per person\. You'll choose your room at checkout\./);
    act(() => availabilityStore.request({ ...trip, adults: 4, children: 0, childAges: [] }, { immediate: true }));
    expect(document.body.textContent).not.toMatch(/Prices for /);
    await answerWith([answer("room-1", true, 400)]);
    expect(document.body.textContent).toMatch(/Prices for .* · 4 travellers, per person\./);
  });

  it("hotels: no search line at all", async () => {
    render(<BookingAvailabilityPrice selectable={selectable} />);
    await load();
    await answerWith([answer("room-1", true, 400)]);
    expect(document.body.textContent).not.toMatch(/Prices for /);
  });
});


describe("RoomsPanel: a package of several properties", () => {
  const stays = [
    { id: "stay-1", heading: "First Lodge", hotelName: "First Lodge", rooms: [rooms[0]] },
    { id: "stay-2", heading: "Second Lodge", hotelName: "Second Lodge", rooms: [rooms[1]] },
  ];
  const several = () => <RoomsPanel rooms={rooms} hotelName="First Lodge" cancellationNote="Terms." unit="person" stays={stays} />;

  it("groups the rooms under one heading per property, with the same notes and 'Select your dates to see prices' as every page", () => {
    render(several());
    expect(screen.getByRole("heading", { level: 3, name: "First Lodge" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "Second Lodge" })).toBeTruthy();
    expect(screen.getByText("All prices are per person, based on shared occupancy.")).toBeTruthy();
    expect(screen.getAllByText("Select your dates to see prices").length).toBe(2);
    expect(screen.queryByText(/Included in the package|included in the package/)).toBeNull();
    expect(screen.queryByRole("button", { name: /select|choose|add|increase|decrease/i })).toBeNull();
  });

  it("with an answer shows 'From $X per person' for available rooms and marks sold-out ones", async () => {
    render(several());
    await load();
    await answerWith([answer("room-1", true, 412), answer("room-2", false, 0)]);
    expect(screen.getAllByText("$412").length).toBeGreaterThan(0);
    expect(screen.getAllByText("From").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Included in the package/)).toBeNull();
    expect(screen.getAllByText("Sold out").length).toBeGreaterThan(0);
  });

  it("keeps the single-property list when no stays are given", async () => {
    render(<RoomsPanel rooms={rooms} hotelName="Azure" cancellationNote="Terms." unit="person" />);
    await load();
    await answerWith([answer("room-1", true, 412), answer("room-2", true, 500)]);
    expect(screen.getByText("$412")).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 3, name: /Lodge/ })).toBeNull();
  });
});
