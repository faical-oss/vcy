import { describe, expect, it } from "vitest";
import { formatDateRange } from "./format";
import { searchSummary } from "./search-summary";

const today = "2026-01-15";

describe("formatDateRange", () => {
  it("collapses the month when both dates share it, with an en dash, and no year in the current year", () => {
    expect(formatDateRange("2026-03-12", "2026-03-19", { locale: "en-GB", today })).toBe("12–19 Mar");
  });

  it("keeps both months when they differ (still with the en dash)", () => {
    expect(formatDateRange("2026-02-28", "2026-03-03", { locale: "en-GB", today })).toBe("28 Feb–3 Mar");
  });

  it("adds the year when it is not the current one", () => {
    expect(formatDateRange("2027-03-12", "2027-03-19", { locale: "en-GB", today })).toBe("12–19 Mar 2027");
    expect(formatDateRange("2026-12-28", "2027-01-03", { locale: "en-GB", today })).toBe("28 Dec 2026–3 Jan 2027");
  });

  it("follows the visitor's locale", () => {
    expect(formatDateRange("2026-03-12", "2026-03-19", { locale: "en-US", today })).toBe("Mar 12–19");
  });
});

const base = { checkIn: "2026-03-12", checkOut: "2026-03-19" };

describe("searchSummary", () => {
  it("experiences: dates, travellers (adults and children), per person, and the room choice at checkout", () => {
    expect(searchSummary({ ...base, adults: 2, children: 1 }, { today, locale: "en-GB" })).toEqual({
      full: "Prices for 12–19 Mar · 3 travellers, per person. You'll choose your room at checkout.",
      compact: "Prices for 12–19 Mar · 3 travellers. Choose your room at checkout.",
    });
  });

  it("pluralizes a single traveller", () => {
    expect(searchSummary({ ...base, adults: 1, children: 0 }, { today, locale: "en-GB" }).full).toContain("1 traveller, per person");
  });
});
