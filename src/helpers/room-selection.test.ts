import { describe, expect, it } from "vitest";
import { adjustSelection, checkCapacity, clampSelection, selectedCount } from "./room-selection";

const ROOMS = [
  { id: "a", maxAdults: 2, maxOccupancy: 3 },
  { id: "b", maxAdults: 3, maxOccupancy: 4 },
];

describe("room selection", () => {
  it("counts the selected rooms", () => {
    expect(selectedCount({})).toBe(0);
    expect(selectedCount({ a: 2, b: 1 })).toBe(3);
  });

  describe("adjustSelection", () => {
    it("adds one room of a type until the searched rooms are reached", () => {
      let selection = adjustSelection({}, "a", 1, 2);
      selection = adjustSelection(selection, "a", 1, 2);
      expect(selection).toEqual({ a: 2 });
      expect(adjustSelection(selection, "b", 1, 2)).toEqual({ a: 2 }); // sum reached: ignored
    });
    it("removes one room and drops the type at zero", () => {
      expect(adjustSelection({ a: 2 }, "a", -1, 2)).toEqual({ a: 1 });
      expect(adjustSelection({ a: 1, b: 1 }, "a", -1, 2)).toEqual({ b: 1 });
      expect(adjustSelection({ b: 1 }, "a", -1, 2)).toEqual({ b: 1 });
    });
    it("swaps the choice when one room is searched", () => {
      expect(adjustSelection({ a: 1 }, "b", 1, 1)).toEqual({ b: 1 });
    });
  });

  describe("clampSelection", () => {
    it("leaves a selection that fits", () => {
      const selection = { a: 1, b: 1 };
      expect(clampSelection(selection, 2)).toBe(selection);
    });
    it("takes from the most recently added rooms first", () => {
      expect(clampSelection({ a: 2, b: 1 }, 2)).toEqual({ a: 2 });
      expect(clampSelection({ a: 2, b: 2 }, 1)).toEqual({ a: 1 });
      expect(clampSelection({ a: 1 }, 1)).toEqual({ a: 1 });
    });
  });

  describe("checkCapacity", () => {
    it("accepts rooms that hold every guest", () => {
      expect(checkCapacity({ a: 1 }, ROOMS, { adults: 2, children: 1 })).toEqual({ ok: true });
    });
    it("rejects when the adults do not fit the adult places", () => {
      expect(checkCapacity({ a: 1 }, ROOMS, { adults: 3, children: 0 })).toEqual({ ok: false, reason: "adults", capacity: 2, needed: 3 });
    });
    it("rejects when adults and children together exceed the occupancy", () => {
      expect(checkCapacity({ a: 1 }, ROOMS, { adults: 2, children: 2 })).toEqual({ ok: false, reason: "guests", capacity: 3, needed: 4 });
    });
    it("adds up several rooms and quantities", () => {
      expect(checkCapacity({ a: 2, b: 1 }, ROOMS, { adults: 6, children: 4 })).toEqual({ ok: true });
    });
  });
});
