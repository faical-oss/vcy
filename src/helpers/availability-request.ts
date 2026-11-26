/**
 * Turns a stay into a room availability request, or null when the search is not complete and valid. This is the one rule for
 * "when to ask": dates set and real, every child has an age, rooms <= adults, and for an experience or package its duration rule
 * (fixed: the end follows the start; flexible: within the minimum and maximum nights) and a group within the maximum. The booking form, the controller and the tests all use it.
 */
import type { ProductKind, RoomAvailabilityRequest, StayDuration } from "@/interfaces";
import { DEFAULT_GROUP_SIZE, FLEXIBLE_STAY, departureEnd, parseStayForDuration, type GroupSize } from "./stay-duration";
import type { StayFields } from "./stay-url";

export interface ProductRef {
  kind: ProductKind;
  id: string;
  /** Experiences and packages: how the dates are picked. Hotels (and a missing value) are flexible. */
  duration?: StayDuration;
  group?: GroupSize;
}

export function toRoomRequest(stay: StayFields, product: ProductRef, today: string): RoomAvailabilityRequest | null {
  const duration = product.duration ?? FLEXIBLE_STAY;
  // A fixed-duration product needs only the start: a link with no or a malformed end date is repaired from it.
  const end = stay.checkOut ?? (duration.type === "fixed" && stay.checkIn ? departureEnd(stay.checkIn, duration.nights) : null);
  if (!stay.checkIn || !end) return null;
  const ages = stay.childAges.filter((age): age is number => age !== null && Number.isInteger(age) && age >= 0 && age <= 17);
  if (stay.childAges.length !== stay.children || ages.length !== stay.children) return null; // every child needs an age (there is no default)
  const raw = { checkIn: stay.checkIn, checkOut: end, rooms: String(stay.rooms), adults: String(stay.adults), children: String(stay.children), childAges: stay.children > 0 ? ages.join(",") : undefined, flex: String(stay.flexDays) };
  const parsed = parseStayForDuration(raw, today, duration, product.kind === "hotel" ? undefined : (product.group ?? DEFAULT_GROUP_SIZE));
  if (!parsed.ok) return null;
  const { checkIn, checkOut, adults, children, childAges, rooms } = parsed.stay;
  return { kind: product.kind, id: product.id, checkIn, checkOut, adults, children, childAges, rooms };
}
