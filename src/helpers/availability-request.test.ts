import { describe, expect, it } from "vitest";
import { toRoomRequest } from "./availability-request";
import type { StayFields } from "./stay-url";

const TODAY = "2026-11-17";
const stay = (overrides: Partial<StayFields> = {}): StayFields => ({ checkIn: "2026-12-01", checkOut: "2026-12-07", rooms: 1, adults: 2, children: 0, childAges: [], flexDays: 0, ...overrides });
const hotel = { kind: "hotel" as const, id: "azure" };
const experience = { kind: "experience" as const, id: "ubud", duration: { type: "fixed" as const, nights: 6 }, group: { min: 4, max: 12 } };
const flexible = { kind: "package" as const, id: "tuscany", duration: { type: "flexible" as const, minNights: 3, maxNights: 7 }, group: { min: 1, max: 12 } };

describe("toRoomRequest: when the search is complete and valid", () => {
  it("is null without dates, with one date, or with a past date", () => {
    expect(toRoomRequest(stay({ checkIn: null, checkOut: null }), hotel, TODAY)).toBeNull();
    expect(toRoomRequest(stay({ checkOut: null }), hotel, TODAY)).toBeNull();
    expect(toRoomRequest(stay({ checkIn: "2026-11-01", checkOut: "2026-11-05" }), hotel, TODAY)).toBeNull();
  });

  it("builds the request for a valid hotel stay, with the children's ages", () => {
    expect(toRoomRequest(stay({ adults: 3, children: 2, childAges: [4, 9], rooms: 2 }), hotel, TODAY)).toEqual({ kind: "hotel", id: "azure", checkIn: "2026-12-01", checkOut: "2026-12-07", adults: 3, children: 2, childAges: [4, 9], rooms: 2 });
  });

  it("needs an age for every child, and ages from 0 to 17", () => {
    expect(toRoomRequest(stay({ children: 2, childAges: [4] }), hotel, TODAY)).toBeNull();
    expect(toRoomRequest(stay({ children: 1, childAges: [18] }), hotel, TODAY)).toBeNull();
    expect(toRoomRequest(stay({ children: 1, childAges: [0] }), hotel, TODAY)).not.toBeNull();
  });

  it("needs rooms <= adults", () => {
    expect(toRoomRequest(stay({ rooms: 3, adults: 2 }), hotel, TODAY)).toBeNull();
    expect(toRoomRequest(stay({ rooms: 2, adults: 2 }), hotel, TODAY)).not.toBeNull();
  });

  it("for a fixed-duration product recomputes the end from the start, and needs a group within the maximum", () => {
    expect(toRoomRequest(stay(), experience, TODAY)).not.toBeNull();
    expect(toRoomRequest(stay({ checkOut: "2026-12-05" }), experience, TODAY)?.checkOut).toBe("2026-12-07"); // 4 nights in the URL, 6 nights fixed
    expect(toRoomRequest(stay({ adults: 9, children: 4, childAges: [1, 2, 3, 4] }), experience, TODAY)).toBeNull(); // 13 travellers
    expect(toRoomRequest(stay({ adults: 9, children: 3, childAges: [1, 2, 3] }), experience, TODAY)).not.toBeNull(); // 12
  });

  it("for a fixed-duration product needs only the start date: a missing end is built from it, for a hotel it is still incomplete", () => {
    expect(toRoomRequest(stay({ checkOut: null }), experience, TODAY)?.checkOut).toBe("2026-12-07");
    expect(toRoomRequest(stay({ checkOut: null }), flexible, TODAY)).toBeNull();
    expect(toRoomRequest(stay({ checkOut: null }), hotel, TODAY)).toBeNull();
  });

  it("for a flexible product keeps the range within its minimum and maximum nights", () => {
    expect(toRoomRequest(stay({ checkOut: "2026-12-04" }), flexible, TODAY)?.checkOut).toBe("2026-12-04"); // 3 nights
    expect(toRoomRequest(stay({ checkOut: "2026-12-08" }), flexible, TODAY)?.checkOut).toBe("2026-12-08"); // 7 nights
    expect(toRoomRequest(stay({ checkOut: "2026-12-03" }), flexible, TODAY)).toBeNull(); // 2 nights: below the minimum
    expect(toRoomRequest(stay({ checkOut: "2026-12-09" }), flexible, TODAY)).toBeNull(); // 8 nights: above the maximum
  });

  it("is happy with a group below the minimum", () => {
    expect(toRoomRequest(stay({ adults: 2 }), experience, TODAY)).not.toBeNull();
  });
});
