/**
 * Choosing several room types for one stay. `selection` maps a room id to a quantity (>= 1; a room with 0 is absent). The
 * quantities must add up to the number of rooms searched. Pure, shared by the store, the room cards and the tests.
 */
import type { Guests } from "./guest-rules";

export type RoomSelection = Readonly<Record<string, number>>;

/** What a room can hold (from the room's data). */
export interface RoomLimits {
  id: string;
  maxAdults: number;
  maxOccupancy: number;
}

/** A room the visitor can choose on the page: its name for the booking card, and what it holds for the capacity check. */
export interface SelectableRoom extends RoomLimits {
  name: string;
}

export const selectedCount = (selection: RoomSelection): number => Object.values(selection).reduce((sum, quantity) => sum + quantity, 0);

/** Drops quantity from the most recently added rooms until the total fits `rooms` (used when the searched rooms go down). */
export function clampSelection(selection: RoomSelection, rooms: number): RoomSelection {
  let excess = selectedCount(selection) - rooms;
  if (excess <= 0) return selection;
  const next: Record<string, number> = { ...selection };
  for (const id of Object.keys(next).reverse()) {
    const take = Math.min(next[id], excess);
    next[id] -= take;
    excess -= take;
    if (next[id] === 0) delete next[id];
    if (excess === 0) break;
  }
  return next;
}

/**
 * Adds (+1) or removes (-1) one room of a type. Adding is ignored once the total reaches `rooms`, except when only one room
 * is searched: then choosing another type swaps the choice (otherwise the visitor would have to remove the first one).
 */
export function adjustSelection(selection: RoomSelection, id: string, delta: 1 | -1, rooms: number): RoomSelection {
  if (delta === -1) {
    const quantity = selection[id] ?? 0;
    if (quantity === 0) return selection;
    const next: Record<string, number> = { ...selection };
    if (quantity === 1) delete next[id];
    else next[id] = quantity - 1;
    return next;
  }
  if (rooms === 1) return { [id]: 1 };
  if (selectedCount(selection) >= rooms) return selection;
  return { ...selection, [id]: (selection[id] ?? 0) + 1 };
}

export type CapacityCheck = { ok: true } | { ok: false; reason: "adults" | "guests"; capacity: number; needed: number };

/**
 * Do the selected rooms fit everybody? Each room needs an adult (the guest rules keep rooms <= adults, so this holds), the
 * adults must fit the rooms' adult places, and all guests must fit their occupancy. Checked for the complete selection.
 */
export function checkCapacity(selection: RoomSelection, rooms: readonly RoomLimits[], guests: Pick<Guests, "adults" | "children">): CapacityCheck {
  const byId = new Map(rooms.map((room) => [room.id, room]));
  let adultPlaces = 0;
  let places = 0;
  for (const [id, quantity] of Object.entries(selection)) {
    const room = byId.get(id);
    if (!room) continue;
    adultPlaces += room.maxAdults * quantity;
    places += room.maxOccupancy * quantity;
  }
  if (adultPlaces < guests.adults) return { ok: false, reason: "adults", capacity: adultPlaces, needed: guests.adults };
  const everyone = guests.adults + guests.children;
  if (places < everyone) return { ok: false, reason: "guests", capacity: places, needed: everyone };
  return { ok: true };
}
