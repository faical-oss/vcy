/**
 * Rules that tie rooms, adults and children together. Pure, so the store, the booking form and the tests share one
 * definition. Invariants after every change: rooms >= 1, adults >= 1, rooms <= adults, rooms <= `maxRooms`.
 */
import { STAY_LIMITS } from "./stay-params";

export interface Guests {
  rooms: number;
  adults: number;
  children: number;
}

export interface GuestLimits {
  maxRooms: number;
  maxAdults: number;
  maxChildren: number;
}

/** Defaults come from `STAY_LIMITS` (the max rooms constant is 8). */
export const GUEST_LIMITS: GuestLimits = { maxRooms: STAY_LIMITS.maxRooms, maxAdults: STAY_LIMITS.maxAdults, maxChildren: STAY_LIMITS.maxChildren };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.trunc(value)));

/** More rooms than adults is impossible: adding a room raises the adults to match. Fewer rooms leave the adults alone. */
export function changeRooms(guests: Guests, rooms: number, limits: GuestLimits = GUEST_LIMITS): Guests {
  const next = clamp(rooms, 1, Math.min(limits.maxRooms, limits.maxAdults));
  return { ...guests, rooms: next, adults: Math.max(guests.adults, next) };
}

/** Fewer adults than rooms is impossible: removing an adult lowers the rooms to match. More adults leave the rooms alone. */
export function changeAdults(guests: Guests, adults: number, limits: GuestLimits = GUEST_LIMITS): Guests {
  const next = clamp(adults, 1, limits.maxAdults);
  return { ...guests, adults: next, rooms: Math.min(guests.rooms, next) };
}

export function changeChildren(guests: Guests, children: number, limits: GuestLimits = GUEST_LIMITS): Guests {
  return { ...guests, children: clamp(children, 0, limits.maxChildren) };
}

/** Brings any guests (for example from a hand-edited URL) inside the invariants. */
export function normalizeGuests(guests: Guests, limits: GuestLimits = GUEST_LIMITS): Guests {
  const adults = clamp(guests.adults, 1, limits.maxAdults);
  return { adults, rooms: clamp(guests.rooms, 1, Math.min(limits.maxRooms, adults)), children: clamp(guests.children, 0, limits.maxChildren) };
}
