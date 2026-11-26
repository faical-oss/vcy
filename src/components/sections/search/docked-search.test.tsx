// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
// The fixture is the real suggestion data: a test may read it, the component never does.
// eslint-disable-next-line no-restricted-imports
import { searchBoxFixture } from "@/mocks/fixtures/search";
import { DockedSearch, SearchUrlPrefill } from "./docked-search";
import { SearchBar } from "./search-bar";
import { SearchProvider } from "./search-provider";

let pathname = "/";
let query = "";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => pathname, useSearchParams: () => new URLSearchParams(query) }));

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  pathname = "/";
  query = "";
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
});

const scrollTo = (y: number) =>
  act(() => {
    Object.defineProperty(window, "scrollY", { value: y, configurable: true });
    window.dispatchEvent(new Event("scroll"));
  });
const bar = () => screen.queryByRole("search", { name: "Quick search", hidden: true });
const docked = () =>
  render(
    <SearchProvider>
      <DockedSearch content={searchBoxFixture} />
      <SearchUrlPrefill content={searchBoxFixture} />
    </SearchProvider>,
  );

describe("DockedSearch", () => {
  it("is in the page but out of reach until the page scrolls past ~320px, then slides in", () => {
    docked();
    expect(bar()!.closest("[inert]")).not.toBeNull();
    expect(document.documentElement.hasAttribute("data-docked-search")).toBe(false);
    scrollTo(300);
    expect(bar()!.closest("[inert]")).not.toBeNull();
    scrollTo(340);
    expect(bar()!.closest("[inert]")).toBeNull();
    expect(document.documentElement.hasAttribute("data-docked-search")).toBe(true);
    scrollTo(0);
    expect(document.documentElement.hasAttribute("data-docked-search")).toBe(false);
  });

  it("is there from the top on the results page", () => {
    pathname = "/search";
    docked();
    expect(bar()!.closest("[inert]")).toBeNull();
    expect(document.documentElement.hasAttribute("data-docked-search")).toBe(true);
  });

  it.each(["/account/trips", "/support", "/checkout"])("is not rendered on %s, whatever the scroll", (path) => {
    pathname = path;
    docked();
    scrollTo(1000);
    expect(bar()).toBeNull();
    expect(document.documentElement.hasAttribute("data-docked-search")).toBe(false);
  });

  it.each(["/hotels/h/some-hotel", "/experiences/e/some-experience", "/packages/p/some-package"])("is there from the top on the detail page %s", (path) => {
    pathname = path;
    docked();
    expect(bar()!.closest("[inert]")).toBeNull();
    expect(document.documentElement.hasAttribute("data-docked-search")).toBe(true);
  });

  it("clears the page offset when it unmounts", () => {
    pathname = "/search";
    const view = docked();
    view.unmount();
    expect(document.documentElement.hasAttribute("data-docked-search")).toBe(false);
  });

  it("shares its state with the hero box: a destination picked in one shows in the other", async () => {
    const user = userEvent.setup();
    render(
      <SearchProvider>
        <SearchBar content={searchBoxFixture} />
        <DockedSearch content={searchBoxFixture} />
      </SearchProvider>,
    );
    const [, heroDestination, , dockedDestination] = screen.getAllByRole("combobox", { hidden: true }) as HTMLInputElement[];
    await user.click(heroDestination);
    await user.click(screen.getByRole("option", { name: "Maldives" }));
    expect(dockedDestination.value).toBe("Maldives");
  });
});

describe("SearchUrlPrefill", () => {
  it("on the results page the URL fills the bar: tab, picked options, dates and guests", () => {
    pathname = "/search";
    query = "type=hotel&destination=bali-indonesia&checkIn=2099-10-14&checkOut=2099-10-21&adults=2";
    docked();
    const destination = screen.getAllByRole("combobox")[1] as HTMLInputElement;
    expect(destination.value).toBe("Bali, Indonesia");
    expect(screen.getByRole("tab", { name: "Hotels", selected: true })).toBeTruthy();
    expect(screen.getByRole("button", { name: /When/ }).textContent).toContain("14–21 Oct 2099");
    expect(screen.getByRole("button", { name: /Who/ }).textContent).toContain("2 travellers");
  });

  it("keeps the dates of the URL (the default dates only fill an empty bar)", () => {
    pathname = "/search";
    query = "type=experience&checkIn=2099-01-05&checkOut=2099-01-09";
    docked();
    expect(screen.getByRole("button", { name: /When/ }).textContent).toContain("5–9 Jan 2099");
  });

  it("leaves the bar alone on other pages and for a query without a valid type", () => {
    query = "type=hotel&destination=bali-indonesia"; // on Home
    docked();
    expect((screen.getAllByRole("combobox", { hidden: true })[1] as HTMLInputElement).value).toBe("");
    cleanup();
    pathname = "/search";
    query = "type=nonsense&destination=bali-indonesia";
    docked();
    expect((screen.getAllByRole("combobox")[1] as HTMLInputElement).value).toBe("");
  });
});
