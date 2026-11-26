// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FETCH_DEBOUNCE_MS } from "@/helpers/fetch-timing";
import type { SearchParams, SearchResponse, SearchResultItem } from "@/interfaces";
// The fixtures are the real copy and options: a test may read them, the component never does.
import { searchBoxFixture } from "@/mocks/fixtures/search";
import { searchResultsFixture } from "@/mocks/fixtures/search-results";
import { SearchResults } from "./search-results";

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }), usePathname: () => "/search", useSearchParams: () => new URLSearchParams(search) }));
const getSearchResults = vi.fn<(params: SearchParams, options: unknown) => Promise<SearchResponse>>();
vi.mock("@/services/search-results", () => ({ getSearchResults: (params: SearchParams, options: unknown) => getSearchResults(params, options) }));
vi.mock("@/components/ui/favorite-button", () => ({ FavoriteButton: () => null }));

const DATED = "type=hotel&checkIn=2099-10-14&checkOut=2099-10-21&adults=2";
const hotel = (over: Partial<SearchResultItem> = {}): SearchResultItem => ({ kind: "hotel", id: "azure", title: "Azure Spa", badge: "Wellness Resort", stars: 5, amenities: ["Spa"], location: "Krabi, Thailand", rating: 4.8, reviewCount: 312, href: "/hotels/h/azure", images: [], price: { amount: 420, currency: "USD" }, availability: "available", ...over }) as SearchResultItem;
const response = (items: SearchResultItem[], total = items.length): SearchResponse => ({ items, total, page: 1, pageSize: 12, facets: { types: [{ label: "Eco Lodge", slug: "eco-lodge" }, { label: "Wellness Resort", slug: "wellness-resort" }], stars: [5, 4], places: [], amenities: [], board: [], duration: [], groupSize: [], difficulty: [] } });

const show = (query: string) => {
  search = query;
  return render(<SearchResults content={searchResultsFixture} searchBox={searchBoxFixture} />);
};
/** Lets the debounce pass and the (mock) answer arrive. */
const settle = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(FETCH_DEBOUNCE_MS);
  });
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  replace.mockClear();
  getSearchResults.mockReset();
});

describe("SearchResults: when it asks", () => {
  it("asks for nothing without a search", async () => {
    show("destination=bali");
    await settle();
    expect(screen.getByText("Start a search")).toBeTruthy();
    expect(getSearchResults).not.toHaveBeenCalled();
  });

  it("asks nothing while a child has no age", async () => {
    show(`${DATED}&children=1`);
    await settle();
    expect(screen.getByText("Choose an age for each child")).toBeTruthy();
    expect(getSearchResults).not.toHaveBeenCalled();
  });

  it("shows a skeleton, then the count and the results, after one call", async () => {
    getSearchResults.mockResolvedValue(response([hotel(), hotel({ id: "b", title: "Second" })], 2));
    show(DATED);
    expect(screen.getByText("Searching…")).toBeTruthy();
    await settle();
    expect(getSearchResults).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText("2 results").length).toBeGreaterThan(0); // the count line, and the closed filters drawer's own live region
    expect(screen.getByText("Azure Spa")).toBeTruthy();
    expect(screen.queryByText("Choose your dates to see prices")).toBeNull();
  });

  it("sends the dates and travellers, and links each result to its page with them", async () => {
    getSearchResults.mockResolvedValue(response([hotel()]));
    show(DATED);
    await settle();
    expect(getSearchResults.mock.calls[0][0]).toMatchObject({ type: "hotel", stay: { checkIn: "2099-10-14", checkOut: "2099-10-21" }, guests: { adults: 2, rooms: 1 } });
    const href = screen.getByRole("link", { name: "Azure Spa" }).getAttribute("href") as string;
    expect(href.startsWith("/hotels/h/azure?")).toBe(true);
    expect(href).toContain("checkIn=2099-10-14");
    expect(href).toContain("adults=2");
  });
});

describe("SearchResults: dates and availability", () => {
  it("lists results without prices (and without a placeholder on the cards) and says to choose dates once, in the banner, when the URL has none", async () => {
    getSearchResults.mockResolvedValue(response([hotel({ price: undefined, availability: "unknown" })]));
    show("type=hotel");
    await settle();
    expect(getSearchResults.mock.calls[0][0].stay).toBeUndefined();
    expect(screen.getByText("Choose your dates to see prices")).toBeTruthy();
    expect(screen.queryByText("Select your dates to see prices")).toBeNull(); // no placeholder on a card: the banner above says it once
    expect(screen.queryByText("Not available for these dates")).toBeNull();
    expect(screen.getByRole("link", { name: "Azure Spa" }).getAttribute("href")).toBe("/hotels/h/azure");
  });

  it("says a result is not available for the dates only when the dates are valid", async () => {
    getSearchResults.mockResolvedValue(response([hotel({ price: undefined, availability: "unavailable" })]));
    show(DATED);
    await settle();
    expect(screen.getByText("Not available for these dates")).toBeTruthy();
  });
});

describe("SearchResults: empty and error", () => {
  it("offers to clear the filters when they leave nothing", async () => {
    getSearchResults.mockResolvedValue(response([]));
    show(`${DATED}&types=eco-lodge&page=2`);
    await settle();
    expect(screen.getByText("No results match your current filters.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear all filters" }));
    const url = replace.mock.calls[0][0] as string;
    expect(url.startsWith("/search?")).toBe(true);
    expect(url).not.toContain("types=");
    expect(url).not.toContain("page=");
    expect(url).toContain("checkIn=2099-10-14");
  });

  it("offers to clear the search too when there are no filters to clear", async () => {
    getSearchResults.mockResolvedValue(response([]));
    show(`${DATED}&destination=bali&q=yoga`);
    await settle();
    expect(screen.getByText(/No results match your search/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear all filters" }));
    const url = replace.mock.calls[0][0] as string;
    expect(url).not.toContain("destination=");
    expect(url).not.toContain("q=");
    expect(url).toContain("type=hotel");
    expect(url).toContain("checkIn=2099-10-14");
  });

  it("shows an error with a retry that asks again", async () => {
    getSearchResults.mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce(response([hotel()]));
    show(DATED);
    await settle();
    expect(screen.getByRole("alert").textContent).toContain("couldn't load the results");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    });
    expect(getSearchResults).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Azure Spa")).toBeTruthy();
  });
});

describe("SearchResults: the URL", () => {
  it("replaces the URL when a filter, the sort or the view changes, and goes back to page 1", async () => {
    getSearchResults.mockResolvedValue(response([hotel()], 30));
    show(`${DATED}&page=2`);
    await settle();
    fireEvent.click(screen.getAllByLabelText("Eco Lodge")[0]);
    expect(replace.mock.calls[0][0]).toContain("types=eco-lodge");
    expect(replace.mock.calls[0][0]).not.toContain("page=");
    fireEvent.change(screen.getByLabelText("Sort results"), { target: { value: "price-asc" } });
    expect(replace.mock.calls[1][0]).toContain("sort=price-asc");
    fireEvent.click(screen.getByRole("button", { name: "Grid" }));
    expect(replace.mock.calls[2][0]).toContain("view=grid");
  });

  it("keeps the page when only the view changes", async () => {
    getSearchResults.mockResolvedValue(response([hotel()], 30));
    show(`${DATED}&page=2`);
    await settle();
    fireEvent.click(screen.getByRole("button", { name: "Grid" }));
    expect(replace.mock.calls[0][0]).toContain("view=grid");
    expect(replace.mock.calls[0][0]).toContain("page=2");
  });

  it("keeps both edits when two are made before the URL has caught up", async () => {
    getSearchResults.mockResolvedValue(response([hotel()]));
    show(DATED);
    await settle();
    fireEvent.click(screen.getAllByLabelText("Eco Lodge")[0]);
    fireEvent.change(screen.getByLabelText("Sort results"), { target: { value: "top-rated" } });
    const second = replace.mock.calls[1][0] as string;
    expect(second).toContain("types=eco-lodge");
    expect(second).toContain("sort=top-rated");
  });

  it("shows the applied filters as chips and removes one", async () => {
    getSearchResults.mockResolvedValue(response([hotel()]));
    show(`${DATED}&types=eco-lodge&amenities=spa`);
    await settle();
    fireEvent.click(screen.getByRole("button", { name: "Remove filter: Eco Lodge" }));
    const url = replace.mock.calls[0][0] as string;
    expect(url).not.toContain("types=");
    expect(url).toContain("amenities=spa");
  });

  it("changes the page with the pager", async () => {
    getSearchResults.mockResolvedValue(response([hotel()], 30));
    show(DATED);
    await settle();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    fireEvent.click(screen.getByRole("button", { name: "Page 2" }));
    expect(replace.mock.calls[0][0]).toContain("page=2");
  });
});
