import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SearchParams } from "@/interfaces";
import { mockSearchService } from "./search.mock";

const base: SearchParams = { type: "hotel", guests: { rooms: 1, adults: 2, children: 0, childAges: [] }, filters: {}, sort: "recommended", page: 1, pageSize: 12 };
const stay = { checkIn: "2099-10-14", checkOut: "2099-10-21", flexDays: 0 };
const run = async (params: Partial<SearchParams>, scenario?: "partial" | "none" | "error") => {
  const result = mockSearchService.search({ ...base, ...params }, { scenario });
  // Attach the handlers before the timers run, so the error scenario is not an unhandled rejection.
  const settled = result.then((value) => value, (error: unknown) => error);
  await vi.advanceTimersByTimeAsync(500);
  const value = await settled;
  if (value instanceof Error) throw value;
  return value as Awaited<typeof result>;
};

describe("mockSearchService", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("lists the catalog's hotels and paginates", async () => {
    const first = await run({ pageSize: 5 });
    expect(first.total).toBeGreaterThan(5);
    expect(first.items).toHaveLength(5);
    expect(first.items.every((item) => item.kind === "hotel")).toBe(true);
  });

  it.each(["hotel", "experience", "package"] as const)("has at least 20 %s results, and the filter options come from them", async (type) => {
    const result = await run({ type, pageSize: 50 });
    expect(result.total).toBeGreaterThanOrEqual(20);
    expect(result.items.every((item) => item.kind === type)).toBe(true);
    expect(result.facets.types.length).toBeGreaterThan(1);
    expect(result.facets.places.length).toBeGreaterThan(1);
  });

  it("offers the prototype's filter groups per tab, from the results", async () => {
    const pkg = (await run({ type: "package", pageSize: 50 })).facets;
    expect(pkg.types.length).toBeGreaterThan(3);
    expect(pkg.types.every((entry) => ["Luxury", "Adventure", "Wellness & Detox", "Family", "Solo Retreat", "Eco & Sustainable", "Cultural", "Spa", "Anniversary", "Girls' Getaway"].includes(entry.label))).toBe(true);
    expect(pkg.board.map((entry) => entry.label)).toContain("All-inclusive");
    expect(pkg.amenities.length).toBeGreaterThan(3);
    expect(pkg.duration.length).toBeGreaterThan(1);
    const exp = (await run({ type: "experience", pageSize: 50 })).facets;
    expect(exp.groupSize.length).toBeGreaterThan(2);
    expect(exp.difficulty.map((entry) => entry.label)).toEqual(["Easy", "Moderate", "Challenging", "Strenuous"]);
    expect(exp.amenities.length).toBeGreaterThan(3);
    const filtered = await run({ type: "experience", pageSize: 50, filters: { difficulty: ["easy"], duration: exp.duration.map((entry) => entry.slug).slice(0, 1) } });
    expect(filtered.total).toBeGreaterThan(0);
    expect(filtered.total).toBeLessThan(24);
  });

  it("gives no prices and unknown availability without dates, and prices with them", async () => {
    const without = await run({});
    expect(without.items.every((item) => item.price === undefined && item.availability === "unknown")).toBe(true);
    const withDates = await run({ stay });
    expect(withDates.items.every((item) => item.price && item.availability === "available")).toBe(true);
  });

  it("marks some results unavailable (and last) in the partial scenario, only with dates", async () => {
    const partial = await run({ stay }, "partial");
    const flags = partial.items.map((item) => item.availability === "unavailable");
    expect(flags).toContain(true);
    expect(flags).toEqual([...flags].sort((a, b) => Number(a) - Number(b)));
    expect((await run({}, "partial")).items.every((item) => item.availability === "unknown")).toBe(true);
  });

  it("has an empty scenario and an error scenario", async () => {
    expect((await run({ stay }, "none")).items).toEqual([]);
    await expect(run({ stay }, "error")).rejects.toThrow();
  });

  it("filters by destination, price, rating and sorts by price", async () => {
    expect((await run({ destination: "maldives" })).items.every((item) => item.location.includes("Maldives"))).toBe(true);
    expect((await run({ filters: { minPrice: 1000 } })).items.length).toBeGreaterThan(0);
    expect((await run({ filters: { rating: 5 } })).items.every((item) => Math.round(item.rating ?? 0) === 5)).toBe(true);
    const ascending = (await run({ sort: "price-asc", pageSize: 50 })).items.map((item) => item.price?.amount ?? 0);
    expect(ascending).toEqual([...ascending].sort((a, b) => a - b));
  });

  it("offers filter options from the search's own results", async () => {
    const { facets } = await run({ destination: "maldives" });
    expect(facets.places.map((entry) => entry.slug)).toEqual(["maldives"]);
  });
});
