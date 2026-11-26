import { FETCH_DEBOUNCE_MS } from "@/helpers/fetch-timing";
import type { RoomAvailability, RoomAvailabilityRequest } from "@/interfaces";

/**
 * Room availability of the hotel or experience page being looked at: one state machine shared by the booking card (button and
 * price) and the Rooms tab. It never fetches on its own: the controller hands it a complete, valid search (`request`) and a
 * `fetcher`. What it guarantees:
 *  - no call without a search; an identical search (same key) is not asked twice, and a finished one is cached for the session;
 *  - quick edits make one call: a new search waits `debounceMs` (400) unless it is `immediate` or `flush()` is called (the
 *    travellers dropdown closing), and a newer search aborts the older one and ignores its answer;
 *  - a response never shows before `minLoadingMs`, so a fast answer does not flicker.
 * States: idle (no search), loading, ready (at least one room available), none (rooms, all sold out) and error.
 */
export type AvailabilityStatus = "idle" | "loading" | "ready" | "none" | "error";

export interface AvailabilitySnapshot {
  status: AvailabilityStatus;
  rooms: RoomAvailability[];
  /** The search this snapshot answers; null while idle. */
  key: string | null;
  /** The search that `rooms` answers (the same one `key` names); null while idle. */
  request: RoomAvailabilityRequest | null;
  /** Counts settled answers (ready, none, error): the live region announces "Rooms updated" when it changes. */
  updates: number;
  /** The visitor started the search with "Check availability": bring the Rooms tab into view once it starts. */
  revealPending: boolean;
  /** The booking sheet is open (mobile): the Rooms tab waits until it closes, so it is not switched behind the sheet. */
  revealHeld: boolean;
  /** A booking panel (dates or travellers) is open: the search is being edited and nothing is asked until it closes. */
  editing: boolean;
}

export type Fetcher = (request: RoomAvailabilityRequest, signal: AbortSignal) => Promise<{ rooms: RoomAvailability[] }>;

const IDLE: AvailabilitySnapshot = { status: "idle", rooms: [], key: null, request: null, updates: 0, revealPending: false, revealHeld: false, editing: false };

let snapshot: AvailabilitySnapshot = IDLE;
let fetcher: Fetcher | null = null;
let debounceMs = FETCH_DEBOUNCE_MS;
let minLoadingMs = 300;
let currentKey: string | null = null;
let lastRequest: RoomAvailabilityRequest | null = null;
let pending: RoomAvailabilityRequest | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let controller: AbortController | null = null;
let sequence = 0;
let edits = 0;
const cache = new Map<string, { status: "ready" | "none"; rooms: RoomAvailability[] }>();
const listeners = new Set<() => void>();

const keyOf = (request: RoomAvailabilityRequest): string => JSON.stringify([request.kind, request.id, request.checkIn, request.checkOut, request.adults, request.children, request.childAges, request.rooms]);

function publish(next: Partial<AvailabilitySnapshot>, settled = false) {
  // A snapshot with a `key` answers the search that was last asked (`lastRequest`); without one the page is idle.
  const request = "key" in next ? (next.key === null ? null : lastRequest) : snapshot.request;
  snapshot = { ...snapshot, ...next, request, updates: settled ? snapshot.updates + 1 : snapshot.updates };
  listeners.forEach((listener) => listener());
}

function cancel() {
  if (timer) clearTimeout(timer);
  timer = null;
  controller?.abort();
  controller = null;
  pending = null;
  sequence += 1; // anything still in flight is now stale
}

function run() {
  if (timer) clearTimeout(timer);
  timer = null;
  const request = pending;
  pending = null;
  if (!request || !fetcher) return;
  const key = keyOf(request);
  const id = ++sequence;
  controller = new AbortController();
  const signal = controller.signal;
  const started = Date.now();
  fetcher(request, signal).then(
    async (response) => {
      const wait = minLoadingMs - (Date.now() - started);
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      if (id !== sequence) return; // a newer search took over
      const status = response.rooms.some((room) => room.available) ? "ready" : "none";
      cache.set(key, { status, rooms: response.rooms });
      publish({ status, rooms: response.rooms, key }, true);
    },
    (error: unknown) => {
      if (id !== sequence || (error instanceof Error && error.name === "AbortError")) return;
      publish({ status: "error", rooms: [], key }, true);
    },
  );
}

export const availabilityStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => snapshot,
  getServerSnapshot: () => IDLE,

  /** Gives the store the function that asks the API. Tests pass timings too. */
  configure(options: { fetcher: Fetcher; debounceMs?: number; minLoadingMs?: number }) {
    fetcher = options.fetcher;
    debounceMs = options.debounceMs ?? 400;
    minLoadingMs = options.minLoadingMs ?? 300;
  },

  /**
   * The current search, or null when it is not complete and valid (no call is made and the state goes back to idle). The same
   * search again does nothing. `immediate` skips the wait (the first load, the first range chosen).
   */
  request(request: RoomAvailabilityRequest | null, options: { immediate?: boolean } = {}) {
    if (!request) {
      if (currentKey === null && snapshot.status === "idle") return;
      cancel();
      currentKey = null;
      lastRequest = null;
      publish({ status: "idle", rooms: [], key: null });
      return;
    }
    const key = keyOf(request);
    if (key === currentKey) return; // identical search
    cancel();
    currentKey = key;
    lastRequest = request;
    const cached = cache.get(key);
    if (cached) {
      publish({ status: cached.status, rooms: cached.rooms, key }, true);
      return;
    }
    publish({ status: "loading", rooms: [], key });
    pending = request;
    if (options.immediate) run();
    else timer = setTimeout(run, debounceMs);
  },

  /** Asks now what is waiting for the debounce (the travellers dropdown closed). */
  flush() {
    if (timer) run();
  },

  /** Asks again for the current search (after an error, or when no room was available). */
  retry() {
    if (!lastRequest) return;
    cancel();
    cache.delete(keyOf(lastRequest));
    publish({ status: "loading", rooms: [], key: currentKey });
    pending = lastRequest;
    run();
  },

  /** The visitor pressed "Check availability" without dates: reveal the Rooms tab when the search starts. */
  markReveal() {
    if (!snapshot.revealPending) publish({ revealPending: true });
  },
  /**
   * A dates or travellers panel opened: the search is being edited, so the page keeps what it shows and asks for nothing until
   * the panel closes (Done, an outside click or Escape). Returns the function that ends the edit. Several panels can be open
   * at once (the desktop box and the mobile sheet): editing lasts until the last one closes.
   */
  beginEdit(): () => void {
    edits += 1;
    publish({ editing: true });
    let ended = false;
    return () => {
      if (ended) return;
      ended = true;
      edits = Math.max(0, edits - 1);
      if (edits === 0) publish({ editing: false });
    };
  },
  /** The booking sheet opened or closed: while it is open a pending reveal waits. */
  holdReveal(held: boolean) {
    if (snapshot.revealHeld !== held) publish({ revealHeld: held });
  },
  /** True once (and clears the flag) when a reveal was pending and nothing holds it. */
  consumeReveal(): boolean {
    if (!snapshot.revealPending || snapshot.revealHeld) return false;
    publish({ revealPending: false });
    return true;
  },

  /** For tests: forget everything. */
  reset() {
    cancel();
    cache.clear();
    currentKey = null;
    lastRequest = null;
    fetcher = null;
    snapshot = IDLE;
    edits = 0;
    listeners.forEach((listener) => listener());
  },
};
