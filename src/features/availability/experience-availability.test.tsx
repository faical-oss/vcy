// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { loadExperienceAvailability, search } = vi.hoisted(() => ({ loadExperienceAvailability: vi.fn(), search: { value: "" } }));
vi.mock("./get-availability", () => ({ loadExperienceAvailability }));
vi.mock("next/navigation", () => ({ usePathname: () => "/experiences/e/test", useSearchParams: () => new URLSearchParams(search.value) }));

import { stayStore } from "@/store/stay-store";
import { ExperiencePricePanel, ExperienceRoomAction, ExperienceRoomCheckoutAction, ExperienceRoomLivePrice, type ExperienceRoomRef } from "./experience-availability";

const group = { min: 4, max: 12 };
const FROM = { amount: 1180, currency: "USD" };
const rooms: ExperienceRoomRef[] = [
  { id: "room-1", name: "Deluxe", maxAdults: 2, maxOccupancy: 3, priceFrom: FROM },
  { id: "room-2", name: "Suite", maxAdults: 2, maxOccupancy: 3, priceFrom: { amount: 1475, currency: "USD" } },
];
const dates = { checkIn: "2099-12-01", checkOut: "2099-12-07", adults: "2" }; // 6 nights
const departure = (params: Record<string, string>) => ({ slug: "exp", nights: 6, group, searchParams: Promise.resolve(params) });
const available = {
  status: "available",
  nights: 6,
  rooms: [
    { roomId: "room-1", available: true, perPerson: { amount: 1180, currency: "USD" } },
    { roomId: "room-2", available: false, perPerson: { amount: 1475, currency: "USD" } },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  search.value = "";
  stayStore.hydrate("reset", { rooms: 1, adults: 2, children: 0, childAges: [] });
});
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("ExperiencePricePanel", () => {
  const panel = async (params: Record<string, string>, followSelection = false) => render(await ExperiencePricePanel({ ...departure(params), fromPrice: FROM, rooms, followSelection }));

  it("shows the indicative price per person and fetches nothing without a valid departure", async () => {
    await panel({});
    expect(screen.getByText("$1,180")).toBeTruthy();
    expect(screen.getByText("per person")).toBeTruthy();
    expect(loadExperienceAvailability).not.toHaveBeenCalled();
    cleanup();
    await panel({ checkIn: "2020-12-01", checkOut: "2020-12-07" }); // in the past
    expect(screen.getByText("Check your dates and travellers.")).toBeTruthy();
    expect(loadExperienceAvailability).not.toHaveBeenCalled();
  });

  it("rejects a group above the maximum without fetching", async () => {
    await panel({ ...dates, adults: "9", children: "4", childAges: "1,2,3,4" });
    expect(screen.getByText("Check your dates and travellers.")).toBeTruthy();
    expect(loadExperienceAvailability).not.toHaveBeenCalled();
  });

  it("keeps the 'From' price per person for a valid departure, with no total: rooms are chosen at checkout", async () => {
    loadExperienceAvailability.mockResolvedValue(available);
    await panel(dates);
    expect(loadExperienceAvailability).toHaveBeenCalledTimes(1);
    expect(screen.getByText("$1,180")).toBeTruthy();
    expect(screen.getByText("per person")).toBeTruthy();
    expect(screen.getByText("You choose your rooms at checkout, where the total is confirmed.")).toBeTruthy();
    expect(screen.queryByText(/total for/)).toBeNull();
  });

  it("can follow the room selection (the checkout's way): the cheapest available room per person and what to do", async () => {
    loadExperienceAvailability.mockResolvedValue(available);
    search.value = new URLSearchParams(dates).toString();
    await panel(dates, true);
    expect(screen.getByText("$1,180")).toBeTruthy();
    expect(screen.getByText("Choose 1 room below to see your total.")).toBeTruthy();
  });

  it("shows only a short line in the compact (mobile bar) variant", async () => {
    loadExperienceAvailability.mockResolvedValue(available);
    render(await ExperiencePricePanel({ ...departure(dates), fromPrice: FROM, rooms, compact: true }));
    expect(screen.getByText("$1,180")).toBeTruthy();
    expect(screen.queryByText(/You choose your rooms/)).toBeNull();
    cleanup();
    loadExperienceAvailability.mockResolvedValue({ status: "unavailable" });
    render(await ExperiencePricePanel({ ...departure(dates), fromPrice: FROM, rooms, compact: true }));
    expect(screen.getByText("Not available for your dates")).toBeTruthy();
  });

  it("shows a banner when the departure is full or the prices cannot be loaded", async () => {
    loadExperienceAvailability.mockResolvedValue({ status: "unavailable" });
    await panel(dates);
    expect(screen.getByText("Departure full")).toBeTruthy();
    cleanup();
    loadExperienceAvailability.mockResolvedValue(null);
    await panel(dates);
    expect(screen.getByText("Prices unavailable")).toBeTruthy();
  });
});

describe("experience room cards", () => {
  it("shows the live price only when it differs from the 'From' price, and a badge for a sold-out room", async () => {
    loadExperienceAvailability.mockResolvedValue({ ...available, rooms: [{ roomId: "room-1", available: true, perPerson: { amount: 1239, currency: "USD" } }, available.rooms[1]] });
    render(await ExperienceRoomLivePrice({ ...departure(dates), roomId: "room-1", fromAmount: 1180 }));
    expect(screen.getByText("$1,239")).toBeTruthy();
    cleanup();
    expect(await ExperienceRoomLivePrice({ ...departure(dates), roomId: "room-1", fromAmount: 1239 })).toBeNull();
    render(await ExperienceRoomLivePrice({ ...departure(dates), roomId: "room-2", fromAmount: 1475 }));
    expect(screen.getByText("Not available for these dates")).toBeTruthy();
  });

  it("disables the select control of a sold-out room and keeps an available one", async () => {
    loadExperienceAvailability.mockResolvedValue(available);
    render(await ExperienceRoomAction({ ...departure(dates), roomId: "room-2", roomName: "Suite" }));
    expect((screen.getByRole("button", { name: /Unavailable/ }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    render(await ExperienceRoomAction({ ...departure(dates), roomId: "room-1", roomName: "Deluxe" }));
    expect((screen.getByRole("button", { name: /Select room/ }) as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("ExperienceRoomCheckoutAction", () => {
  it("links an available room to the experience's checkout, and disables a sold-out room", async () => {
    loadExperienceAvailability.mockResolvedValue(available);
    render(await ExperienceRoomCheckoutAction({ ...departure(dates), roomId: "room-1", roomName: "Deluxe", enabled: true }));
    expect(screen.getByRole("link", { name: /Select room/ }).getAttribute("href")).toContain("type=experience&id=exp");
    cleanup();
    render(await ExperienceRoomCheckoutAction({ ...departure(dates), roomId: "room-2", roomName: "Suite", enabled: true }));
    expect((screen.getByRole("button", { name: /Unavailable/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});
