import { describe, expect, it } from "vitest";
import { readStayFromSearch, writeStayToSearch } from "./stay-url";

describe("stay in the URL", () => {
  it("reads dates, guests, child ages and flexibility, with defaults for what is missing", () => {
    const { fields, hasStay } = readStayFromSearch("?checkIn=2026-12-01&checkOut=2026-12-07&rooms=2&adults=3&children=2&childAges=4,9&flex=3");
    expect(hasStay).toBe(true);
    expect(fields).toEqual({ checkIn: "2026-12-01", checkOut: "2026-12-07", rooms: 2, adults: 3, children: 2, childAges: [4, 9], flexDays: 3 });
    expect(readStayFromSearch("")).toEqual({ hasStay: false, fields: { checkIn: null, checkOut: null, rooms: 1, adults: 2, children: 0, childAges: [], flexDays: 0 } });
  });

  it("leaves a missing or bad age empty (no default) and drops bad dates and flexibility", () => {
    const { fields } = readStayFromSearch("checkIn=tomorrow&checkOut=2026-12-07&children=2&childAges=5,x&flex=9");
    expect(fields.checkIn).toBeNull();
    expect(fields.childAges).toEqual([5, null]);
    expect(fields.flexDays).toBe(0);
    expect(readStayFromSearch("children=3&childAges=4").fields.childAges).toEqual([4, null, null]);
    expect(readStayFromSearch("children=1").fields.childAges).toEqual([null]);
    expect(readStayFromSearch("children=1&childAges=18").fields.childAges).toEqual([null]);
  });

  it("keeps a child without an age empty when written back (so it reads back as missing)", () => {
    const written = writeStayToSearch("", { checkIn: "2026-12-01", checkOut: "2026-12-07", rooms: 1, adults: 2, children: 2, childAges: [5, null], flexDays: 0 });
    expect(new URLSearchParams(written).get("childAges")).toBe("5,");
    expect(readStayFromSearch(written).fields.childAges).toEqual([5, null]);
  });

  it("writes a complete stay, keeps other parameters, and removes the stay when it is null", () => {
    const fields = { checkIn: "2026-12-01", checkOut: "2026-12-07", rooms: 1, adults: 2, children: 1, childAges: [5], flexDays: 2 };
    const written = writeStayToSearch("mock=partial&checkIn=2020-01-01", fields);
    expect(Object.fromEntries(new URLSearchParams(written))).toEqual({ mock: "partial", checkIn: "2026-12-01", checkOut: "2026-12-07", rooms: "1", adults: "2", children: "1", childAges: "5", flex: "2" });
    expect(writeStayToSearch(written, null)).toBe("mock=partial");
    expect(writeStayToSearch("checkIn=2026-12-01&checkOut=2026-12-07", null)).toBe("");
  });
});
