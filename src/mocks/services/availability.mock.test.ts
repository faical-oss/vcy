import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoomAvailabilityRequest } from "@/interfaces";
import { catalogFixture } from "../fixtures/catalog";
import { mockAvailabilityService } from "./availability.mock";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const ask = async (request: RoomAvailabilityRequest, scenario?: "available" | "partial" | "none" | "error") => {
  const pending = mockAvailabilityService.getRoomAvailability(request, { scenario });
  await vi.advanceTimersByTimeAsync(1000);
  return pending;
};
const base = { checkIn: "2099-12-01", checkOut: "2099-12-04", adults: 2, children: 0, childAges: [], rooms: 1 };

describe("mock room availability", () => {
  it("sells out two room types on every hotel by default, keeps the rest available, and gives the same answer for the same search", async () => {
    for (const hotel of catalogFixture.hotels.slice(0, 8)) {
      const request: RoomAvailabilityRequest = { ...base, kind: "hotel", id: hotel.slug };
      const first = await ask(request);
      expect(first.rooms.length).toBeGreaterThan(2);
      expect(first.rooms.filter((room) => !room.available), hotel.slug).toHaveLength(2);
      expect(first.rooms.some((room) => room.available)).toBe(true);
      expect(await ask(request)).toEqual(first);
    }
  });

  it("changes which rooms are sold out with the dates", async () => {
    const slug = catalogFixture.hotels[0].slug;
    const picks = new Set<string>();
    for (let day = 1; day <= 9; day += 1) {
      const result = await ask({ ...base, kind: "hotel", id: slug, checkIn: `2099-12-0${day}`, checkOut: `2099-12-1${day % 10}` });
      picks.add(result.rooms.filter((room) => !room.available).map((room) => room.roomId).join(","));
    }
    expect(picks.size).toBeGreaterThan(1);
  });

  it("the other scenarios are unchanged: none sells everything out, partial every second room, error throws", async () => {
    const request: RoomAvailabilityRequest = { ...base, kind: "hotel", id: catalogFixture.hotels[0].slug };
    expect((await ask(request, "none")).rooms.every((room) => !room.available)).toBe(true);
    const partial = (await ask(request, "partial")).rooms;
    expect(partial.map((room) => room.available)).toEqual(partial.map((_, index) => index % 2 === 0));
    const failing = mockAvailabilityService.getRoomAvailability(request, { scenario: "error" });
    const caught = failing.catch((error: Error) => error.message);
    await vi.advanceTimersByTimeAsync(1000);
    expect(await caught).toBe("mock availability error");
  });
});
