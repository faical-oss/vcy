import { describe, expect, it } from "vitest";
import { EXPERIENCE_GROUP_SIZE } from "@/constants/experience";
import { departureEnd, minimumGroupNote, parseDepartureParams, seatsLeft, travellerLimits } from "./experience-stay";

const TODAY = "2026-11-17";
const group = { min: 4, max: 12 };

describe("experience stay rules", () => {
  it("keeps the group size in one config constant", () => {
    expect(EXPERIENCE_GROUP_SIZE).toEqual({ min: 4, max: 12 });
  });

  it("ends a departure `nights` after the start", () => {
    expect(departureEnd("2026-12-01", 7)).toBe("2026-12-08");
    expect(departureEnd("2026-12-28", 7)).toBe("2027-01-04");
  });

  it("stops the steppers at the maximum group size", () => {
    expect(travellerLimits(group, { adults: 2, children: 0 }, { maxAdults: 9, maxChildren: 6 })).toEqual({ maxAdults: 9, maxChildren: 6 });
    expect(travellerLimits(group, { adults: 8, children: 4 }, { maxAdults: 9, maxChildren: 6 })).toEqual({ maxAdults: 8, maxChildren: 4 });
    expect(seatsLeft(group, 8, 4)).toBe(0);
    expect(seatsLeft(group, 20, 0)).toBe(0);
  });

  it("shows the minimum as a note and never as a block", () => {
    expect(minimumGroupNote(group)).toBe("Runs with 4+ guests");
    expect(minimumGroupNote({ min: 1, max: 12 })).toBeNull();
    // Two travellers is below the minimum of four, and still a valid search.
    expect(parseDepartureParams({ checkIn: "2026-12-01", checkOut: "2026-12-08", adults: "2" }, TODAY, 7, group).ok).toBe(true);
  });

  it("accepts a departure of the fixed duration within the group size", () => {
    const parsed = parseDepartureParams({ checkIn: "2026-12-01", checkOut: "2026-12-08", adults: "6", children: "2", childAges: "3,5" }, TODAY, 7, group);
    expect(parsed).toMatchObject({ ok: true, stay: { adults: 6, children: 2, nights: 7 } });
  });

  it("repairs another end date, and rejects a group above the maximum and what the stay rules already reject", () => {
    expect(parseDepartureParams({ checkIn: "2026-12-01", checkOut: "2026-12-05" }, TODAY, 7, group)).toMatchObject({ ok: true, stay: { checkOut: "2026-12-08", nights: 7 } });
    expect(parseDepartureParams({ checkIn: "2026-12-01", checkOut: "2026-12-08", adults: "9", children: "4", childAges: "1,2,3,4" }, TODAY, 7, group)).toEqual({ ok: false, reason: "invalid" });
    expect(parseDepartureParams({}, TODAY, 7, group)).toEqual({ ok: false, reason: "missing" });
    expect(parseDepartureParams({ checkIn: "2026-11-01", checkOut: "2026-11-08" }, TODAY, 7, group)).toEqual({ ok: false, reason: "invalid" });
  });
});
