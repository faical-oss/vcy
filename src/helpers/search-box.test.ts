import { afterEach, describe, expect, it, vi } from "vitest";
import { SEARCH_TARGET, defaultDates, filterOptions, initialSearchState, readSearchFromSearch, searchHref, searchReducer, travellerSummary, type SearchBoxState } from "./search-box";

const bali = { label: "Bali, Indonesia", slug: "bali-indonesia" };
const yoga = { label: "Yoga Retreats", slug: "yoga-retreats" };
const run = (state: SearchBoxState, ...actions: Parameters<typeof searchReducer>[1][]) => actions.reduce(searchReducer, state);
const labels = (_tab: string, kind: string, slug: string) => (kind === "destination" ? "Bali, Indonesia" : slug === "yoga-retreats" ? "Yoga Retreats" : slug);

afterEach(() => vi.useRealTimers());

describe("defaultDates", () => {
  it("is tomorrow to two nights later, across month and year ends", () => {
    expect(defaultDates("2026-11-19")).toEqual({ checkIn: "2026-11-20", checkOut: "2026-11-22" });
    expect(defaultDates("2026-12-30")).toEqual({ checkIn: "2026-12-31", checkOut: "2027-01-02" });
    expect(defaultDates("2028-02-28")).toEqual({ checkIn: "2028-02-29", checkOut: "2028-03-02" });
  });
});

describe("search box reducer", () => {
  it("starts on the Experiences tab with one traveller and nothing chosen", () => {
    expect(initialSearchState()).toMatchObject({ tab: "experience", type: null, destination: null, checkIn: null, flexDays: 0, rooms: 1, adults: 1, children: 0, childAges: [] });
    expect(travellerSummary(initialSearchState())).toBe("1 traveller");
  });

  it("picking an option sets the value and the text, typing again unpicks it, and clearing resets only that field", () => {
    let state = run(initialSearchState(), { kind: "type", option: yoga }, { kind: "destination", option: bali });
    expect(state).toMatchObject({ typeText: "Yoga Retreats", type: yoga, destinationText: "Bali, Indonesia", destination: bali });
    state = run(state, { kind: "typeText", text: "yo" });
    expect(state).toMatchObject({ typeText: "yo", type: null, destination: bali });
    state = run(state, { kind: "destination", option: null });
    expect(state).toMatchObject({ destination: null, destinationText: "" });
  });

  it("resets every field when the tab changes, and keeps them when it is the same tab", () => {
    const filled = run(initialSearchState(), { kind: "type", option: yoga }, { kind: "dates", checkIn: "2099-10-14", checkOut: "2099-10-21" }, { kind: "adults", value: 3 });
    expect(run(filled, { kind: "tab", tab: "experience" })).toBe(filled);
    // Everything starts again except the dates, so a search never loses them.
    expect(run(filled, { kind: "tab", tab: "hotel" })).toEqual({ ...initialSearchState("hotel"), checkIn: "2099-10-14", checkOut: "2099-10-21" });
  });

  it("drops a check-out that is not after the check-in", () => {
    expect(run(initialSearchState(), { kind: "dates", checkIn: "2099-10-14", checkOut: "2099-10-14" }).checkOut).toBeNull();
    expect(run(initialSearchState(), { kind: "dates", checkIn: "2099-10-14", checkOut: "2099-10-10" }).checkOut).toBeNull();
    expect(run(initialSearchState(), { kind: "dates", checkIn: "2099-10-14", checkOut: "2099-10-21" })).toMatchObject({ checkIn: "2099-10-14", checkOut: "2099-10-21" });
    expect(run(initialSearchState(), { kind: "dates", checkIn: null, checkOut: "2099-10-21" }).checkOut).toBeNull();
  });

  it("follows the guest rules: rooms never exceed adults, one age per child with none chosen, limits", () => {
    let state = run(initialSearchState(), { kind: "adults", value: 3 }, { kind: "rooms", value: 3 }, { kind: "children", value: 2 });
    expect(state).toMatchObject({ rooms: 3, adults: 3, children: 2, childAges: [null, null] });
    state = run(state, { kind: "childAge", index: 1, age: 6 }, { kind: "childAge", index: 5, age: 4 });
    expect(state.childAges).toEqual([null, 6]);
    state = run(state, { kind: "adults", value: 1 });
    expect(state.rooms).toBe(1);
    expect(travellerSummary(state)).toBe("3 travellers");
    expect(run(state, { kind: "children", value: 0 }).childAges).toEqual([]);
    expect(run(initialSearchState(), { kind: "adults", value: 99 }).adults).toBe(9);
  });
});

describe("searchHref", () => {
  it("is the tab and the default dates for an empty search (all results)", () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-19T10:00:00Z") });
    expect(searchHref(initialSearchState())).toBe(`${SEARCH_TARGET}?type=experience&checkIn=2026-11-20&checkOut=2026-11-22`);
    expect(searchHref(initialSearchState("hotel"))).toBe(`${SEARCH_TARGET}?type=hotel&checkIn=2026-11-20&checkOut=2026-11-22`);
  });

  it("always sends both dates: a missing check-out is two nights after the check-in", () => {
    const state = run(initialSearchState(), { kind: "dates", checkIn: "2099-10-14", checkOut: null });
    expect(Object.fromEntries(new URL(searchHref(state), "http://x").searchParams)).toMatchObject({ checkIn: "2099-10-14", checkOut: "2099-10-16" });
  });

  it("carries the picked type and destination, the dates with flexibility, and the guests that are not the default", () => {
    const state = run(initialSearchState(), { kind: "type", option: yoga }, { kind: "destination", option: bali }, { kind: "dates", checkIn: "2099-10-14", checkOut: "2099-10-21" }, { kind: "flex", days: 2 }, { kind: "adults", value: 2 }, { kind: "children", value: 1 }, { kind: "childAge", index: 0, age: 2 });
    const params = new URL(searchHref(state), "http://x").searchParams;
    expect(Object.fromEntries(params)).toEqual({ type: "experience", category: "yoga-retreats", destination: "bali-indonesia", checkIn: "2099-10-14", checkOut: "2099-10-21", flex: "2", adults: "2", children: "1", childAges: "2" });
  });

  it("sends text that was typed but not picked as q, with the flexibility and the dates", () => {
    const state = run(initialSearchState(), { kind: "typeText", text: "  surf camp " }, { kind: "destinationText", text: "Lisbon" }, { kind: "dates", checkIn: "2099-10-14", checkOut: "2099-10-21" }, { kind: "flex", days: 3 });
    expect(Object.fromEntries(new URL(searchHref(state), "http://x").searchParams)).toEqual({ type: "experience", q: "surf camp Lisbon", checkIn: "2099-10-14", checkOut: "2099-10-21", flex: "3" });
  });
});

describe("readSearchFromSearch", () => {
  it("round-trips a search URL back into the bar", () => {
    const state = run(initialSearchState("hotel"), { kind: "destination", option: bali }, { kind: "dates", checkIn: "2099-10-14", checkOut: "2099-10-21" }, { kind: "flex", days: 1 }, { kind: "adults", value: 2 }, { kind: "children", value: 1 }, { kind: "childAge", index: 0, age: 7 });
    const read = readSearchFromSearch(searchHref(state).split("?")[1], labels)!;
    expect(read).toMatchObject({ tab: "hotel", destination: bali, destinationText: "Bali, Indonesia", checkIn: "2099-10-14", checkOut: "2099-10-21", flexDays: 1, adults: 2, children: 1, childAges: [7], rooms: 1 });
  });

  it("is null without a valid `type`, so a detail page's stay parameters never fill the bar", () => {
    expect(readSearchFromSearch("checkIn=2099-10-14&checkOut=2099-10-21&adults=2", labels)).toBeNull();
    expect(readSearchFromSearch("type=spaceship", labels)).toBeNull();
    expect(readSearchFromSearch("", labels)).toBeNull();
  });

  it("accepts only type=experience|package|hotel exactly: anything else is not a search URL", () => {
    for (const tab of ["experience", "package", "hotel"]) expect(readSearchFromSearch(`type=${tab}`, labels)?.tab).toBe(tab);
    for (const other of ["experiences", "Hotel", "HOTEL", "hotel ", "room", "checkout", "yoga-retreats", ""]) expect(readSearchFromSearch(`type=${encodeURIComponent(other)}&destination=bali-indonesia`, labels), `type=${other}`).toBeNull();
    expect(readSearchFromSearch("type=hotel&type=spaceship", labels)?.tab).toBe("hotel"); // the first value is the one read
  });

  it("ignores half a date range and falls back to one adult", () => {
    expect(readSearchFromSearch("type=package&checkIn=2099-10-14", labels)).toMatchObject({ tab: "package", checkIn: null, checkOut: null, adults: 1, rooms: 1 });
  });
});

describe("filterOptions", () => {
  const options = [{ label: "Yoga Retreats", slug: "a" }, { label: "Wellness & Spa", slug: "b" }, { label: "Surf & Yoga", slug: "c" }];
  it("filters by the start of a word, case-insensitive, and returns everything for no text", () => {
    expect(filterOptions(options, "yo").map((option) => option.slug)).toEqual(["a", "c"]);
    expect(filterOptions(options, " SPA ").map((option) => option.slug)).toEqual(["b"]);
    expect(filterOptions(options, "oga")).toEqual([]); // inside a word is not a match
    expect(filterOptions(options, "s").map((option) => option.slug)).toEqual(["b", "c"]);
    expect(filterOptions(options, "(")).toEqual([]); // regex characters are plain text
    expect(filterOptions(options, "")).toEqual(options);
    expect(filterOptions(options, "zzzyo")).toEqual([]);
  });
});
