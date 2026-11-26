import { describe, expect, it } from "vitest";
import { FLEXIBLE_STAY, departureEnd, durationHint, durationLabel, isNightsAllowed, nightsRange, parseStayForDuration } from "./stay-duration";

const TODAY = "2026-11-17";
const group = { min: 1, max: 12 };
const fixed = { type: "fixed", nights: 7 } as const;
const flexible = { type: "flexible", minNights: 3, maxNights: 10 } as const;

describe("nights range and labels", () => {
  it("is the nights for a fixed duration, 1 to 30 for an unlimited flexible one, and the limits otherwise", () => {
    expect(nightsRange(fixed)).toEqual({ min: 7, max: 7 });
    expect(nightsRange(FLEXIBLE_STAY)).toEqual({ min: 1, max: 30 });
    expect(nightsRange(flexible)).toEqual({ min: 3, max: 10 });
    expect(nightsRange({ type: "flexible", maxNights: 90 })).toEqual({ min: 1, max: 30 });
    expect(isNightsAllowed(flexible, 3)).toBe(true);
    expect(isNightsAllowed(flexible, 2)).toBe(false);
    expect(isNightsAllowed(fixed, 6)).toBe(false);
  });

  it("builds the label from the data, never from a hardcoded number", () => {
    expect(durationLabel(fixed)).toBe("7 nights");
    expect(durationLabel({ type: "fixed", nights: 1 })).toBe("1 night");
    expect(durationLabel(flexible)).toBe("3–10 nights");
    expect(durationLabel({ type: "flexible", minNights: 2 })).toBe("At least 2 nights");
    expect(durationLabel({ type: "flexible", maxNights: 14 })).toBe("Up to 14 nights");
    expect(durationLabel(FLEXIBLE_STAY)).toBeNull();
    expect(durationHint(fixed, "package")).toBe("This package lasts 7 nights: pick your start date and the end date follows.");
    expect(durationHint(flexible, "package")).toBe("Stay 3–10 nights.");
    expect(durationHint(FLEXIBLE_STAY, "package")).toBeNull();
  });

  it("tidies limits outside 1 to 30 nights or with a minimum above the maximum, and the label agrees with the rule", () => {
    expect(nightsRange({ type: "flexible", minNights: 0, maxNights: 5 })).toEqual({ min: 1, max: 5 });
    expect(nightsRange({ type: "flexible", minNights: 7, maxNights: 3 })).toEqual({ min: 7, max: 7 });
    expect(nightsRange({ type: "flexible", minNights: 40 })).toEqual({ min: 30, max: 30 });
    expect(durationLabel({ type: "flexible", maxNights: 45 })).toBe("Up to 30 nights");
    expect(durationLabel({ type: "flexible", minNights: 0 })).toBe("At least 1 night");
    expect(durationLabel({ type: "flexible", minNights: 7, maxNights: 3 })).toBe("7 nights");
  });

  it("ends a fixed stay `nights` after the start", () => {
    expect(departureEnd("2026-12-28", 7)).toBe("2027-01-04");
  });
});

describe("parseStayForDuration", () => {
  it("fixed: recomputes the end from the start, whatever the URL says, and keeps the nights", () => {
    expect(parseStayForDuration({ checkIn: "2026-12-01", checkOut: "2026-12-04" }, TODAY, fixed, group)).toMatchObject({ ok: true, stay: { checkIn: "2026-12-01", checkOut: "2026-12-08", nights: 7 } });
    expect(parseStayForDuration({ checkIn: "2026-12-01", checkOut: "2026-12-08" }, TODAY, fixed, group)).toMatchObject({ ok: true, stay: { checkOut: "2026-12-08" } });
    expect(parseStayForDuration({ checkIn: "2026-12-01" }, TODAY, fixed, group)).toMatchObject({ ok: true, stay: { checkOut: "2026-12-08" } });
  });

  it("fixed: still rejects a bad or past start, a missing search, and a group above the maximum", () => {
    expect(parseStayForDuration({ checkIn: "nope", checkOut: "2026-12-08" }, TODAY, fixed, group)).toEqual({ ok: false, reason: "invalid" });
    expect(parseStayForDuration({ checkIn: "2026-11-01", checkOut: "2026-11-08" }, TODAY, fixed, group)).toEqual({ ok: false, reason: "invalid" });
    expect(parseStayForDuration({}, TODAY, fixed, group)).toEqual({ ok: false, reason: "missing" });
    expect(parseStayForDuration({ checkIn: "2026-12-01", adults: "9", children: "4", childAges: "1,2,3,4" }, TODAY, fixed, group)).toEqual({ ok: false, reason: "invalid" });
  });

  it("fixed: a stay longer than the shared 30 nights is allowed when the product lasts that long", () => {
    expect(parseStayForDuration({ checkIn: "2026-12-01" }, TODAY, { type: "fixed", nights: 40 }, group).ok).toBe(true);
  });

  it("flexible: keeps the range as given within the minimum and maximum", () => {
    expect(parseStayForDuration({ checkIn: "2026-12-01", checkOut: "2026-12-04" }, TODAY, flexible, group)).toMatchObject({ ok: true, stay: { nights: 3 } });
    expect(parseStayForDuration({ checkIn: "2026-12-01", checkOut: "2026-12-11" }, TODAY, flexible, group)).toMatchObject({ ok: true, stay: { nights: 10 } });
  });

  it("flexible: a range outside the minimum or maximum is invalid, and a missing end is not repaired", () => {
    expect(parseStayForDuration({ checkIn: "2026-12-01", checkOut: "2026-12-03" }, TODAY, flexible, group)).toEqual({ ok: false, reason: "invalid" });
    expect(parseStayForDuration({ checkIn: "2026-12-01", checkOut: "2026-12-12" }, TODAY, flexible, group)).toEqual({ ok: false, reason: "invalid" });
    expect(parseStayForDuration({ checkIn: "2026-12-01" }, TODAY, flexible, group)).toEqual({ ok: false, reason: "invalid" });
  });

  it("a hotel (no group, unlimited flexible) follows the shared stay rules: 1 to 30 nights, up to 9 adults", () => {
    expect(parseStayForDuration({ checkIn: "2026-12-01", checkOut: "2027-01-01" }, TODAY)).toEqual({ ok: false, reason: "invalid" }); // 31 nights
    expect(parseStayForDuration({ checkIn: "2026-12-01", checkOut: "2026-12-02", adults: "10" }, TODAY)).toEqual({ ok: false, reason: "invalid" });
    expect(parseStayForDuration({ checkIn: "2026-12-01", checkOut: "2026-12-02", adults: "9" }, TODAY).ok).toBe(true);
  });
});
