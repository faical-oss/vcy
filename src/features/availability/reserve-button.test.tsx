// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { loadAvailability } = vi.hoisted(() => ({ loadAvailability: vi.fn() }));
vi.mock("./get-availability", () => ({ loadAvailability }));

import { ReserveButton } from "./reserve-button";

const dates = { checkIn: "2099-12-01", checkOut: "2099-12-04", adults: "2" };
const available = { status: "available", nights: 3, total: { amount: 1200, currency: "USD" }, perNight: { amount: 400, currency: "USD" }, rooms: [] };

async function reserve(params: Record<string, string>) {
  return render(await ReserveButton({ hotelSlug: "hotel-a", searchParams: Promise.resolve(params) }));
}
const enableStub = () => {
  vi.stubEnv("FEATURE_CHECKOUT_STUB", "true");
  vi.stubEnv("USE_MOCKS", "true");
  vi.stubEnv("SITE_ENV", "development");
};

describe("ReserveButton", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("is disabled, and prices nothing, when the checkout stub flag is off", async () => {
    await reserve(dates);
    expect((screen.getByRole("button", { name: /Reserve now/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Online booking opens soon.")).toBeTruthy();
    expect(loadAvailability).not.toHaveBeenCalled();
  });

  it("is disabled without valid dates and does not fetch", async () => {
    enableStub();
    await reserve({});
    expect((screen.getByRole("button", { name: /Reserve now/ }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    await reserve({ checkIn: "2000-01-01", checkOut: "2000-01-04" });
    expect(screen.getByText("Select your dates to see the total price.")).toBeTruthy();
    expect(loadAvailability).not.toHaveBeenCalled();
  });

  it("is disabled when there is no live price (unavailable or failing)", async () => {
    enableStub();
    loadAvailability.mockResolvedValue({ status: "unavailable" });
    await reserve(dates);
    expect(screen.getByText("No rooms are available for these dates.")).toBeTruthy();
    cleanup();
    loadAvailability.mockResolvedValue(null);
    await reserve(dates);
    expect(screen.getByText(/could not load live prices/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Reserve now/ })).toBeNull();
  });

  it("links to the checkout stub only with the flag on, valid dates and a live price", async () => {
    enableStub();
    loadAvailability.mockResolvedValue(available);
    await reserve({ ...dates, rooms: "1", children: "1" });
    const href = screen.getByRole("link", { name: /Reserve now/ }).getAttribute("href") as string;
    expect(href.startsWith("/checkout?")).toBe(true);
    const params = new URL(href, "http://x").searchParams;
    expect(Object.fromEntries(params)).toEqual({ type: "hotel", id: "hotel-a", checkIn: "2099-12-01", checkOut: "2099-12-04", rooms: "1", adults: "2", children: "1" });
  });
});
