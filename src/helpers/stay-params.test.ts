import { describe, expect, it } from "vitest";
import { isIsoDate, nightsBetween, parseStayParams } from "./stay-params";

const TODAY = "2026-11-17";

describe("parseStayParams", () => {
  it("reads valid dates with the default guests", () => {
    expect(parseStayParams({ checkIn: "2026-12-01", checkOut: "2026-12-05" }, TODAY)).toEqual({
      ok: true,
      stay: { checkIn: "2026-12-01", checkOut: "2026-12-05", rooms: 1, adults: 2, children: 0, childAges: [], flexDays: 0, nights: 4 },
    });
  });

  it("reads rooms, guests and flexibility", () => {
    const parsed = parseStayParams({ checkIn: "2026-12-01", checkOut: "2026-12-03", rooms: "2", adults: "3", children: "1", flex: "2" }, TODAY);
    expect(parsed).toMatchObject({ ok: true, stay: { rooms: 2, adults: 3, children: 1, flexDays: 2 } });
  });

  it("reads one age per child and rejects a count mismatch or an age outside 0-17", () => {
    const dates = { checkIn: "2026-12-01", checkOut: "2026-12-03" };
    expect(parseStayParams({ ...dates, children: "2", childAges: "2,17" }, TODAY)).toMatchObject({ ok: true, stay: { children: 2, childAges: [2, 17] } });
    for (const raw of [{ children: "2", childAges: "2" }, { children: "1", childAges: "18" }, { children: "1", childAges: "x" }, { children: "1", childAges: "1,2" }]) {
      expect(parseStayParams({ ...dates, ...raw }, TODAY)).toEqual({ ok: false, reason: "invalid" });
    }
  });

  it("is 'missing' without dates and 'invalid' for everything else that is wrong", () => {
    expect(parseStayParams({}, TODAY)).toEqual({ ok: false, reason: "missing" });
    const bad: [string, Parameters<typeof parseStayParams>[0]][] = [
      ["only check-in", { checkIn: "2026-12-01" }],
      ["not a date", { checkIn: "2026-13-01", checkOut: "2026-13-05" }],
      ["past check-in", { checkIn: "2026-11-16", checkOut: "2026-11-20" }],
      ["check-out before check-in", { checkIn: "2026-12-05", checkOut: "2026-12-01" }],
      ["zero nights", { checkIn: "2026-12-05", checkOut: "2026-12-05" }],
      ["too many nights", { checkIn: "2026-12-01", checkOut: "2027-02-01" }],
      ["zero adults", { checkIn: "2026-12-01", checkOut: "2026-12-03", adults: "0" }],
      ["fewer adults than rooms", { checkIn: "2026-12-01", checkOut: "2026-12-03", rooms: "3", adults: "2" }],
      ["too many children", { checkIn: "2026-12-01", checkOut: "2026-12-03", children: "7" }],
      ["non-numeric guests", { checkIn: "2026-12-01", checkOut: "2026-12-03", adults: "two" }],
      ["bad flexibility", { checkIn: "2026-12-01", checkOut: "2026-12-03", flex: "8" }],
    ];
    for (const [label, raw] of bad) expect(parseStayParams(raw, TODAY), label).toEqual({ ok: false, reason: "invalid" });
  });

  it("takes the first value of a repeated parameter and accepts today as check-in", () => {
    expect(parseStayParams({ checkIn: ["2026-11-17", "2030-01-01"], checkOut: "2026-11-18" }, TODAY)).toMatchObject({ ok: true, stay: { nights: 1 } });
  });
});

describe("date helpers", () => {
  it("validates real calendar dates and counts nights", () => {
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
    expect(nightsBetween("2026-12-31", "2027-01-02")).toBe(2);
  });
});
