import "server-only";
import { cacheLife } from "next/cache";
import { AVAILABILITY_TTL_SECONDS, DEFAULT_CURRENCY } from "@/constants/site";
import type { Stay } from "@/helpers/stay-params";
import type { AvailabilityQuery, AvailabilityResult, ExperienceAvailabilityResult } from "@/interfaces";
import { getAvailabilityService } from "@/services";

/*
 * Live price and availability of a hotel stay. Kept apart from the cached hotel shell: nothing here is ever part of the
 * cached page content.
 *
 * - `getHotelAvailability`: the page's call. Cached for AVAILABILITY_TTL_SECONDS (a plain TTL, no tags: a price changes
 *   by time, not by an editorial event). The cache key is the function arguments: hotel, check-in, check-out, rooms,
 *   adults, children, flexibility and currency (a superset of hotel + dates + travellers + currency, because the price
 *   depends on the room count and the split between adults and children). Only call it with a valid stay.
 * - `liveRecheck`: placeholder for checkout. Checkout must price the stay again with NO cache right before it books.
 *   Nothing calls it yet (the checkout stub does not price anything).
 * - `loadAvailability`: the page's safe wrapper around the cached call: null when the service fails or is not configured.
 */

function toQuery(hotelSlug: string, stay: Stay, currency: string): AvailabilityQuery {
  return { hotelSlug, checkIn: stay.checkIn, checkOut: stay.checkOut, rooms: stay.rooms, adults: stay.adults, children: stay.children, currency, flexDays: stay.flexDays };
}

async function readAvailability(hotelSlug: string, checkIn: string, checkOut: string, rooms: number, adults: number, children: number, flexDays: number, currency: string): Promise<AvailabilityResult> {
  "use cache";
  cacheLife({ revalidate: AVAILABILITY_TTL_SECONDS, expire: AVAILABILITY_TTL_SECONDS + 1 });

  return (await getAvailabilityService()).getHotelAvailability({ hotelSlug, checkIn, checkOut, rooms, adults, children, currency, flexDays });
}

/** Cached live price for a valid stay. Throws when the availability service is not configured or fails (the panel shows an error state). */
export function getHotelAvailability(hotelSlug: string, stay: Stay, currency: string = DEFAULT_CURRENCY): Promise<AvailabilityResult> {
  return readAvailability(hotelSlug, stay.checkIn, stay.checkOut, stay.rooms, stay.adults, stay.children, stay.flexDays, currency);
}

/** Checkout's price check: always a fresh call to the service, never cached. NOT CALLED YET: checkout is not built (only a stub exists). */
export async function liveRecheck(hotelSlug: string, stay: Stay, currency: string = DEFAULT_CURRENCY): Promise<AvailabilityResult> {
  return (await getAvailabilityService()).getHotelAvailability(toQuery(hotelSlug, stay, currency));
}

/** The cached live price, or null when it cannot be loaded (service not configured or failing). Panels show an error state for null. */
export async function loadAvailability(hotelSlug: string, stay: Stay): Promise<AvailabilityResult | null> {
  try {
    return await getHotelAvailability(hotelSlug, stay);
  } catch {
    return null;
  }
}

/* ---------- Experience departures (price per person) ---------- */

async function readExperienceAvailability(experienceSlug: string, checkIn: string, checkOut: string, rooms: number, adults: number, children: number, flexDays: number, currency: string): Promise<ExperienceAvailabilityResult> {
  "use cache";
  cacheLife({ revalidate: AVAILABILITY_TTL_SECONDS, expire: AVAILABILITY_TTL_SECONDS + 1 });

  return (await getAvailabilityService()).getExperienceAvailability({ experienceSlug, checkIn, checkOut, rooms, adults, children, currency, flexDays });
}

/** The cached live price (per person) of a valid departure, or null when it cannot be loaded. Panels show an error state for null. */
export async function loadExperienceAvailability(experienceSlug: string, stay: Stay): Promise<ExperienceAvailabilityResult | null> {
  try {
    return await readExperienceAvailability(experienceSlug, stay.checkIn, stay.checkOut, stay.rooms, stay.adults, stay.children, stay.flexDays, DEFAULT_CURRENCY);
  } catch {
    return null;
  }
}
