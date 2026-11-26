import { changeAdults, changeChildren, changeRooms, GUEST_LIMITS, normalizeGuests, type GuestLimits } from "@/helpers/guest-rules";
import { adjustSelection, type RoomSelection } from "@/helpers/room-selection";

import { readStayFromSearch, type StayFields } from "@/helpers/stay-url";

/**
 * The guests of the stay being planned on a detail page and the rooms picked for it: the single source of truth the booking
 * form (desktop box and mobile sheet) and the room cards read. The dates and the URL stay with the booking form. Browser
 * only; the server snapshot is the URL's own values (see `useStay`), so nothing leaks between requests.
 */
export interface StayState {
  /** The page it belongs to (the pathname); a different page starts over. */
  key: string | null;
  rooms: number;
  adults: number;
  children: number;
  /** One age (0-17) per child; `null` while the age is not chosen (there is no default age). */
  childAges: (number | null)[];
  /** The guest limits of the page (an experience allows adults up to its group maximum). */
  limits: GuestLimits;
  /** The dates of the search (ISO), or null while not chosen. */
  checkIn: string | null;
  checkOut: string | null;
  /** Date flexibility in days (0 = exact dates). */
  flexDays: number;
  selection: RoomSelection;
}

export type StayInit = Pick<StayState, "rooms" | "adults" | "children" | "childAges"> & Partial<Pick<StayState, "checkIn" | "checkOut" | "flexDays">>;

const fitAges = (ages: readonly (number | null)[], count: number): (number | null)[] => Array.from({ length: count }, (_, index) => ages[index] ?? null);

export function createStayState(key: string | null, init: StayInit, limits: GuestLimits = GUEST_LIMITS): StayState {
  const guests = normalizeGuests(init, limits);
  return { key, ...guests, limits, childAges: fitAges(init.childAges, guests.children), checkIn: init.checkIn ?? null, checkOut: init.checkOut ?? null, flexDays: init.flexDays ?? 0, selection: {} };
}

let state: StayState = createStayState(null, { rooms: 1, adults: 2, children: 0, childAges: [] });
const listeners = new Set<() => void>();

const STAY_PREFIX = "vku:stay:";
/** A saved search is forgotten after a day: dates pass and availability moves. */
const STAY_TTL_MS = 24 * 60 * 60 * 1000;

function stayFieldsOf(value: StayState): StayFields {
  return { checkIn: value.checkIn, checkOut: value.checkOut, rooms: value.rooms, adults: value.adults, children: value.children, childAges: value.childAges, flexDays: value.flexDays };
}

/** The search saved for this page (by its pathname), or null: missing, expired or damaged. */
function readSavedStay(key: string): StayFields | null {
  try {
    const raw = window.localStorage.getItem(STAY_PREFIX + key);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { t?: unknown; stay?: Partial<StayFields> };
    if (typeof saved.t !== "number" || Date.now() - saved.t > STAY_TTL_MS || !saved.stay || typeof saved.stay !== "object") return null;
    const { stay } = saved;
    if (!Number.isInteger(stay.rooms) || !Number.isInteger(stay.adults) || !Number.isInteger(stay.children) || !Array.isArray(stay.childAges)) return null;
    return { checkIn: typeof stay.checkIn === "string" ? stay.checkIn : null, checkOut: typeof stay.checkOut === "string" ? stay.checkOut : null, rooms: stay.rooms as number, adults: stay.adults as number, children: stay.children as number, childAges: stay.childAges.map((age) => (Number.isInteger(age) ? (age as number) : null)), flexDays: Number.isInteger(stay.flexDays) ? (stay.flexDays as number) : 0 };
  } catch {
    return null;
  }
}

function writeSavedStay(key: string, value: StayState) {
  try {
    window.localStorage.setItem(STAY_PREFIX + key, JSON.stringify({ t: Date.now(), stay: stayFieldsOf(value) }));
  } catch {
    // Storage is full or blocked: the search is simply not kept.
  }
}

function publish(next: StayState) {
  const searchChanged = next.key !== null && (next.checkIn !== state.checkIn || next.checkOut !== state.checkOut || next.rooms !== state.rooms || next.adults !== state.adults || next.children !== state.children || next.flexDays !== state.flexDays || next.childAges.some((age, index) => age !== state.childAges[index]) || next.childAges.length !== state.childAges.length);
  if (next.key !== null && next.key === state.key && searchChanged) writeSavedStay(next.key, next);
  state = next;
  listeners.forEach((listener) => listener());
}

/** The rooms chosen are for one search: when the dates or the travellers change, the choice starts again. */
const startedAgain = (): RoomSelection => (Object.keys(state.selection).length > 0 ? {} : state.selection);

/** Applies a guest change and keeps the ages one per child. A change of rooms, adults or children starts the room choice again. */
function withGuests(next: { rooms: number; adults: number; children: number }) {
  const changed = next.rooms !== state.rooms || next.adults !== state.adults || next.children !== state.children;
  publish({ ...state, ...next, childAges: fitAges(state.childAges, next.children), selection: changed ? startedAgain() : state.selection });
}

export const stayStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => state,

  /** Starts the store for a page. Does nothing when it already belongs to that page. */
  hydrate(key: string, init: StayInit, limits?: GuestLimits) {
    if (state.key === key) return;
    publish(createStayState(key, init, limits));
  },
  /**
   * Starts the store for a page from the browser: the search in the URL when it names dates, else the search saved for this page,
   * else the defaults. Does nothing when the store already belongs to that page. The URL's values are taken as they are (they are
   * validated by whoever uses them), so an invalid URL gives a stay that is not complete, not a silent fallback.
   */
  hydrateFromBrowser(key: string, search: string, limits?: GuestLimits) {
    if (state.key === key) return;
    const fromUrl = readStayFromSearch(search);
    const fields = fromUrl.hasStay ? fromUrl.fields : (readSavedStay(key) ?? fromUrl.fields);
    publish(createStayState(key, fields, limits));
  },
  setDates(checkIn: string | null, checkOut: string | null) {
    if (state.checkIn === checkIn && state.checkOut === checkOut) return;
    publish({ ...state, checkIn, checkOut, selection: startedAgain() });
  },
  setFlexDays(flexDays: number) {
    if (state.flexDays !== flexDays) publish({ ...state, flexDays });
  },
  setRooms: (rooms: number) => withGuests(changeRooms(state, rooms, state.limits)),
  setAdults: (adults: number) => withGuests(changeAdults(state, adults, state.limits)),
  setChildren: (children: number) => withGuests(changeChildren(state, children, state.limits)),
  setChildAge(index: number, age: number | null) {
    if (index < 0 || index >= state.childAges.length || state.childAges[index] === age) return;
    publish({ ...state, childAges: state.childAges.map((value, position) => (position === index ? age : value)), selection: startedAgain() });
  },
  /** +1 or -1 room of a type. See `adjustSelection`. */
  adjustRoom(id: string, delta: 1 | -1) {
    const selection = adjustSelection(state.selection, id, delta, state.rooms);
    if (selection !== state.selection) publish({ ...state, selection });
  },
  /** Drops a room type from the selection (for example when it turns out to be sold out for the dates). */
  removeRoom(id: string) {
    if (!(id in state.selection)) return;
    const rest: Record<string, number> = { ...state.selection };
    delete rest[id];
    publish({ ...state, selection: rest });
  },
  clearSelection() {
    if (Object.keys(state.selection).length > 0) publish({ ...state, selection: {} });
  },
};
