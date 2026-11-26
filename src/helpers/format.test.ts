import { describe, expect, it } from "vitest";
import { formatCount, formatDate, formatDateShort, formatMonthYear, formatPrice } from "./format";

describe("formatPrice", () => {
  it("formats whole-dollar prices", () => {
    expect(formatPrice(1295)).toBe("$1,295");
  });
});

describe("formatCount", () => {
  it("adds a plus sign and thousands separators", () => {
    expect(formatCount(240)).toBe("240+");
    expect(formatCount(1300)).toBe("1,300+");
  });
});

describe("formatDate", () => {
  it("formats an ISO date without timezone drift", () => {
    expect(formatDate("2026-11-09")).toBe("Nov 9, 2026");
  });
});

describe("formatDateShort and formatMonthYear", () => {
  it("formats ISO dates without timezone drift", () => {
    expect(formatDateShort("2026-10-07")).toBe("07 Oct 2026");
    expect(formatDateShort("2026-09-30")).toBe("30 Sep 2026");
    expect(formatMonthYear("2026-03-04")).toBe("March 2026");
  });
});
