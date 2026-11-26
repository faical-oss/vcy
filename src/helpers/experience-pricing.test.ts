import { describe, expect, it } from "vitest";
import { priceRooms, splitGuests, totalOf, type PricedRoom } from "./experience-pricing";

const a: PricedRoom = { id: "a", perPerson: 1000, maxAdults: 2, maxOccupancy: 3 };
const b: PricedRoom = { id: "b", perPerson: 1500, maxAdults: 3, maxOccupancy: 4 };

describe("experience pricing per person", () => {
  it("seats one guest in every room first, then fills round-robin up to each room's occupancy", () => {
    expect(splitGuests([a, b], 2)).toEqual([1, 1]);
    expect(splitGuests([a, b], 5)).toEqual([3, 2]);
    expect(splitGuests([a, b], 7)).toEqual([3, 4]);
    expect(splitGuests([a, b], 20)).toEqual([3, 4]); // the rest cannot be seated: capacity is checked elsewhere
  });

  it("prices one room type as guests x per-person price", () => {
    const shares = priceRooms({ a: 1 }, [a, b], 2);
    expect(shares).toEqual([{ roomId: "a", guests: 2, subtotal: 2000 }]);
  });

  it("adds up several room types and quantities in the order they were chosen", () => {
    const shares = priceRooms({ a: 2, b: 1 }, [a, b], 6);
    expect(shares.map((share) => share.roomId)).toEqual(["a", "b"]);
    expect(shares.reduce((sum, share) => sum + share.guests, 0)).toBe(6);
    expect(totalOf(shares)).toBe(shares[0].guests * 1000 + shares[1].guests * 1500);
  });

  it("ignores rooms it does not know", () => {
    expect(priceRooms({ zzz: 1 }, [a], 2)).toEqual([]);
  });
});
