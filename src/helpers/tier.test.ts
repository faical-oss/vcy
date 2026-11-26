import { describe, expect, it } from "vitest";
import { bookingsAwayText, initialsOf, tierSegments } from "./tier";

describe("tier progress", () => {
  it("fills segments up to the current level and flags the current one", () => {
    expect(tierSegments(2, 3)).toEqual([
      { level: 1, filled: true, current: false },
      { level: 2, filled: true, current: true },
      { level: 3, filled: false, current: false },
    ]);
  });

  it("handles a level above zero bookings and the top level", () => {
    expect(tierSegments(1, 3).map((s) => s.filled)).toEqual([true, false, false]);
    expect(tierSegments(3, 3).map((s) => s.filled)).toEqual([true, true, true]);
  });

  it("words the distance to the next level", () => {
    expect(bookingsAwayText(9, 3)).toBe("You're 9 bookings away from Wellness level 3");
    expect(bookingsAwayText(1, 3)).toBe("You're 1 booking away from Wellness level 3");
  });

  it("builds avatar initials from the first name", () => {
    expect(initialsOf("Faical")).toBe("FA");
    expect(initialsOf("  jo")).toBe("JO");
    expect(initialsOf("")).toBe("VC");
  });
});
