// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
// The fixture is the real suggestion data: a test may read it, the component never does.
// eslint-disable-next-line no-restricted-imports
import { searchBoxFixture } from "@/mocks/fixtures/search";
import { SearchProvider } from "../search-provider";
import { FiltersDrawer } from "./filters-drawer";
import { readSearchFromSearch } from "@/helpers/search-box";
import { searchLabelFor } from "../docked-search";
import { SearchPill, pillSummary } from "../search-pill";
import { ResultsPager } from "./results-pager";

let search = "";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), useSearchParams: () => new URLSearchParams(search) }));

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(cleanup);

describe("FiltersDrawer", () => {
  it("moves focus in, closes with Esc and the dimmed area, locks the page scroll, and gives focus back", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <>
        <button>Filters</button>
        <FiltersDrawer open={false} onClose={onClose} onClear={vi.fn()} count={4}>
          <p>groups</p>
        </FiltersDrawer>
      </>,
    );
    const opener = screen.getByRole("button", { name: "Filters" });
    opener.focus();
    expect(screen.getByRole("dialog", { hidden: true }).closest("[inert]")).not.toBeNull(); // inert while shut: out of the tab order and the accessibility tree
    rerender(
      <>
        <button>Filters</button>
        <FiltersDrawer open onClose={onClose} onClear={vi.fn()} count={4}>
          <p>groups</p>
        </FiltersDrawer>
      </>,
    );
    expect(screen.getByRole("dialog", { name: "Filters" }).closest("[inert]")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close filters" }));
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(screen.getByRole("button", { name: "Show 4 results" })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(
      <>
        <button>Filters</button>
        <FiltersDrawer open={false} onClose={onClose} onClear={vi.fn()} count={4}>
          <p>groups</p>
        </FiltersDrawer>
      </>,
    );
    expect(document.documentElement.style.overflow).toBe("");
    expect(document.activeElement).toBe(opener);
  });

  it("announces the count politely and stays open while the count changes", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <FiltersDrawer open onClose={onClose} onClear={vi.fn()} count={12}>
        <input aria-label="inside" />
      </FiltersDrawer>,
    );
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toBe("12 results");
    rerender(
      <FiltersDrawer open onClose={onClose} onClear={vi.fn()} count={1}>
        <input aria-label="inside" />
      </FiltersDrawer>,
    );
    expect(status.textContent).toBe("1 result");
    rerender(
      <FiltersDrawer open onClose={onClose} onClear={vi.fn()} count={null}>
        <input aria-label="inside" />
      </FiltersDrawer>,
    );
    expect(status.textContent).toBe("Updating results");
    expect(onClose).not.toHaveBeenCalled(); // a change of the results never closes it
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeTruthy();
  });

  it("keeps Tab inside the panel", () => {
    render(
      <FiltersDrawer open onClose={vi.fn()} onClear={vi.fn()} count={null}>
        <input aria-label="inside" />
      </FiltersDrawer>,
    );
    const last = screen.getByRole("button", { name: "Show results" });
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Clear all" }));
  });
});

describe("SearchPill (the pill at every width, below xl)", () => {
  it("summarises the search in one pill and opens the whole search as a sheet on a tap", () => {
    search = "type=hotel&destination=santorini-greece&checkIn=2099-10-14&checkOut=2099-10-21&adults=2";
    render(
      <SearchProvider>
        <SearchPill content={searchBoxFixture} summary={pillSummary(readSearchFromSearch(search, searchLabelFor(searchBoxFixture))!)} />
      </SearchProvider>,
    );
    const pill = screen.getByRole("button", { name: /^Edit search/ });
    expect(pill.textContent).toContain("Santorini, Greece");
    expect(pill.textContent).toContain("14–21 Oct 2099 · 2 travellers");
    fireEvent.click(pill);
    const sheet = screen.getByRole("dialog");
    expect(within(sheet).getByRole("search")).toBeTruthy();
    expect(within(sheet).queryByRole("group", { name: "Popular searches" })).toBeNull();
    expect(within(sheet).getByRole("button", { name: "Search" })).toBeTruthy();
    fireEvent.click(within(sheet).getByRole("button", { name: "Close search" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: /^Edit search/ })).toBeTruthy();
  });
});

describe("ResultsPager", () => {
  it("says which results are shown and marks the current page", () => {
    const onPage = vi.fn();
    render(<ResultsPager page={2} total={30} pageSize={12} onPage={onPage} />);
    expect(screen.getByText("Showing 13–24 of 30 results")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Page 2" }).getAttribute("aria-current")).toBe("page");
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPage).toHaveBeenCalledWith(3);
  });

  it("has no page numbers for a single page", () => {
    render(<ResultsPager page={1} total={1} pageSize={12} onPage={vi.fn()} />);
    expect(screen.getByText("Showing 1–1 of 1 result")).toBeTruthy();
    expect(screen.queryByRole("navigation")).toBeNull();
  });
});
