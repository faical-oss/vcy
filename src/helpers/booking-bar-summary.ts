/**
 * What the mobile reserve bar says about the search, from the same stores and the same state as the desktop booking card, so the two never
 * disagree. Pure, so the bar and the tests share one definition. It shows only what the card shows: the dates, the travellers, the rooms chosen (hotels, which choose
 * rooms on the page, only), the lowest price per night or per person, and for hotels with a complete choice the total for the stay.
 * It never invents: experiences and packages have no rooms line and no total.
 */
import type { Money, RoomAvailability } from "@/interfaces";
import { formatDateRange } from "./format";
import { selectedCount, type RoomSelection, type SelectableRoom } from "./room-selection";
import { nightsBetween } from "./stay-params";

export type BarPrice =
  | { kind: "loading" }
  /** The lowest price for the dates (the card's "From $780 per night"). */
  | { kind: "from"; money: Money; unit: "night" | "person" }
  /** A hotel with its rooms chosen: the total for the stay (the card's "Total for 3 nights"). */
  | { kind: "total"; money: Money; nights: number }
  /** No room, or no answer: said in the error colour. */
  | { kind: "problem"; text: string }
  /** A search that is not valid yet (a child without an age...): what to do, as the card says it. */
  | { kind: "note"; text: string };

export interface BarSummary {
  /** "14–21 Oct". */
  dates: string;
  /** "4 travellers"; the rooms are in `rooms` for hotels and in front ("2 rooms, 4 travellers") for the others, as on the card. */
  guests: string;
  /**
   * Hotels only. `summary` is the count ("2 of 2 rooms selected") or, with nothing chosen, what to do; `items` are the rooms chosen, one per
   * line ("1 × Deluxe Suite"); `note` is what is still to do ("Choose 1 more room to reserve."), or "". `short` is the count only (landscape).
   */
  rooms: { summary: string; items: string[]; note: string; short: string } | null;
  price: BarPrice | null;
}

interface Input {
  stay: { checkIn: string | null; checkOut: string | null; rooms: number; adults: number; children: number; selection: RoomSelection };
  availability: { status: "idle" | "loading" | "ready" | "none" | "error"; rooms: RoomAvailability[] };
  /** The booking state: `kind`, `request`, `note`, `hasDates`. */
  booking: { kind: "prompt" | "busy" | "reserve" | "blocked"; request: unknown; note: string; hasDates: boolean };
  /** Hotels: the rooms to choose from. Absent for experiences and packages. */
  selectable?: SelectableRoom[];
  today: string;
}

const plural = (count: number, one: string) => `${count} ${count === 1 ? one : `${one}s`}`;
const cheapest = (rooms: RoomAvailability[]) => rooms.filter((room) => room.available).reduce<RoomAvailability | null>((best, room) => (!best || room.price.amount < best.price.amount ? room : best), null);

/** The summary for a complete range of dates, or null while there is none (the bar then only says "Select dates"). */
export function barSummary({ stay, availability, booking, selectable, today }: Input): BarSummary | null {
  if (!stay.checkIn || !stay.checkOut || !booking.hasDates) return null;
  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  const travellers = plural(stay.adults + stay.children, "traveller");
  // Hotels name the rooms on their own line; the others put the count of rooms in front of the travellers, as the card does.
  const guests = !selectable && stay.rooms > 1 ? `${plural(stay.rooms, "room")}, ${travellers}` : travellers;
  const dates = formatDateRange(stay.checkIn, stay.checkOut, { today, locale: "en-GB" });

  const ready = booking.request && availability.status === "ready";
  const count = selectedCount(stay.selection);
  const priceOf = new Map(availability.rooms.map((room) => [room.roomId, room.price]));
  const chosen = (selectable ?? []).filter((room) => stay.selection[room.id] && priceOf.has(room.id));

  let rooms: BarSummary["rooms"] = null;
  if (selectable && ready) {
    if (count === 0) rooms = { summary: booking.note, items: [], note: "", short: booking.note };
    else {
      const counted = `${count} of ${stay.rooms} ${stay.rooms === 1 ? "room" : "rooms"} selected`;
      rooms = { summary: counted, items: chosen.map((room) => `${stay.selection[room.id]} × ${room.name}`), note: booking.note, short: counted };
    }
  }

  let price: BarPrice | null = null;
  if (booking.kind === "busy" || availability.status === "loading") price = { kind: "loading" };
  else if (availability.status === "none") price = { kind: "problem", text: "Not available for your dates" };
  else if (availability.status === "error") price = { kind: "problem", text: "Prices unavailable" };
  else if (!booking.request) price = booking.note ? { kind: "note", text: booking.note } : null;
  else if (ready) {
    const room = cheapest(availability.rooms);
    if (selectable && count === stay.rooms && nights > 0 && chosen.length > 0) {
      const perNight = chosen.reduce((sum, entry) => sum + (priceOf.get(entry.id)?.amount ?? 0) * stay.selection[entry.id], 0);
      price = { kind: "total", money: { amount: perNight * nights, currency: priceOf.get(chosen[0].id)?.currency ?? "USD" }, nights };
    } else if (room) price = { kind: "from", money: room.price, unit: room.unit === "person" ? "person" : "night" };
  }
  return { dates, guests, rooms, price };
}
