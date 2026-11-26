/**
 * The search (dates, guests, child ages, flexibility) as it lives in a detail page's URL, and back. Pure, so the stay store,
 * the controller and the tests share one reading and one writing of the query string.
 * Parameters: checkIn, checkOut (ISO), rooms, adults, children, childAges ("2,5"; a missing or invalid age is a child without an age, which makes the search invalid), flex (days). Other parameters and the hash
 * are never touched.
 */
import { STAY_LIMITS } from "./stay-params";

export const STAY_QUERY_KEYS = ["checkIn", "checkOut", "rooms", "adults", "children", "childAges", "flex"] as const;
export const FLEX_OPTIONS = [0, 1, 2, 3, 7] as const;

export interface StayFields {
  checkIn: string | null;
  checkOut: string | null;
  rooms: number;
  adults: number;
  children: number;
  /** One entry per child; `null` is a child whose age is not chosen yet (an invalid search). */
  childAges: (number | null)[];
  flexDays: number;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const whole = (raw: string | null, fallback: number) => (raw !== null && /^\d{1,2}$/.test(raw) ? Number(raw) : fallback);

/** `search` is a query string with or without the leading "?". `hasStay` is true when the URL names dates. */
export function readStayFromSearch(search: string): { fields: StayFields; hasStay: boolean } {
  const params = new URLSearchParams(search);
  const checkIn = params.get("checkIn");
  const checkOut = params.get("checkOut");
  const children = whole(params.get("children"), 0);
  const ages = (params.get("childAges") ?? "").split(",").map((part) => (/^\d{1,2}$/.test(part) && Number(part) <= STAY_LIMITS.maxChildAge ? Number(part) : null));
  const flex = whole(params.get("flex"), 0);
  return {
    hasStay: !!(checkIn || checkOut),
    fields: {
      checkIn: checkIn && ISO_DATE.test(checkIn) ? checkIn : null,
      checkOut: checkOut && ISO_DATE.test(checkOut) ? checkOut : null,
      rooms: whole(params.get("rooms"), 1),
      adults: whole(params.get("adults"), 2),
      children,
      childAges: Array.from({ length: children }, (_, index) => ages[index] ?? null),
      flexDays: (FLEX_OPTIONS as readonly number[]).includes(flex) ? flex : 0,
    },
  };
}

/**
 * The query string with the stay written in (`stay` complete and valid) or removed (`null`). Everything else stays, in order.
 * Returns the string without a leading "?" (empty when nothing is left).
 */
export function writeStayToSearch(search: string, stay: StayFields | null): string {
  const params = new URLSearchParams(search);
  for (const key of STAY_QUERY_KEYS) params.delete(key);
  if (stay && stay.checkIn && stay.checkOut) {
    params.set("checkIn", stay.checkIn);
    params.set("checkOut", stay.checkOut);
    params.set("rooms", String(stay.rooms));
    params.set("adults", String(stay.adults));
    params.set("children", String(stay.children));
    if (stay.children > 0) params.set("childAges", stay.childAges.map((age) => age ?? "").join(","));
    if (stay.flexDays > 0) params.set("flex", String(stay.flexDays));
  }
  return params.toString();
}
