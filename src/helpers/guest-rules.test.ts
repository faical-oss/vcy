import { describe, expect, it } from "vitest";
import { GUEST_LIMITS, changeAdults, changeChildren, changeRooms, normalizeGuests } from "./guest-rules";

const guests = (rooms: number, adults: number, children = 0) => ({ rooms, adults, children });

describe("guest rules", () => {
  it("defaults the max rooms to 8", () => {
    expect(GUEST_LIMITS.maxRooms).toBe(8);
  });

  describe("changeRooms", () => {
    it("raises the adults to the room count when there are fewer adults than rooms", () => {
      expect(changeRooms(guests(1, 2), 3)).toEqual(guests(3, 3));
    });
    it("leaves the adults alone while they cover the rooms", () => {
      expect(changeRooms(guests(1, 4), 3)).toEqual(guests(3, 4));
    });
    it("decreasing rooms never changes the adults", () => {
      expect(changeRooms(guests(3, 5), 2)).toEqual(guests(2, 5));
    });
    it("never goes below 1 room or above the max", () => {
      expect(changeRooms(guests(1, 2), 0).rooms).toBe(1);
      expect(changeRooms(guests(1, 2), 99).rooms).toBe(8);
      expect(changeRooms(guests(1, 2), 99).adults).toBe(8);
    });
    it("honours a custom max rooms", () => {
      expect(changeRooms(guests(1, 2), 5, { ...GUEST_LIMITS, maxRooms: 3 }).rooms).toBe(3);
    });
  });

  describe("changeAdults", () => {
    it("lowers the rooms to the adult count when there would be fewer adults than rooms", () => {
      expect(changeAdults(guests(4, 4), 3)).toEqual(guests(3, 3));
    });
    it("leaves the rooms alone while the adults still cover them", () => {
      expect(changeAdults(guests(2, 5), 3)).toEqual(guests(2, 3));
    });
    it("increasing adults never changes the rooms", () => {
      expect(changeAdults(guests(2, 2), 6)).toEqual(guests(2, 6));
    });
    it("never goes below 1 adult (and so 1 room) or above the max", () => {
      expect(changeAdults(guests(2, 2), 0)).toEqual(guests(1, 1));
      expect(changeAdults(guests(1, 2), 99).adults).toBe(9);
    });
  });

  it("keeps children between 0 and the max and does not touch rooms or adults", () => {
    expect(changeChildren(guests(2, 3, 1), -1)).toEqual(guests(2, 3, 0));
    expect(changeChildren(guests(2, 3, 1), 99)).toEqual(guests(2, 3, 6));
  });

  it("normalizes guests that break the invariants", () => {
    expect(normalizeGuests(guests(6, 2, 9))).toEqual(guests(2, 2, 6));
    expect(normalizeGuests(guests(0, 0, -2))).toEqual(guests(1, 1, 0));
  });
});
