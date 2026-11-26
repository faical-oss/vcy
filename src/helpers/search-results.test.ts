import { describe, expect, it } from "vitest";
import { activeFilterCount, pageWindow, queryToSearchParams, readResultsState, readSearchParams, resultsKey, searchParamsToQuery, writeResultsState } from "./search-results";

const TODAY = "2026-11-22";
const BASE = "type=hotel&destination=bali&checkIn=2026-12-01&checkOut=2026-12-05";

describe("readSearchParams", () => {
  it("is not a search without a valid type", () => {
    expect(readSearchParams("destination=bali", TODAY).status).toBe("no-type");
    expect(readSearchParams("type=boat", TODAY).status).toBe("no-type");
  });

  it("reads the search with the default guests (1 room, 1 adult) and valid dates", () => {
    const read = readSearchParams(BASE, TODAY);
    expect(read).toMatchObject({ status: "ok", datesValid: true });
    if (read.status === "ok") expect(read.params).toMatchObject({ type: "hotel", destination: "bali", stay: { checkIn: "2026-12-01", checkOut: "2026-12-05", flexDays: 0 }, guests: { rooms: 1, adults: 1, children: 0, childAges: [] }, page: 1, pageSize: 12 });
  });

  it.each([["missing", "type=hotel"], ["past", "type=hotel&checkIn=2026-11-01&checkOut=2026-11-05"], ["reversed", "type=hotel&checkIn=2026-12-05&checkOut=2026-12-01"], ["too long", "type=hotel&checkIn=2026-12-01&checkOut=2027-02-01"], ["not a date", "type=hotel&checkIn=soon&checkOut=later"]])("still searches, without a stay, when the dates are %s", (_name, search) => {
    const read = readSearchParams(search, TODAY);
    expect(read).toMatchObject({ status: "ok", datesValid: false });
    if (read.status === "ok") expect(read.params.stay).toBeUndefined();
  });

  it("is incomplete while a child has no age", () => {
    expect(readSearchParams(`${BASE}&children=2&childAges=3`, TODAY).status).toBe("invalid-guests");
    expect(readSearchParams(`${BASE}&children=2&childAges=3,5`, TODAY).status).toBe("ok");
  });

  it("keeps rooms at or below adults", () => {
    const read = readSearchParams(`${BASE}&rooms=4&adults=2`, TODAY);
    if (read.status === "ok") expect(read.params.guests).toMatchObject({ rooms: 2, adults: 2 });
  });
});

describe("results state in the URL", () => {
  it("round-trips filters, sort, view and page, and leaves the search alone", () => {
    const state = { sort: "price-asc" as const, view: "grid" as const, page: 3, filters: { minPrice: 500, maxPrice: 1500, types: ["eco-lodge"], stars: [4, 5], places: ["thailand"], amenities: ["spa"], board: ["room-only"], duration: ["week-7-nights"], groupSize: ["couples"], difficulty: ["easy"], rating: 4 as const } };
    const written = writeResultsState(BASE, state);
    expect(written.startsWith(BASE)).toBe(true);
    expect(readResultsState(written)).toEqual(state);
  });

  it("leaves defaults out and ignores bad values", () => {
    expect(writeResultsState(BASE, readResultsState(""))).toBe(BASE);
    expect(readResultsState("sort=cheapest&page=-2&rating=9&stars=1,4&minPrice=x")).toMatchObject({ sort: "recommended", page: 1, filters: { stars: [4], rating: undefined, minPrice: undefined } });
  });

  it("counts a price range as one filter, and only when it narrows the bounds", () => {
    expect(activeFilterCount({ minPrice: 0, maxPrice: 5000 })).toBe(0);
    expect(activeFilterCount({ minPrice: 500, maxPrice: 900, types: ["a", "b"], rating: 4 })).toBe(4);
  });
});

describe("request and cache key", () => {
  it("is the same request for the same URL, and a new one when anything changes", () => {
    const read = (search: string) => {
      const result = readSearchParams(search, TODAY);
      if (result.status !== "ok") throw new Error("not a search");
      return result.params;
    };
    expect(resultsKey(read(BASE))).toBe(resultsKey(read(BASE)));
    expect(resultsKey(read(`${BASE}&page=2`))).not.toBe(resultsKey(read(BASE)));
    expect(resultsKey(read(`${BASE}&sort=top-rated`))).not.toBe(resultsKey(read(BASE)));
    expect(queryToSearchParams(searchParamsToQuery(read(`${BASE}&adults=2&amenities=spa`)), TODAY)).toEqual(read(`${BASE}&adults=2&amenities=spa`));
  });
});

describe("pageWindow", () => {
  it("shows the first, last and neighbouring pages with gaps", () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(1, 18)).toEqual([1, 2, "gap", 18]);
    expect(pageWindow(9, 18)).toEqual([1, "gap", 8, 9, 10, "gap", 18]);
    expect(pageWindow(1, 1)).toEqual([1]);
  });
});
