/**
 * Parsing and validation of the stay parameters in the URL of a detail page (?checkIn=&checkOut=&rooms=&adults=&children=&childAges=&flex=).
 * Pure, so the server (availability fetch) and the booking form (button state) apply the same rules.
 */

export const STAY_LIMITS = { maxNights: 30, maxRooms: 8, maxAdults: 9, maxChildren: 6, maxFlexDays: 7, maxChildAge: 17 } as const;

/** The shape of the limits (an experience raises `maxAdults` to its group size). */
export type StayLimits = { [Key in keyof typeof STAY_LIMITS]: number };

export interface Stay {
  /** ISO dates, YYYY-MM-DD. */
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  /** One age (0-17) per child, in order; empty when the URL carries none (older links). */
  childAges: number[];
  /** 0 = exact dates. */
  flexDays: number;
  nights: number;
}

export type StayParse = { ok: true; stay: Stay } | { ok: false; reason: "missing" | "invalid" };

type RawParam = string | string[] | undefined;
export interface RawStayParams {
  checkIn?: RawParam;
  checkOut?: RawParam;
  rooms?: RawParam;
  adults?: RawParam;
  children?: RawParam;
  /** Comma-separated ages, one per child (`2,5`). */
  childAges?: RawParam;
  flex?: RawParam;
}

const MS_PER_DAY = 86_400_000;

const first = (value: RawParam): string | undefined => (Array.isArray(value) ? value[0] : value);

/** A real calendar date in YYYY-MM-DD form. */
export function isIsoDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / MS_PER_DAY);
}

function integer(value: RawParam, fallback: number, min: number, max: number): number | null {
  const raw = first(value);
  if (raw === undefined || raw === "") return fallback;
  if (!/^\d{1,2}$/.test(raw)) return null;
  const number = Number(raw);
  return number >= min && number <= max ? number : null;
}

/** `"2,5"` -> `[2, 5]`; null when any part is not a whole age within 0-17. An absent or empty value is `[]`. */
function childAges(value: RawParam): number[] | null {
  const raw = first(value);
  if (raw === undefined || raw === "") return [];
  const ages = raw.split(",").map((part) => (/^\d{1,2}$/.test(part) ? Number(part) : -1));
  return ages.every((age) => age >= 0 && age <= STAY_LIMITS.maxChildAge) ? ages : null;
}

/**
 * `today` is the current UTC date (YYYY-MM-DD), passed in so the function stays pure. Missing dates are "missing" (nothing
 * to price yet); anything else wrong is "invalid". Guests default to 2 adults, 0 children, 1 room.
 */
export function parseStayParams(raw: RawStayParams, today: string, limits: StayLimits = STAY_LIMITS): StayParse {
  const checkIn = first(raw.checkIn);
  const checkOut = first(raw.checkOut);
  if (!checkIn && !checkOut) return { ok: false, reason: "missing" };
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut)) return { ok: false, reason: "invalid" };
  if (checkIn < today) return { ok: false, reason: "invalid" };
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1 || nights > limits.maxNights) return { ok: false, reason: "invalid" };
  const rooms = integer(raw.rooms, 1, 1, limits.maxRooms);
  const adults = integer(raw.adults, 2, 1, limits.maxAdults);
  const children = integer(raw.children, 0, 0, limits.maxChildren);
  const flexDays = integer(raw.flex, 0, 0, limits.maxFlexDays);
  if (rooms === null || adults === null || children === null || flexDays === null) return { ok: false, reason: "invalid" };
  const ages = childAges(raw.childAges);
  if (ages === null || (ages.length > 0 && ages.length !== children)) return { ok: false, reason: "invalid" };
  if (adults < rooms) return { ok: false, reason: "invalid" };
  return { ok: true, stay: { checkIn, checkOut, rooms, adults, children, childAges: ages, flexDays, nights } };
}

/** Today in UTC as YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
