// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoomAvailability, RoomAvailabilityRequest } from "@/interfaces";
import { availabilityStore } from "@/store/availability-store";
import { stayStore } from "@/store/stay-store";

const { getRoomAvailability } = vi.hoisted(() => ({ getRoomAvailability: vi.fn() }));
vi.mock("@/services/room-availability", () => ({ getRoomAvailability }));
const pathState = vi.hoisted(() => ({ value: "/hotels/h/azure" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathState.value }));

import { AvailabilityController } from "./availability-controller";

const room = (id: string, available = true): RoomAvailability => ({ roomId: id, available, price: { amount: 100, currency: "USD" }, unit: "night" });
const hotel = { kind: "hotel" as const, id: "azure" };
const experience = { kind: "experience" as const, id: "ubud", duration: { type: "fixed" as const, nights: 6 }, group: { min: 4, max: 12 } };
const setUrl = (search: string, hash = "") => window.history.replaceState(null, "", `/hotels/h/azure${search ? `?${search}` : ""}${hash}`);
const VALID = "checkIn=2099-12-01&checkOut=2099-12-04&adults=2&rooms=1";

async function mount(product: Parameters<typeof AvailabilityController>[0]["product"] = hotel) {
  render(<AvailabilityController product={product} />);
  await act(async () => {}); // hydration, effects
}
const settle = async (ms: number) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"] });
  getRoomAvailability.mockReset();
  getRoomAvailability.mockImplementation(async () => ({ rooms: [room("a"), room("b", false)] }));
  availabilityStore.reset();
  stayStore.hydrate("somewhere-else", { rooms: 1, adults: 2, children: 0, childAges: [] }); // the page starts the store afresh
  window.localStorage.clear();
  setUrl("");
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("AvailabilityController: first load", () => {
  it("asks at once for a complete, valid search in the URL, forwarding the dev ?mock= scenario, and ends ready", async () => {
    setUrl(`${VALID}&mock=partial`);
    await mount();
    expect(getRoomAvailability).toHaveBeenCalledTimes(1); // no debounce wait on the first load
    const [given, options] = getRoomAvailability.mock.calls[0] as [RoomAvailabilityRequest, { mock: string | null }];
    expect(given).toEqual({ kind: "hotel", id: "azure", checkIn: "2099-12-01", checkOut: "2099-12-04", adults: 2, children: 0, childAges: [], rooms: 1 });
    expect(options.mock).toBe("partial");
    expect(availabilityStore.getSnapshot().status).toBe("loading"); // skeletons from the first client render
    await settle(300);
    expect(availabilityStore.getSnapshot().status).toBe("ready");
  });

  it("makes no call, and drops the dates, when the URL's search is invalid (past dates, a missing end)", async () => {
    setUrl("checkIn=2020-01-01&checkOut=2020-01-04");
    await mount();
    expect(getRoomAvailability).not.toHaveBeenCalled();
    expect(availabilityStore.getSnapshot().status).toBe("idle");
    expect(stayStore.getSnapshot().checkIn).toBeNull();
    cleanup();

    stayStore.hydrate("somewhere-else", { rooms: 1, adults: 2, children: 0, childAges: [] });
    setUrl("checkIn=2099-12-01&checkOut=2099-12-04"); // a flexible stay of 3 nights, below the minimum of 5
    await mount({ ...experience, duration: { type: "flexible", minNights: 5 } });
    expect(getRoomAvailability).not.toHaveBeenCalled();
    expect(stayStore.getSnapshot().checkIn).toBeNull();
  });

  it("repairs a fixed-duration link whose end is not the start plus its nights, in the store and in the URL", async () => {
    stayStore.hydrate("somewhere-else", { rooms: 1, adults: 2, children: 0, childAges: [] });
    setUrl("checkIn=2099-12-01&checkOut=2099-12-04"); // 3 nights: this experience lasts 6
    await mount(experience);
    expect(stayStore.getSnapshot().checkIn).toBe("2099-12-01");
    expect(stayStore.getSnapshot().checkOut).toBe("2099-12-07");
    await settle(100);
    expect(getRoomAvailability).toHaveBeenCalledTimes(1);
    expect(getRoomAvailability.mock.calls[0][0]).toMatchObject({ checkIn: "2099-12-01", checkOut: "2099-12-07" });
    expect(window.location.search).toContain("checkOut=2099-12-07");
  });

  it("makes no call without dates", async () => {
    await mount();
    await settle(2000);
    expect(getRoomAvailability).not.toHaveBeenCalled();
    expect(availabilityStore.getSnapshot().status).toBe("idle");
  });

  it("falls back to the search saved for the page when the URL names none, and puts it in the URL", async () => {
    window.localStorage.setItem("vku:stay:/hotels/h/azure", JSON.stringify({ t: Date.now(), stay: { checkIn: "2099-12-01", checkOut: "2099-12-04", rooms: 1, adults: 3, children: 1, childAges: [6], flexDays: 0 } }));
    await mount();
    expect(getRoomAvailability).toHaveBeenCalledTimes(1);
    expect((getRoomAvailability.mock.calls[0][0] as RoomAvailabilityRequest).childAges).toEqual([6]);
    expect(new URLSearchParams(window.location.search).get("checkIn")).toBe("2099-12-01");
    expect(new URLSearchParams(window.location.search).get("childAges")).toBe("6");
  });

  it("prefers the URL to the saved search", async () => {
    window.localStorage.setItem("vku:stay:/hotels/h/azure", JSON.stringify({ t: Date.now(), stay: { checkIn: "2099-11-01", checkOut: "2099-11-04", rooms: 1, adults: 5, children: 0, childAges: [], flexDays: 0 } }));
    setUrl(VALID);
    await mount();
    expect((getRoomAvailability.mock.calls[0][0] as RoomAvailabilityRequest).checkIn).toBe("2099-12-01");
  });

  it("ignores an expired or damaged saved search", async () => {
    window.localStorage.setItem("vku:stay:/hotels/h/azure", JSON.stringify({ t: Date.now() - 2 * 24 * 60 * 60 * 1000, stay: { checkIn: "2099-12-01", checkOut: "2099-12-04", rooms: 1, adults: 2, children: 0, childAges: [], flexDays: 0 } }));
    await mount();
    expect(getRoomAvailability).not.toHaveBeenCalled();
    cleanup();
    stayStore.hydrate("somewhere-else", { rooms: 1, adults: 2, children: 0, childAges: [] });
    window.localStorage.setItem("vku:stay:/hotels/h/azure", "{nope");
    await mount();
    expect(getRoomAvailability).not.toHaveBeenCalled();
  });

  it("on arrival with dates does not change the tab or the hash", async () => {
    setUrl(VALID, "#overview");
    await mount();
    await settle(2000);
    expect(window.location.hash).toBe("#overview");
  });
});

describe("AvailabilityController: after the first load", () => {
  it("asks nothing while a dates or travellers panel is open, and makes one call when it closes", async () => {
    setUrl(VALID);
    await mount();
    await settle(2000);
    getRoomAvailability.mockClear();
    const closePanel = availabilityStore.beginEdit(); // the panel opens
    act(() => stayStore.setAdults(3));
    await settle(1000);
    act(() => stayStore.setAdults(4));
    act(() => stayStore.setChildren(1));
    act(() => stayStore.setChildAge(0, 7));
    await settle(3000);
    expect(getRoomAvailability).not.toHaveBeenCalled();
    expect(new URLSearchParams(window.location.search).get("adults")).toBe("2"); // the URL waits too
    act(() => closePanel()); // Done
    await settle(10);
    expect(getRoomAvailability).toHaveBeenCalledTimes(1);
    expect(getRoomAvailability.mock.calls[0][0]).toMatchObject({ adults: 4, children: 1, childAges: [7] });
    expect(new URLSearchParams(window.location.search).get("adults")).toBe("4");
    await settle(3000);
    expect(getRoomAvailability).toHaveBeenCalledTimes(1);
  });

  it("asks nothing when the panel closes on the search it opened with", async () => {
    setUrl(VALID);
    await mount();
    await settle(2000);
    getRoomAvailability.mockClear();
    const closePanel = availabilityStore.beginEdit();
    act(() => stayStore.setAdults(3));
    act(() => stayStore.setAdults(2));
    act(() => closePanel());
    await settle(2000);
    expect(getRoomAvailability).not.toHaveBeenCalled();
  });

  it("keeps editing until the last open panel closes (the desktop box and the mobile sheet)", async () => {
    setUrl(VALID);
    await mount();
    await settle(2000);
    getRoomAvailability.mockClear();
    const first = availabilityStore.beginEdit();
    const second = availabilityStore.beginEdit();
    act(() => stayStore.setRooms(2));
    act(() => first());
    await settle(2000);
    expect(getRoomAvailability).not.toHaveBeenCalled();
    act(() => second());
    await settle(10);
    expect(getRoomAvailability).toHaveBeenCalledTimes(1);
  });

  it("refetches for each kind of change: dates, adults, a child's age and rooms; a new child without an age asks for nothing", async () => {
    setUrl(VALID);
    await mount();
    await settle(2000);
    getRoomAvailability.mockClear();
    const changes: (() => void)[] = [() => stayStore.setChildAge(0, 9), () => stayStore.setDates("2099-12-02", "2099-12-05"), () => stayStore.setAdults(4), () => stayStore.setRooms(2)];
    act(() => stayStore.setChildren(1)); // no age yet: the search is incomplete
    await settle(2000);
    expect(getRoomAvailability).not.toHaveBeenCalled();
    for (const change of changes) {
      act(change);
      await settle(2000);
    }
    expect(getRoomAvailability).toHaveBeenCalledTimes(changes.length);
  });

  it("makes no call and keeps the dates when the URL has a child without an age", async () => {
    setUrl(`${VALID}&children=2&childAges=4`);
    await mount();
    await settle(2000);
    expect(getRoomAvailability).not.toHaveBeenCalled();
    expect(stayStore.getSnapshot().checkIn).toBe("2099-12-01");
    expect(stayStore.getSnapshot().childAges).toEqual([4, null]);
    act(() => stayStore.setChildAge(1, 7));
    await settle(10);
    expect(getRoomAvailability).toHaveBeenCalledTimes(1);
    expect((getRoomAvailability.mock.calls[0][0] as RoomAvailabilityRequest).childAges).toEqual([4, 7]);
  });

  it("accepts up to the group maximum (12) adults on an experience", async () => {
    pathState.value = "/experiences/e/ubud"; // the page decides the guest limits
    setUrl("checkIn=2099-12-01&checkOut=2099-12-07&adults=12&rooms=1");
    await mount(experience);
    expect(getRoomAvailability).toHaveBeenCalledTimes(1);
    expect((getRoomAvailability.mock.calls[0][0] as RoomAvailabilityRequest).adults).toBe(12);
    pathState.value = "/hotels/h/azure";
  });

  it("keeps the URL in sync with replaceState: no new history entry, other parameters kept, the stay removed with the dates", async () => {
    setUrl(`${VALID}&mock=none`);
    await mount();
    await settle(2000);
    const length = window.history.length;
    act(() => stayStore.setAdults(4));
    await settle(2000);
    expect(new URLSearchParams(window.location.search).get("adults")).toBe("4");
    expect(new URLSearchParams(window.location.search).get("mock")).toBe("none");
    expect(window.history.length).toBe(length);
    act(() => stayStore.setDates(null, null));
    await settle(10);
    expect(window.location.search).toBe("?mock=none");
  });

  it("shows the Rooms tab once, only when the search was started with 'Check availability'", async () => {
    await mount();
    act(() => availabilityStore.markReveal());
    act(() => stayStore.setDates("2099-12-01", "2099-12-04"));
    await settle(50);
    expect(window.location.hash).toBe("#rooms");
    window.location.hash = "#overview";
    act(() => stayStore.setDates("2099-12-02", "2099-12-05"));
    await settle(2000);
    expect(window.location.hash).toBe("#overview"); // not again
  });

  it("holds the switch to the Rooms tab while the booking sheet is open and makes it when the sheet closes", async () => {
    await mount();
    act(() => availabilityStore.holdReveal(true)); // the mobile sheet is open
    act(() => availabilityStore.markReveal());
    act(() => stayStore.setDates("2099-12-01", "2099-12-04"));
    await settle(2000);
    expect(availabilityStore.getSnapshot().status).toBe("ready");
    expect(window.location.hash).not.toBe("#rooms");
    act(() => availabilityStore.holdReveal(false));
    await settle(50);
    expect(window.location.hash).toBe("#rooms");
  });
});
