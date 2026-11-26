import { describe, expect, it } from "vitest";
import { PREFERENCE_CATEGORIES } from "@/constants/preferences";
import { countSelected, emptyPreferences, formatSelectedCount, toggleId } from "./preferences";

describe("preference options", () => {
  it("has the five categories in step order with the prototype's option counts", () => {
    expect(PREFERENCE_CATEGORIES.map((c) => [c.key, c.options.length])).toEqual([
      ["experiences", 20],
      ["regions", 7],
      ["places", 7],
      ["purpose", 10],
      ["style", 6],
    ]);
  });

  it("uses unique, stable slug ids", () => {
    for (const category of PREFERENCE_CATEGORIES) {
      const ids = category.options.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id))).toBe(true);
    }
    expect(PREFERENCE_CATEGORIES[0]!.options.find((o) => o.label === "Work and play")?.id).toBe("work-and-play");
  });
});

describe("selection helpers", () => {
  it("pluralises the footer count", () => {
    expect(formatSelectedCount(0)).toBe("0 preferences selected");
    expect(formatSelectedCount(1)).toBe("1 preference selected");
    expect(formatSelectedCount(12)).toBe("12 preferences selected");
  });

  it("counts selections across categories", () => {
    expect(countSelected(emptyPreferences())).toBe(0);
    expect(countSelected({ ...emptyPreferences(), experiences: ["bike", "run"], style: ["by-myself"] })).toBe(3);
  });

  it("toggles an id on and off without mutating", () => {
    const start = ["bike"];
    expect(toggleId(start, "run")).toEqual(["bike", "run"]);
    expect(toggleId(start, "bike")).toEqual([]);
    expect(start).toEqual(["bike"]);
  });
});
