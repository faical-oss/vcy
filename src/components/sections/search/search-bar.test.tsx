// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
// The fixture is the real suggestion data: a test may read it, the component never does.
// eslint-disable-next-line no-restricted-imports
import { searchBoxFixture } from "@/mocks/fixtures/search";
import { SearchBar } from "./search-bar";
import { SearchProvider } from "./search-provider";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  push.mockClear();
});

const bar = () =>
  render(
    <SearchProvider>
      <SearchBar content={searchBoxFixture} />
    </SearchProvider>,
  );
const typeInput = () => screen.getAllByRole("combobox")[0] as HTMLInputElement;
const destinationInput = () => screen.getAllByRole("combobox")[1] as HTMLInputElement;

describe("SearchBar: structure", () => {
  it("has three tabs with Experiences selected, four fields, a Search button and the popular chips", () => {
    bar();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Experiences", "Packages", "Hotels"]);
    expect(screen.getByRole("tab", { name: "Experiences" }).getAttribute("aria-selected")).toBe("true");
    expect(typeInput().placeholder).toBe("Any experience");
    expect(destinationInput().placeholder).toBe("Anywhere");
    expect(screen.getByRole("button", { name: /When/ }).textContent).toMatch(/\d{1,2}–\d{1,2} \w{3} \d{4}|\d{1,2} \w{3} – \d{1,2} \w{3} \d{4}/); // tomorrow to two nights later, set on mount, as short as it can be written
    expect(screen.getByRole("button", { name: /Who/ }).textContent).toContain("1 traveller");
    expect(screen.getByRole("button", { name: /Search/ }).getAttribute("type")).toBe("submit");
    expect(within(screen.getByRole("group", { name: "Popular searches" })).getAllByRole("button").map((chip) => chip.textContent)).toEqual(["Yoga Retreats", "Bali", "Safari", "Cycling Tours", "Maldives", "Meditation"]);
  });

  it("swaps labels, lists and chips per tab, and resets the fields when the tab changes", async () => {
    const user = userEvent.setup();
    bar();
    await user.click(typeInput());
    await user.click(screen.getByRole("option", { name: "Cycling Tours" }));
    expect(typeInput().value).toBe("Cycling Tours");
    await user.click(screen.getByRole("tab", { name: "Packages" }));
    expect(typeInput().value).toBe("");
    expect(typeInput().placeholder).toBe("Any package");
    expect(within(screen.getByRole("group", { name: "Popular searches" })).getAllByRole("button")[0].textContent).toBe("Wellness");
    await user.click(screen.getByRole("tab", { name: "Hotels" }));
    expect(screen.getByRole("button", { name: /rooms and guests/ })).toBeTruthy(); // the visible label is "Who"
    expect(destinationInput().placeholder).toBe("City or hotel");
    await user.click(typeInput());
    expect(screen.getAllByRole("option")).toHaveLength(10);
  });

  it("moves between tabs with the arrow keys", async () => {
    const user = userEvent.setup();
    bar();
    screen.getByRole("tab", { name: "Experiences" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Packages" }));
    expect(screen.getByRole("tab", { name: "Packages" }).getAttribute("aria-selected")).toBe("true");
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Hotels" }));
  });
});

describe("SearchBar: the type combobox", () => {
  it("opens on focus with all 18 suggestions, filters while typing, and shows 'No results' when nothing matches", async () => {
    const user = userEvent.setup();
    bar();
    expect(typeInput().getAttribute("aria-expanded")).toBe("false");
    await user.click(typeInput());
    expect(typeInput().getAttribute("aria-expanded")).toBe("true");
    expect(screen.getAllByRole("option")).toHaveLength(18);
    await user.keyboard("yo");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Yoga Retreats", "Surf & Yoga"]);
    await user.keyboard("zzz");
    expect(screen.queryByRole("option")).toBeNull();
    expect(screen.getByText("No results for “yozzz”")).toBeTruthy();
  });

  it("picks with the mouse, closes, shows the value with a clear button, and clears only that field", async () => {
    const user = userEvent.setup();
    bar();
    await user.click(typeInput());
    await user.click(screen.getByRole("option", { name: "Yoga Retreats" }));
    expect(typeInput().value).toBe("Yoga Retreats");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(document.activeElement).toBe(typeInput()); // no auto-advance
    await user.click(destinationInput());
    await user.click(screen.getByRole("option", { name: "Maldives" }));
    await user.click(screen.getByRole("button", { name: "Clear destination" }));
    expect(destinationInput().value).toBe("");
    expect(typeInput().value).toBe("Yoga Retreats");
    expect(screen.getByRole("button", { name: "Clear experience type" })).toBeTruthy();
  });

  it("is keyboard operable: ArrowDown opens and moves, aria-activedescendant follows, Enter picks, Escape closes", async () => {
    const user = userEvent.setup();
    bar();
    typeInput().focus();
    await user.keyboard("{Escape}");
    expect(typeInput().getAttribute("aria-expanded")).toBe("false");
    await user.keyboard("{ArrowDown}");
    expect(typeInput().getAttribute("aria-expanded")).toBe("true");
    expect(typeInput().getAttribute("role")).toBe("combobox");
    await user.keyboard("{ArrowDown}{ArrowDown}");
    const activeId = typeInput().getAttribute("aria-activedescendant")!;
    expect(document.getElementById(activeId)?.textContent).toBe("Wellness & Spa");
    expect(document.getElementById(activeId)?.getAttribute("aria-selected")).toBe("true");
    await user.keyboard("{ArrowUp}");
    expect(document.getElementById(typeInput().getAttribute("aria-activedescendant")!)?.textContent).toBe("Yoga Retreats");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(typeInput().value).toBe("Wellness & Spa");
    expect(typeInput().getAttribute("aria-expanded")).toBe("false");
    expect(push).not.toHaveBeenCalled(); // Enter on an option picks it, it does not submit
  });

  it("closes on Escape and on a click outside, and on Tab out of the field", async () => {
    const user = userEvent.setup();
    bar();
    await user.click(typeInput());
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
    await user.click(typeInput());
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("listbox")).toBeNull();
    await user.click(typeInput());
    await user.tab(); // focus moves to the destination field, which opens its own list
    expect(typeInput().getAttribute("aria-expanded")).toBe("false");
    expect(destinationInput().getAttribute("aria-expanded")).toBe("true");
  });
});

describe("SearchBar: the destination combobox", () => {
  it("lists four groups in two columns, filters across groups, and picks", async () => {
    const user = userEvent.setup();
    bar();
    await user.click(destinationInput());
    expect(screen.getAllByRole("option")).toHaveLength(17);
    for (const title of ["Popular", "Europe", "Asia", "Further afield"]) expect(screen.getByText(title)).toBeTruthy();
    await user.keyboard("ital");
    expect(screen.getByRole("status", { name: "Searching" })).toBeTruthy(); // skeleton rows while the "request" runs
    expect(screen.queryByRole("option")).toBeNull();
    // Results are one plain list of the matches: no region titles.
    expect((await screen.findAllByRole("option")).map((option) => option.textContent)).toEqual(["Tuscany, Italy", "Amalfi, Italy"]);
    expect(screen.queryByText("Europe")).toBeNull();
    expect(screen.queryByRole("status", { name: "Searching" })).toBeNull();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(destinationInput().value).toBe("Tuscany, Italy");
  });
});

describe("SearchBar: popovers", () => {
  it("opens one popover at a time: dates, then travellers closes the dates", async () => {
    const user = userEvent.setup();
    bar();
    await user.click(screen.getByRole("button", { name: /When/ }));
    expect(await screen.findByRole("dialog", { name: "Choose your dates" })).toBeTruthy();
    await user.click(typeInput());
    expect(screen.queryByRole("dialog", { name: "Choose your dates" })).toBeNull();
    await user.click(screen.getByRole("button", { name: /Who/ }));
    expect(await screen.findByRole("dialog", { name: "Rooms and guests" })).toBeTruthy();
    expect(screen.queryByRole("listbox")).toBeNull();
    await user.click(screen.getByRole("button", { name: /When/ }));
    expect(await screen.findByRole("dialog", { name: "Choose your dates" })).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: "Rooms and guests" })).toBeNull();
  });

  it("closes a popover on Escape, returning focus to its field, and on a click outside", async () => {
    const user = userEvent.setup();
    bar();
    const guests = screen.getByRole("button", { name: /Who/ });
    await user.click(guests);
    await screen.findByRole("dialog", { name: "Rooms and guests" });
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(guests);
    await user.click(guests);
    await screen.findByRole("dialog", { name: "Rooms and guests" });
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("travellers: 44px steppers, child ages with no default, and the summary counts adults plus children", async () => {
    const user = userEvent.setup();
    bar();
    await user.click(screen.getByRole("button", { name: /Who/ }));
    const dialog = await screen.findByRole("dialog", { name: "Rooms and guests" });
    expect(within(dialog).getByRole("button", { name: "More adults" }).className).toContain("size-11");
    await user.click(within(dialog).getByRole("button", { name: "More adults" }));
    await user.click(within(dialog).getByRole("button", { name: "More children" }));
    expect((within(dialog).getByLabelText("Child 1") as HTMLSelectElement).value).toBe("");
    await user.click(within(dialog).getByRole("button", { name: "Done" }));
    expect(screen.getByRole("button", { name: /Who/ }).textContent).toContain("3 travellers");
  });

  it("dates: a range shows in the field, Clear empties it, and the flexibility chips are there", async () => {
    const user = userEvent.setup();
    bar();
    const defaultText = screen.getByRole("button", { name: /When/ }).textContent;
    await user.click(screen.getByRole("button", { name: /When/ }));
    const dialog = await screen.findByRole("dialog", { name: "Choose your dates" });
    expect(within(dialog).getAllByRole("button", { pressed: false }).some((chip) => chip.textContent === "± 2 days")).toBe(true);
    const days = within(dialog).getAllByRole("button").filter((button) => button.hasAttribute("data-day") && !(button as HTMLButtonElement).disabled);
    await user.click(days[3]);
    await user.click(days[8]);
    // A short range: "27 Nov–2 Dec 2026" or "5–9 Dec 2026", never two long dates.
    expect(screen.getByRole("button", { name: /When/ }).textContent).toMatch(/\d{1,2}( \w{3})?–\d{1,2} \w{3} \d{4}/);
    await user.click(within(dialog).getByRole("button", { name: "Clear" })); // back to the default stay, never empty
    expect(screen.getByRole("button", { name: /When/ }).textContent).toBe(defaultText);
  });
});

describe("SearchBar: popular chips and search", () => {
  it("a chip fills its field without submitting, replaces another of the same kind, and its pressed state follows the value", async () => {
    const user = userEvent.setup();
    bar();
    const chip = (name: string) => within(screen.getByRole("group", { name: "Popular searches" })).getByRole("button", { name });
    await user.click(chip("Bali"));
    expect(destinationInput().value).toBe("Bali");
    expect(chip("Bali").getAttribute("aria-pressed")).toBe("true");
    await user.click(chip("Maldives"));
    expect(destinationInput().value).toBe("Maldives");
    expect(chip("Bali").getAttribute("aria-pressed")).toBe("false");
    await user.click(chip("Yoga Retreats"));
    expect(typeInput().value).toBe("Yoga Retreats");
    expect(push).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Clear destination" }));
    expect(chip("Maldives").getAttribute("aria-pressed")).toBe("false"); // derived from the value, not sticky
  });

  it("Search is always enabled and goes to the one search URL, also with nothing filled in", async () => {
    const user = userEvent.setup();
    bar();
    await user.click(screen.getByRole("button", { name: /Search/ }));
    expect(push).toHaveBeenLastCalledWith(expect.stringMatching(/^\/search\?type=experience&checkIn=\d{4}-\d\d-\d\d&checkOut=\d{4}-\d\d-\d\d$/));
    await user.click(within(screen.getByRole("group", { name: "Popular searches" })).getByRole("button", { name: "Bali" }));
    await user.click(screen.getByRole("button", { name: /Search/ }));
    expect(push).toHaveBeenLastCalledWith(expect.stringMatching(/^\/search\?type=experience&destination=bali&checkIn=\d{4}-\d\d-\d\d&checkOut=\d{4}-\d\d-\d\d$/));
  });
});

describe("SearchBar: the picked option", () => {
  it("is shown in the selected colour in the type list and in the destination list", async () => {
    const user = userEvent.setup();
    bar();
    await user.click(typeInput());
    await user.click(screen.getByRole("option", { name: "Cycling Tours" }));
    await user.click(destinationInput());
    await user.click(screen.getByRole("option", { name: "Maldives" }));
    await user.click(typeInput());
    expect(screen.getByRole("option", { name: "Cycling Tours" }).className).toContain("bg-primary");
    expect(screen.getByRole("option", { name: "Yoga Retreats" }).className).not.toContain("bg-primary");
    await user.click(destinationInput());
    expect(screen.getByRole("option", { name: "Maldives" }).className).toContain("bg-primary");
  });

  it("keeps the dates when the tab changes", async () => {
    const user = userEvent.setup();
    bar();
    // The hidden part of the name differs per tab ("(dates)", "(check-in and check-out)"): compare what follows it.
    const value = (button: HTMLElement) => button.textContent!.replace(/^[^)]*\)/, "");
    const dates = value(screen.getByRole("button", { name: /When/ }));
    await user.click(screen.getByRole("tab", { name: "Hotels" }));
    expect(value(screen.getByRole("button", { name: /When/ }))).toBe(dates);
  });
});
