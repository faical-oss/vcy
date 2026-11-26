// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoomAvailability, RoomAvailabilityRequest } from "@/interfaces";
import { availabilityStore } from "@/store/availability-store";
import { stayStore } from "@/store/stay-store";
import { MobileBookingBar } from "./mobile-booking-bar";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }), usePathname: () => "/hotels/h/azure" }));

const fetcher = vi.fn();
const answer = (available: boolean): RoomAvailability => ({ roomId: "a", available, price: { amount: 100, currency: "USD" }, unit: "night" });
const request: RoomAvailabilityRequest = { kind: "hotel", id: "azure", checkIn: "2099-12-01", checkOut: "2099-12-04", adults: 2, children: 0, childAges: [], rooms: 1 };
const settle = async () => act(async () => { await Promise.resolve(); await Promise.resolve(); });
const bar = (enabled = true) => (
  <MobileBookingBar hash="booking" label="Book this hotel" booking={{ checkout: { kind: "hotel", id: "azure", enabled } }}>
    <p>the booking box</p>
  </MobileBookingBar>
);
const barButton = () => screen.getByRole("button", { name: /Select dates|Checking…|Reserve now/ }) as HTMLButtonElement;

beforeEach(() => {
  push.mockClear();
  fetcher.mockReset();
  fetcher.mockResolvedValue({ rooms: [answer(true)] });
  availabilityStore.reset();
  availabilityStore.configure({ fetcher, debounceMs: 0, minLoadingMs: 0 });
  stayStore.hydrate("/hotels/h/azure", { rooms: 1, adults: 2, children: 0, childAges: [] });
});
afterEach(cleanup);

describe("MobileBookingBar button follows the booking card's state", () => {
  it("'Select dates' without a search: opens the sheet and marks the search to reveal the Rooms tab", () => {
    render(bar());
    expect(barButton().textContent).toBe("Select dates");
    fireEvent.click(barButton());
    expect(screen.getByText("the booking box")).toBeTruthy();
    expect(availabilityStore.getSnapshot().revealPending).toBe(true);
    expect(availabilityStore.getSnapshot().revealHeld).toBe(true); // the sheet is open
  });

  it("holds the reveal while the sheet is open and releases it when it closes", () => {
    render(bar());
    fireEvent.click(barButton());
    expect(availabilityStore.getSnapshot().revealHeld).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Close booking" }));
    expect(availabilityStore.getSnapshot().revealHeld).toBe(false);
  });

  it("is disabled while loading, then 'Reserve now' goes to the checkout with the stay", async () => {
    render(bar());
    act(() => stayStore.setDates("2099-12-01", "2099-12-04"));
    act(() => availabilityStore.request(request, { immediate: true }));
    expect(barButton().textContent).toBe("Checking…");
    expect(barButton().disabled).toBe(true);
    await settle();
    expect(barButton().textContent).toBe("Reserve now");
    expect(barButton().disabled).toBe(false);
    fireEvent.click(barButton());
    expect(push).toHaveBeenCalledTimes(1);
    expect(String(push.mock.calls[0][0])).toContain("/checkout?");
    expect(screen.queryByText("the booking box")).toBeNull(); // it did not open the sheet
  });

  it("is a disabled 'Reserve now' when no room is available", async () => {
    fetcher.mockResolvedValue({ rooms: [answer(false)] });
    render(bar());
    act(() => stayStore.setDates("2099-12-01", "2099-12-04"));
    act(() => availabilityStore.request(request, { immediate: true }));
    await settle();
    expect(barButton().textContent).toBe("Reserve now");
    expect(barButton().disabled).toBe(true);
  });

  it("with no checkout it opens the sheet instead of navigating", async () => {
    render(bar(false));
    act(() => stayStore.setDates("2099-12-01", "2099-12-04"));
    act(() => availabilityStore.request(request, { immediate: true }));
    await settle();
    fireEvent.click(barButton());
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText("the booking box")).toBeTruthy();
  });
});

describe("MobileBookingBar summary button", () => {
  const withDates = async (checkOutOk = true) => {
    render(bar());
    act(() => stayStore.setDates("2099-12-01", checkOutOk ? "2099-12-04" : null));
    act(() => availabilityStore.request(request, { immediate: true }));
    await settle();
  };
  const summaryButton = () => document.querySelector("[data-booking-summary]") as HTMLButtonElement;

  it("shows the dates, the travellers and the lowest price, and is one button", async () => {
    await withDates();
    expect(summaryButton().tagName).toBe("BUTTON");
    expect(summaryButton().textContent).toContain("1–4 Dec");
    expect(summaryButton().textContent).toContain("2 travellers");
    expect(document.querySelector("[data-booking-price]")!.textContent).toContain("From $100 per night");
  });

  it("its accessible name starts with its visible text and ends with 'Change dates and guests' (not an aria-label that leaves the text out)", async () => {
    await withDates();
    const visible = summaryButton().textContent!.replace(/\s+/g, " ").replace(/\. Change dates and guests$/, "").trim();
    expect(summaryButton().hasAttribute("aria-label")).toBe(false);
    const name = screen.getByRole("button", { name: /Change dates and guests/ }).textContent!.replace(/\s+/g, " ").trim();
    expect(name.startsWith(visible)).toBe(true);
    expect(name.endsWith("Change dates and guests")).toBe(true);
  });

  it("opens the booking sheet when it is tapped", async () => {
    await withDates();
    fireEvent.click(summaryButton());
    expect(screen.getByText("the booking box")).toBeTruthy();
  });

  it("has no price while the search is loading, and says so", async () => {
    render(bar());
    act(() => stayStore.setDates("2099-12-01", "2099-12-04"));
    act(() => availabilityStore.request(request, { immediate: true }));
    expect(summaryButton().textContent).not.toContain("$");
    expect(screen.getByRole("status", { name: "Loading prices" })).toBeTruthy();
  });

  it("says 'Not available for your dates' when no room is, with a disabled button", async () => {
    fetcher.mockResolvedValue({ rooms: [answer(false)] });
    render(bar());
    act(() => stayStore.setDates("2099-12-01", "2099-12-04"));
    act(() => availabilityStore.request(request, { immediate: true }));
    await settle();
    expect(document.querySelector("[data-booking-price]")!.textContent).toContain("Not available for your dates");
    expect(summaryButton().textContent).not.toContain("$");
  });
});
