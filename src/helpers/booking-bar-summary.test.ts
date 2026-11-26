import { describe, expect, it } from "vitest";
import type { RoomAvailability } from "@/interfaces";
import { barSummary } from "./booking-bar-summary";

const room = (roomId: string, amount: number, available = true, unit: "night" | "person" = "night"): RoomAvailability => ({ roomId, available, price: { amount, currency: "USD" }, unit });
const stay = { checkIn: "2099-10-14", checkOut: "2099-10-17", rooms: 2, adults: 3, children: 1, selection: {} as Record<string, number> };
const ready = { kind: "reserve" as const, request: {}, note: "", hasDates: true };
const SUITE = { id: "suite", name: "Deluxe Suite", maxAdults: 2, maxOccupancy: 3 };
const GARDEN = { id: "garden", name: "Garden Room", maxAdults: 2, maxOccupancy: 2 };
const base = { today: "2099-01-01", stay, availability: { status: "ready" as const, rooms: [room("suite", 300), room("garden", 200)] }, booking: ready };

describe("barSummary", () => {
  it("is null with no complete dates: no price, no summary", () => {
    expect(barSummary({ ...base, stay: { ...stay, checkOut: null }, booking: { ...ready, hasDates: false } })).toBeNull();
    expect(barSummary({ ...base, stay: { ...stay, checkIn: null, checkOut: null }, booking: { ...ready, hasDates: false } })).toBeNull();
  });

  it("an experience or a package: dates, rooms and travellers as the card says them, the lowest price per person, no rooms line, no total", () => {
    const summary = barSummary({ ...base, availability: { status: "ready", rooms: [room("a", 120, true, "person"), room("b", 90, true, "person")] } })!;
    expect(summary.dates).toBe("14–17 Oct"); // the year only when the stay is not in the current one
    expect(summary.guests).toBe("2 rooms, 4 travellers");
    expect(summary.rooms).toBeNull();
    expect(summary.price).toEqual({ kind: "from", money: { amount: 90, currency: "USD" }, unit: "person" });
  });

  it("a hotel: the rooms line says what to do until rooms are chosen, then the count and the types", () => {
    const hotel = { ...base, selectable: [SUITE, GARDEN], booking: { ...ready, kind: "blocked" as const, note: "Choose 2 rooms to reserve." } };
    expect(barSummary(hotel)!.rooms).toEqual({ summary: "Choose 2 rooms to reserve.", items: [], note: "", short: "Choose 2 rooms to reserve." });
    expect(barSummary(hotel)!.guests).toBe("4 travellers");
    const one = barSummary({ ...hotel, stay: { ...stay, selection: { suite: 1 } }, booking: { ...hotel.booking, note: "Choose 1 more room to reserve." } })!;
    expect(one.rooms).toEqual({ summary: "1 of 2 rooms selected", items: ["1 × Deluxe Suite"], note: "Choose 1 more room to reserve.", short: "1 of 2 rooms selected" });
    expect(one.price).toEqual({ kind: "from", money: { amount: 200, currency: "USD" }, unit: "night" });
  });

  it("a hotel with its rooms chosen: the total for the stay, as the card's 'Total for 3 nights'", () => {
    const summary = barSummary({ ...base, selectable: [SUITE, GARDEN], stay: { ...stay, selection: { suite: 1, garden: 1 } } })!;
    expect(summary.rooms).toEqual({ summary: "2 of 2 rooms selected", items: ["1 × Deluxe Suite", "1 × Garden Room"], note: "", short: "2 of 2 rooms selected" });
    expect(summary.price).toEqual({ kind: "total", money: { amount: (300 + 200) * 3, currency: "USD" }, nights: 3 });
  });

  it("loading, nothing available and an error are said without a price", () => {
    expect(barSummary({ ...base, booking: { ...ready, kind: "busy" } })!.price).toEqual({ kind: "loading" });
    expect(barSummary({ ...base, availability: { status: "none", rooms: [] }, booking: { ...ready, kind: "blocked" } })!.price).toEqual({ kind: "problem", text: "Not available for your dates" });
    expect(barSummary({ ...base, availability: { status: "error", rooms: [] }, booking: { ...ready, kind: "blocked" } })!.price).toEqual({ kind: "problem", text: "Prices unavailable" });
  });

  it("a search that is not valid yet shows what to do instead of a price", () => {
    const summary = barSummary({ ...base, availability: { status: "idle", rooms: [] }, booking: { kind: "prompt", request: null, note: "Select the age of each child.", hasDates: true } })!;
    expect(summary.price).toEqual({ kind: "note", text: "Select the age of each child." });
  });
});
