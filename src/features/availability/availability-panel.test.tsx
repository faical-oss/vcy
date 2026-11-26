// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getHotelAvailability } = vi.hoisted(() => ({ getHotelAvailability: vi.fn() }));
vi.mock("./get-availability", () => ({
  loadAvailability: async (...args: unknown[]) => {
    try {
      return await getHotelAvailability(...args);
    } catch {
      return null;
    }
  },
}));

import { stayStore } from "@/store/stay-store";
import { AvailabilityPanel, RoomAction, RoomCheckoutAction, RoomLivePrice } from "./availability-panel";

// The URL the components read (the stay store reads `window.location`): setting `search.value` rewrites it.
const { search } = vi.hoisted(() => ({
  search: {
    get value(): string {
      return window.location.search.replace(/^\?/, "");
    },
    set value(next: string) {
      window.history.replaceState(null, "", next ? `/?${next}` : "/");
    },
  },
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/hotels/h/azure", useSearchParams: () => new URLSearchParams(search.value) }));

const FROM = { amount: 385, currency: "USD" };
const dates = { checkIn: "2099-12-01", checkOut: "2099-12-04" };
const available = {
  status: "available",
  nights: 3,
  total: { amount: 1260, currency: "USD" },
  perNight: { amount: 420, currency: "USD" },
  rooms: [{ roomId: "room-1", available: true, total: { amount: 1260, currency: "USD" }, perNight: { amount: 420, currency: "USD" } }],
};

const ROOM_NAMES = { "room-1": "Deluxe Garden Room", "room-2": "Spa Suite" };

afterEach(() => window.localStorage.clear()); // saved room selections must not leak between tests

async function panel(params: Record<string, string>, followSelection = false) {
  search.value = new URLSearchParams(params).toString();
  stayStore.hydrate("reset", { rooms: 1, adults: 2, children: 0, childAges: [] });
  return render(await AvailabilityPanel({ hotelSlug: "hotel-a", searchParams: Promise.resolve(params), fromPrice: FROM, roomNames: ROOM_NAMES, followSelection }));
}

describe("AvailabilityPanel", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("shows the indicative 'from' price and fetches nothing without dates", async () => {
    await panel({});
    expect(screen.getByText("$385")).toBeTruthy();
    expect(screen.getByText("Select your dates to see total prices.")).toBeTruthy();
    expect(screen.queryByText(/Prices vary by room/)).toBeNull();
    expect(getHotelAvailability).not.toHaveBeenCalled();
  });

  it("fetches nothing for invalid dates and says so", async () => {
    await panel({ checkIn: "2000-01-01", checkOut: "2000-01-03" });
    expect(getHotelAvailability).not.toHaveBeenCalled();
    expect(screen.getByText("Check your dates and guests.")).toBeTruthy();
  });

  it("shows only the 'From' price for valid dates, with no total and no dependence on rooms: they are chosen at checkout", async () => {
    getHotelAvailability.mockResolvedValue(available);
    await panel({ ...dates, rooms: "1", adults: "2" });
    expect(getHotelAvailability).toHaveBeenCalledTimes(1); // availability still decides the banners
    expect(screen.getByText("$385")).toBeTruthy();
    expect(screen.getByText("You choose your rooms at checkout, where the total is confirmed.")).toBeTruthy();
    expect(screen.queryByText(/for 3 nights/)).toBeNull();
  });

  it("fetches once and, when it follows the room selection, shows the cheapest room per room (no total) until rooms are selected", async () => {
    getHotelAvailability.mockResolvedValue(available);
    await panel({ ...dates, rooms: "1", adults: "2" }, true);
    expect(getHotelAvailability).toHaveBeenCalledTimes(1);
    expect(getHotelAvailability).toHaveBeenCalledWith("hotel-a", expect.objectContaining({ checkIn: dates.checkIn, nights: 3, adults: 2 }));
    expect(screen.getByText("$1,260")).toBeTruthy();
    expect(screen.getByText("for 3 nights, per room")).toBeTruthy();
    expect(screen.getByText("Choose 1 room below to see your total.")).toBeTruthy();
  });

  it("follows the room selection: a running subtotal, then the total with what it is made of", async () => {
    getHotelAvailability.mockResolvedValue({
      status: "available",
      nights: 2,
      total: { amount: 370, currency: "USD" },
      perNight: { amount: 185, currency: "USD" },
      rooms: [
        { roomId: "room-1", available: true, total: { amount: 370, currency: "USD" }, perNight: { amount: 185, currency: "USD" } },
        { roomId: "room-2", available: true, total: { amount: 380, currency: "USD" }, perNight: { amount: 190, currency: "USD" } },
      ],
    });
    await panel({ ...dates, rooms: "3", adults: "3" }, true);
    expect(screen.getByText("Choose 3 rooms below to see your total.")).toBeTruthy();
    act(() => {
      stayStore.adjustRoom("room-1", 1);
      stayStore.adjustRoom("room-1", 1);
    });
    expect(screen.getByText("2 of 3 rooms selected")).toBeTruthy();
    expect(screen.getAllByText("$740").length).toBeGreaterThan(0); // the subtotal and the line
    expect(screen.getByText("Choose 1 more room below to complete your stay.")).toBeTruthy();
    act(() => stayStore.adjustRoom("room-2", 1));
    expect(screen.getByText("$1,120")).toBeTruthy(); // 2 x 370 + 380
    expect(screen.getByText("total for 2 nights")).toBeTruthy();
    expect(screen.getByText("Price details")).toBeTruthy();
    expect(screen.getByText(/Spa Suite/)).toBeTruthy();
    expect(screen.getByText("$380")).toBeTruthy();
  });

  it("shows a message when there is no availability or the service fails, keeping the 'from' price", async () => {
    getHotelAvailability.mockResolvedValue({ status: "unavailable" });
    await panel(dates);
    expect(screen.getByText("No rooms available")).toBeTruthy();
    expect(screen.getByText(/is fully booked. Try other dates./)).toBeTruthy();
    cleanup();
    getHotelAvailability.mockRejectedValue(new Error("down"));
    await panel(dates);
    expect(screen.getByText("Prices unavailable")).toBeTruthy();
    expect(screen.getByText(/could not load live prices/)).toBeTruthy();
  });
});

describe("per-room availability", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);
  const mixed = {
    status: "available",
    nights: 2,
    total: { amount: 370, currency: "USD" },
    perNight: { amount: 185, currency: "USD" },
    rooms: [
      { roomId: "room-1", available: true, total: { amount: 370, currency: "USD" }, perNight: { amount: 185, currency: "USD" } },
      { roomId: "room-2", available: false, total: { amount: 380, currency: "USD" }, perNight: { amount: 190, currency: "USD" } },
    ],
  };

  it("badges a sold-out room and disables its button, while an available room keeps its price and button", async () => {
    getHotelAvailability.mockResolvedValue(mixed);
    render(await RoomLivePrice({ hotelSlug: "hotel-a", roomId: "room-2", searchParams: Promise.resolve(dates) }));
    expect(screen.getByText("Not available for these dates")).toBeTruthy();
    cleanup();
    render(await RoomAction({ hotelSlug: "hotel-a", roomId: "room-2", roomName: "Spa Suite", searchParams: Promise.resolve(dates) }));
    expect((screen.getByRole("button", { name: /Unavailable/ }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    render(await RoomAction({ hotelSlug: "hotel-a", roomId: "room-1", roomName: "Deluxe", searchParams: Promise.resolve(dates) }));
    expect((screen.getByRole("button", { name: /Select room/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("leaves sold-out rooms out of the booking box price when it follows the selection", async () => {
    getHotelAvailability.mockResolvedValue(mixed);
    await panel({ ...dates, rooms: "1", adults: "2" }, true);
    expect(screen.getByText("$370")).toBeTruthy(); // the cheapest AVAILABLE room
  });
});

describe("RoomCheckoutAction", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("links an available room to checkout, and disables a sold-out room and every room when there is no checkout", async () => {
    getHotelAvailability.mockResolvedValue({ ...available, rooms: [{ roomId: "room-1", available: true, total: { amount: 1, currency: "USD" }, perNight: { amount: 1, currency: "USD" } }, { roomId: "room-2", available: false, total: { amount: 1, currency: "USD" }, perNight: { amount: 1, currency: "USD" } }] });
    render(await RoomCheckoutAction({ hotelSlug: "hotel-a", roomId: "room-1", roomName: "Deluxe", searchParams: Promise.resolve(dates), enabled: true }));
    expect(screen.getByRole("link", { name: /Select room/ }).getAttribute("href")).toContain("roomId=room-1");
    cleanup();
    render(await RoomCheckoutAction({ hotelSlug: "hotel-a", roomId: "room-2", roomName: "Spa Suite", searchParams: Promise.resolve(dates), enabled: true }));
    expect((screen.getByRole("button", { name: /Unavailable/ }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    render(await RoomCheckoutAction({ hotelSlug: "hotel-a", roomId: "room-1", roomName: "Deluxe", searchParams: Promise.resolve({}), enabled: false }));
    expect((screen.getByRole("button", { name: /Select room/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("RoomLivePrice", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("renders nothing without a valid stay (and fetches nothing), and no price line for an available room", async () => {
    const without = await RoomLivePrice({ hotelSlug: "hotel-a", roomId: "room-1", searchParams: Promise.resolve({}) });
    expect(without).toBeNull();
    expect(getHotelAvailability).not.toHaveBeenCalled();
    getHotelAvailability.mockResolvedValue(available);
    expect(await RoomLivePrice({ hotelSlug: "hotel-a", roomId: "room-1", searchParams: Promise.resolve(dates) })).toBeNull(); // no "$1,260 for 3 nights, per room" line
  });
});
