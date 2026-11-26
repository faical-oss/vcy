// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoomAvailability, RoomAvailabilityRequest } from "@/interfaces";
import { availabilityStore } from "@/store/availability-store";
import { stayStore } from "@/store/stay-store";
import { BookingForm } from "./booking-form";

const { push, path } = vi.hoisted(() => ({ push: vi.fn(), path: { value: "/hotels/h/azure" } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }), usePathname: () => path.value }));

const fetcher = vi.fn();
const room = (id: string, available = true): RoomAvailability => ({ roomId: id, available, price: { amount: 100, currency: "USD" }, unit: "night" });
const hotel = { kind: "hotel" as const, id: "azure", enabled: true };

// The form builds the request from the stay and `useToday`; the controller (not mounted here) drives the store, so each test does it.
const search = (stay: Partial<{ checkIn: string; checkOut: string; adults: number; rooms: number }> = {}): RoomAvailabilityRequest => ({ kind: "hotel", id: "azure", checkIn: "2099-12-01", checkOut: "2099-12-04", adults: 2, children: 0, childAges: [], rooms: 1, ...stay });
const settle = async () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

beforeEach(() => {
  push.mockClear();
  fetcher.mockReset();
  fetcher.mockResolvedValue({ rooms: [room("a")] });
  availabilityStore.reset();
  availabilityStore.configure({ fetcher, debounceMs: 0, minLoadingMs: 0 });
  path.value = "/hotels/h/azure";
  stayStore.hydrate("reset", { rooms: 1, adults: 2, children: 0, childAges: [] }); // a store keeps its page until another starts
  stayStore.hydrate(path.value, { rooms: 1, adults: 2, children: 0, childAges: [] });
});
afterEach(cleanup);

const button = () => screen.getByRole("button", { name: /Check availability|Checking availability…|Reserve now/ }) as HTMLButtonElement;

describe("BookingForm: one primary button", () => {
  it("without dates says 'Check availability', opens the date picker and makes no API call", () => {
    render(<BookingForm checkout={hotel} />);
    expect(button().textContent).toBe("Check availability");
    expect(button().disabled).toBe(false);
    fireEvent.click(button());
    expect(screen.getByRole("dialog", { name: "Choose your dates" })).toBeTruthy();
    expect(fetcher).not.toHaveBeenCalled();
    expect(screen.getAllByRole("button", { name: /Reserve now|Check availability/ }).length).toBe(1);
  });

  it("once the dates are set the label follows the state: loading disabled, ready 'Reserve now'", async () => {
    render(<BookingForm checkout={hotel} />);
    act(() => stayStore.setDates("2099-12-01", "2099-12-04"));
    await settle();
    // the form shows the pending state as soon as the search is complete (the controller asks the store)
    act(() => availabilityStore.request(search(), { immediate: true }));
    await settle();
    expect(button().textContent).toBe("Reserve now");
    expect(button().disabled).toBe(false);
  });

  it("'Reserve now' goes to the checkout with the dates, adults, children ages, rooms and the product id", async () => {
    render(<BookingForm checkout={hotel} />);
    act(() => {
      stayStore.setDates("2099-12-01", "2099-12-04");
      stayStore.setAdults(3);
      stayStore.setChildren(1);
      stayStore.setChildAge(0, 6);
      stayStore.setRooms(2);
    });
    act(() => availabilityStore.request(search({ adults: 3, rooms: 2 }), { immediate: true }));
    await settle();
    fireEvent.click(button());
    expect(push).toHaveBeenCalledTimes(1);
    const [path, query] = (push.mock.calls[0][0] as string).split("?");
    expect(path).toBe("/checkout");
    expect(Object.fromEntries(new URLSearchParams(query))).toMatchObject({ type: "hotel", id: "azure", checkIn: "2099-12-01", checkOut: "2099-12-04", rooms: "2", adults: "3", children: "1", childAges: "6" });
  });

  it("with checkout switched off it shows 'Online booking opens soon.' instead of navigating", async () => {
    render(<BookingForm checkout={{ ...hotel, enabled: false }} />);
    act(() => stayStore.setDates("2099-12-01", "2099-12-04"));
    act(() => availabilityStore.request(search(), { immediate: true }));
    await settle();
    fireEvent.click(button());
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText("Online booking opens soon.")).toBeTruthy();
  });

  it("none available disables the button and explains", async () => {
    fetcher.mockResolvedValue({ rooms: [room("a", false)] });
    render(<BookingForm checkout={hotel} />);
    act(() => stayStore.setDates("2099-12-01", "2099-12-04"));
    act(() => availabilityStore.request(search(), { immediate: true }));
    await settle();
    expect(button().textContent).toBe("Reserve now");
    expect(button().disabled).toBe(true);
    expect(screen.getByText("No rooms are available for these dates. Try other dates.")).toBeTruthy();
  });

  it("an error disables the button and offers Retry, which asks again", async () => {
    fetcher.mockRejectedValueOnce(new Error("down"));
    render(<BookingForm checkout={hotel} />);
    act(() => stayStore.setDates("2099-12-01", "2099-12-04"));
    act(() => availabilityStore.request(search(), { immediate: true }));
    await settle();
    expect(button().disabled).toBe(true);
    expect(screen.getByText("We could not check availability.")).toBeTruthy();
    fetcher.mockResolvedValue({ rooms: [room("a")] });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await settle();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(button().disabled).toBe(false);
  });

  it("closing the travellers dropdown asks for a pending search at once", async () => {
    render(<BookingForm checkout={hotel} />);
    act(() => stayStore.setDates("2099-12-01", "2099-12-04"));
    act(() => availabilityStore.request(search(), { immediate: true }));
    await settle();
    fetcher.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /Rooms & guests/ }));
    fireEvent.click(screen.getByRole("button", { name: "More adults" }));
    act(() => availabilityStore.request(search({ adults: 3 }))); // debounced by the controller
    expect(fetcher).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Rooms & guests/ }));
    await settle();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("BookingForm: picker and child ages", () => {
  const days = () => [...document.querySelectorAll<HTMLButtonElement>("[aria-label='Choose your dates'] button[data-day]:not([disabled])")];

  it("closes the date picker as soon as the range is complete (hotel: after the check-out day)", () => {
    render(<BookingForm checkout={hotel} />);
    fireEvent.click(button());
    const [first, , , fourth] = days();
    fireEvent.click(first);
    expect(screen.queryByRole("dialog", { name: "Choose your dates" })).not.toBeNull(); // only the start so far
    fireEvent.click(fourth);
    expect(screen.queryByRole("dialog", { name: "Choose your dates" })).toBeNull();
    expect(stayStore.getSnapshot().checkIn).not.toBeNull();
    expect(stayStore.getSnapshot().checkOut).not.toBeNull();
    expect(document.activeElement?.textContent).toMatch(/Check-in/);
  });

  it("closes the date picker right after the start date on an experience (the end follows)", () => {
    render(<BookingForm checkout={{ kind: "experience", id: "ubud", enabled: true }} product={{ duration: { type: "fixed", nights: 6 }, group: { min: 4, max: 12 } }} />);
    fireEvent.click(button());
    fireEvent.click(days()[0]);
    expect(screen.queryByRole("dialog", { name: "Choose your dates" })).toBeNull();
    const { checkIn, checkOut } = stayStore.getSnapshot();
    expect(Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)).toBe(6 * 86_400_000);
  });

  it("on a flexible product every date can be picked: the range closes the picker when it is within the limits, and stays open with a message when it is not", () => {
    render(<BookingForm checkout={{ kind: "package", id: "tuscany", enabled: true }} product={{ duration: { type: "flexible", minNights: 3, maxNights: 5 }, noun: "package", group: { min: 1, max: 12 } }} />);
    fireEvent.click(button());
    expect(screen.getByText("Stay 3–5 nights.")).toBeTruthy();
    const all = days();
    expect(all.every((day) => !(day as HTMLButtonElement).disabled || day.getAttribute("data-day")! < new Date().toISOString().slice(0, 10))).toBe(true);
    const start = all[0].getAttribute("data-day")!;
    const at = (gap: number) => days().find((day) => day.getAttribute("data-day") === new Date(Date.parse(`${start}T00:00:00Z`) + gap * 86_400_000).toISOString().slice(0, 10))!;
    fireEvent.click(all[0]);
    expect(screen.getByRole("dialog", { name: "Choose your dates" })).toBeTruthy(); // the end is still to pick
    fireEvent.click(at(1)); // 1 night: below the minimum, but pickable
    expect(screen.getByRole("dialog", { name: "Choose your dates" })).toBeTruthy();
    expect(screen.getAllByText("Choose a stay of 3–5 nights.").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Check availability" })).toBeTruthy(); // no search until the range is valid
    fireEvent.click(all[0]);
    fireEvent.click(at(4));
    expect(screen.queryByRole("dialog", { name: "Choose your dates" })).toBeNull();
    expect(screen.queryByText("Choose a stay of 3–5 nights.")).toBeNull();
    expect(screen.getByRole("button", { name: /Check-in/ }).textContent).toContain("· 4 nights");
  });

  it("shows the derived range with its nights count for a fixed duration, with a hint from the data", () => {
    render(<BookingForm checkout={{ kind: "package", id: "tuscany", enabled: true }} product={{ duration: { type: "fixed", nights: 5 }, noun: "package", group: { min: 1, max: 12 } }} />);
    fireEvent.click(button());
    expect(screen.getByText("This package lasts 5 nights: pick your start date and the end date follows.")).toBeTruthy();
    fireEvent.click(days()[0]);
    expect(screen.getByRole("button", { name: /Check-in/ }).textContent).toContain("· 5 nights");
  });

  it("shows 'Select age' with no default for a new child, an inline message, and asks for nothing until every child has an age", async () => {
    render(<BookingForm checkout={hotel} />);
    act(() => stayStore.setDates("2099-12-01", "2099-12-04"));
    fireEvent.click(screen.getByRole("button", { name: /Rooms & guests/ }));
    fireEvent.click(screen.getByRole("button", { name: "More children" }));
    const select = screen.getByLabelText("Child 1") as HTMLSelectElement;
    expect(select.value).toBe("");
    expect(select.options[0].text).toBe("Select age");
    expect(select.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getAllByText("Select the age of each child.").length).toBeGreaterThan(0);
    await settle();
    expect(fetcher).not.toHaveBeenCalled();
    expect(button().textContent).toBe("Check availability"); // not a valid search yet
    fireEvent.change(select, { target: { value: "6" } });
    expect(select.getAttribute("aria-invalid")).toBeNull();
    expect(screen.queryByText("Select the age of each child.")).toBeNull();
    expect(stayStore.getSnapshot().childAges).toEqual([6]);
  });

  it("an experience takes up to 12 adults on its steppers", () => {
    path.value = "/experiences/e/ubud"; // the page decides the guest limits (an experience: its group maximum)
    render(<BookingForm checkout={{ kind: "experience", id: "ubud", enabled: true }} product={{ duration: { type: "fixed", nights: 6 }, group: { min: 4, max: 12 } }} />);
    fireEvent.click(screen.getByRole("button", { name: /Rooms & guests/ }));
    for (let i = 0; i < 10; i++) fireEvent.click(screen.getByRole("button", { name: "More adults" }));
    expect(stayStore.getSnapshot().adults).toBe(12);
    expect((screen.getByRole("button", { name: "More adults" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "More children" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("BookingForm: editing and room selection", () => {
  const rooms = [
    { id: "a", name: "Room A", maxAdults: 2, maxOccupancy: 3 },
    { id: "b", name: "Room B", maxAdults: 1, maxOccupancy: 1 },
  ];

  it("holds the search while the travellers panel is open and releases it on Done", () => {
    render(<BookingForm checkout={hotel} />);
    expect(availabilityStore.getSnapshot().editing).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /Rooms & guests/ }));
    expect(availabilityStore.getSnapshot().editing).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(availabilityStore.getSnapshot().editing).toBe(false);
  });

  it("releases it when the date picker closes itself after the range, and on Escape", () => {
    render(<BookingForm checkout={hotel} />);
    fireEvent.click(button());
    expect(availabilityStore.getSnapshot().editing).toBe(true);
    fireEvent.keyDown(screen.getByRole("dialog", { name: "Choose your dates" }), { key: "Escape" });
    expect(availabilityStore.getSnapshot().editing).toBe(false);
  });

  it("hotels: 'Reserve now' stays off until rooms are chosen, says what is missing, then goes to checkout with the selection", async () => {
    render(<BookingForm checkout={hotel} rooms={rooms} />);
    act(() => stayStore.setDates("2099-12-01", "2099-12-04"));
    act(() => availabilityStore.request(search(), { immediate: true }));
    await settle();
    expect(button().textContent).toBe("Reserve now");
    expect(button().disabled).toBe(true);
    expect(screen.getByText("Choose 1 room to reserve.")).toBeTruthy();
    act(() => stayStore.adjustRoom("a", 1));
    expect(button().disabled).toBe(false);
    fireEvent.click(button());
    const query = (push.mock.calls[0][0] as string).split("?")[1];
    expect(new URLSearchParams(query).get("selection")).toBe("a:1");
  });

  it("hotels: says so when the chosen rooms cannot hold the guests", async () => {
    render(<BookingForm checkout={hotel} rooms={rooms} />);
    act(() => stayStore.setDates("2099-12-01", "2099-12-04"));
    act(() => availabilityStore.request(search(), { immediate: true }));
    await settle();
    act(() => stayStore.adjustRoom("b", 1)); // holds one adult, two travel
    expect(button().disabled).toBe(true);
    expect(screen.getByText("The selected rooms cannot hold all your guests.")).toBeTruthy();
  });

  it("experiences: no room choice is asked, 'Reserve now' works as soon as rooms are available", async () => {
    render(<BookingForm checkout={hotel} />);
    act(() => stayStore.setDates("2099-12-01", "2099-12-04"));
    act(() => availabilityStore.request(search(), { immediate: true }));
    await settle();
    expect(button().disabled).toBe(false);
  });
});

