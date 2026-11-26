/**
 * Pricing of an experience PER PERSON when several rooms are chosen. The guests are split over the chosen rooms as evenly as
 * their capacity allows (each room gets at least one adult), and a room's cost is its guests times its per-person price.
 * TODO(api): the real split and price rules (shared occupancy, single supplements, child prices) come from the API; this is
 * a deterministic stand-in.
 */
import type { RoomSelection } from "./room-selection";

export interface PricedRoom {
  id: string;
  /** Per person, whole stay. */
  perPerson: number;
  maxAdults: number;
  maxOccupancy: number;
}

export interface RoomShare {
  roomId: string;
  guests: number;
  /** guests x perPerson. */
  subtotal: number;
}

/** One entry per room instance, in the order the rooms were chosen. */
function instances(selection: RoomSelection, rooms: readonly PricedRoom[]): PricedRoom[] {
  const byId = new Map(rooms.map((room) => [room.id, room]));
  return Object.entries(selection).flatMap(([id, quantity]) => {
    const room = byId.get(id);
    return room ? Array.from({ length: quantity }, () => room) : [];
  });
}

/** Splits `guests` over the room instances: one each first (every room has an adult), then round-robin up to each room's occupancy. */
export function splitGuests(roomList: readonly PricedRoom[], guests: number): number[] {
  const shares = roomList.map(() => 1);
  let left = guests - roomList.length;
  while (left > 0) {
    let placed = false;
    for (let index = 0; index < roomList.length && left > 0; index += 1) {
      if (shares[index] < roomList[index].maxOccupancy) {
        shares[index] += 1;
        left -= 1;
        placed = true;
      }
    }
    if (!placed) break; // everyone is seated as far as the rooms allow
  }
  return shares;
}

/** Per room type: how many guests sleep in it in total and what they pay. Types are in selection order. */
export function priceRooms(selection: RoomSelection, rooms: readonly PricedRoom[], guests: number): RoomShare[] {
  const list = instances(selection, rooms);
  const shares = splitGuests(list, guests);
  const byRoom = new Map<string, RoomShare>();
  list.forEach((room, index) => {
    const current = byRoom.get(room.id) ?? { roomId: room.id, guests: 0, subtotal: 0 };
    current.guests += shares[index];
    current.subtotal += shares[index] * room.perPerson;
    byRoom.set(room.id, current);
  });
  return [...byRoom.values()];
}

export const totalOf = (shares: readonly RoomShare[]): number => shares.reduce((sum, share) => sum + share.subtotal, 0);
