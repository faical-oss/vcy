import { describe, expect, it } from "vitest";
import { fnv1a, seededPick } from "./seeded-pick";

const items = Array.from({ length: 12 }, (_, index) => ({ id: `item-${String(index).padStart(2, "0")}` }));
const id = (item: { id: string }) => item.id;

describe("fnv1a", () => {
  it("matches the published 32-bit test vectors", () => {
    expect(fnv1a("")).toBe(0x811c9dc5);
    expect(fnv1a("a")).toBe(0xe40c292c);
    expect(fnv1a("foobar")).toBe(0xbf9cf968);
  });
});

describe("seededPick", () => {
  it("returns the same items in the same order for the same seed", () => {
    expect(seededPick(items, "yoga-retreats", 4, id)).toEqual(seededPick(items, "yoga-retreats", 4, id));
  });

  it("does not depend on the input order", () => {
    const reversed = [...items].reverse();
    const shuffled = [items[5], items[0], items[11], items[3], ...items.filter((_, i) => ![5, 0, 11, 3].includes(i))];
    const expected = seededPick(items, "bali-indonesia", 5, id);
    expect(seededPick(reversed, "bali-indonesia", 5, id)).toEqual(expected);
    expect(seededPick(shuffled, "bali-indonesia", 5, id)).toEqual(expected);
  });

  it("returns distinct items, never more than requested or available", () => {
    for (const seed of ["a", "b", "winter-sports", "safari-lodges", "réunion"]) {
      const picked = seededPick(items, seed, 12, id);
      expect(new Set(picked.map(id)).size).toBe(12);
    }
    expect(seededPick(items, "x", 3, id)).toHaveLength(3);
    expect(seededPick(items.slice(0, 2), "x", 5, id)).toHaveLength(2);
  });

  it("handles empty input and non-positive counts", () => {
    expect(seededPick([], "x", 3, id)).toEqual([]);
    expect(seededPick(items, "x", 0, id)).toEqual([]);
  });

  it("can give different picks for different seeds", () => {
    const firsts = new Set(["a", "b", "c", "d", "e", "f"].map((seed) => seededPick(items, seed, 3, id).map(id).join()));
    expect(firsts.size).toBeGreaterThan(1);
  });
});
