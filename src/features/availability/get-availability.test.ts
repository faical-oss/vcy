import { beforeEach, describe, expect, it, vi } from "vitest";

const { cacheLife, getHotelAvailability } = vi.hoisted(() => ({ cacheLife: vi.fn(), getHotelAvailability: vi.fn() }));
vi.mock("next/cache", () => ({ cacheLife, cacheTag: vi.fn() }));
vi.mock("@/services", () => ({ getAvailabilityService: async () => ({ getHotelAvailability }) }));

import { AVAILABILITY_TTL_SECONDS } from "@/constants/site";
import type { Stay } from "@/helpers/stay-params";
import { getHotelAvailability as cachedAvailability, liveRecheck, loadAvailability } from "./get-availability";

const stay: Stay = { checkIn: "2099-12-01", checkOut: "2099-12-04", rooms: 1, adults: 2, children: 1, childAges: [5], flexDays: 0, nights: 3 };
const available = { status: "available", nights: 3, total: { amount: 1200, currency: "USD" }, perNight: { amount: 400, currency: "USD" }, rooms: [] };

describe("getHotelAvailability (cached live price)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("is cached for a plain 60 second TTL, with no tags", async () => {
    getHotelAvailability.mockResolvedValue(available);
    await cachedAvailability("hotel-a", stay);
    expect(AVAILABILITY_TTL_SECONDS).toBe(60);
    expect(cacheLife).toHaveBeenCalledWith({ revalidate: 60, expire: 61 });
  });

  it("asks the service with the hotel, dates, rooms, guests, flexibility and currency (the cache key arguments)", async () => {
    getHotelAvailability.mockResolvedValue(available);
    await cachedAvailability("hotel-a", stay, "EUR");
    expect(getHotelAvailability).toHaveBeenCalledWith({ hotelSlug: "hotel-a", checkIn: "2099-12-01", checkOut: "2099-12-04", rooms: 1, adults: 2, children: 1, flexDays: 0, currency: "EUR" });
  });
});

describe("liveRecheck (placeholder for checkout)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("always calls the service and never sets a cache lifetime", async () => {
    getHotelAvailability.mockResolvedValue(available);
    expect(await liveRecheck("hotel-a", stay)).toEqual(available);
    expect(cacheLife).not.toHaveBeenCalled();
    expect(getHotelAvailability).toHaveBeenCalledWith(expect.objectContaining({ hotelSlug: "hotel-a", currency: "USD" }));
  });
});

describe("loadAvailability", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the result, or null when the service fails", async () => {
    getHotelAvailability.mockResolvedValue(available);
    expect(await loadAvailability("hotel-a", stay)).toEqual(available);
    getHotelAvailability.mockRejectedValue(new Error("down"));
    expect(await loadAvailability("hotel-a", stay)).toBeNull();
  });
});
