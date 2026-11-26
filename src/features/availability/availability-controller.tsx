"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { toRoomRequest, type ProductRef } from "@/helpers/availability-request";
import { writeStayToSearch } from "@/helpers/stay-url";
import { useAvailability } from "@/hooks/use-availability";
import { useStay } from "@/hooks/use-stay";
import { useToday } from "@/hooks/use-today";
import { getRoomAvailability } from "@/services/room-availability";
import { availabilityStore } from "@/store/availability-store";
import { stayStore } from "@/store/stay-store";

/**
 * The one place that decides when to ask for room availability. Render it once on a hotel or experience page (it renders
 * nothing). It never runs on the server: everything here is a browser effect, so the page's HTML is the same for every search.
 *  - Reads the search (dates, adults, children and their ages, rooms) from the stay store, which starts from the URL and then the
 *    search saved for the page, before the first paint.
 *  - Asks only for a complete, valid search (`toRoomRequest`), and only once it is committed: at once for a link or a saved
 *    search, and after an edit when its dates or travellers panel closes (Done, an outside click or Escape; the date picker
 *    closes itself when the range is complete). While a panel is open nothing is asked and the page keeps what it shows. An
 *    identical search is never asked twice; older answers are ignored.
 *  - Keeps the URL in sync with the search (replace state, never a new history entry): it holds a valid search and nothing else
 *    of the stay. It does not change tabs or scroll, except to show the Rooms tab (`#rooms`) once when the visitor started the
 *    search with "Check availability".
 */
export function AvailabilityController({ product }: { product: ProductRef }) {
  const pathname = usePathname();
  const stay = useStay();
  const { status, revealPending, revealHeld, editing } = useAvailability();
  const today = useToday();
  const durationKey = JSON.stringify(product.duration ?? null);

  const request = useMemo(
    () => (today ? toRoomRequest({ checkIn: stay.checkIn, checkOut: stay.checkOut, rooms: stay.rooms, adults: stay.adults, children: stay.children, childAges: stay.childAges, flexDays: stay.flexDays }, product, today) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `product` is static per page; its fields are the dependencies
    [today, stay.checkIn, stay.checkOut, stay.rooms, stay.adults, stay.children, stay.childAges, stay.flexDays, product.kind, product.id, durationKey],
  );
  const requestKey = request ? JSON.stringify(request) : "";
  // The state this render saw is the started store's own (not the defaults of the server render): only then may it touch the URL.
  const started = stay === stayStore.getSnapshot() && stay.key === pathname;

  useEffect(() => {
    availabilityStore.configure({ fetcher: (given, signal) => getRoomAvailability(given, { signal, mock: new URLSearchParams(window.location.search).get("mock") }) });
  }, []);

  // First load: dates from the URL or the saved search that are not a valid search (past, outside the minimum and maximum nights...) are
  // dropped, so the page starts in the plain no-dates state instead of showing dates it cannot use.
  const checkedFirstLoad = useRef(false);
  useEffect(() => {
    if (!started || !today || checkedFirstLoad.current) return;
    checkedFirstLoad.current = true;
    // A child without an age is incomplete, not invalid: the dates stay and the form asks for the age.
    const agesFilled = { checkIn: stay.checkIn, checkOut: stay.checkOut, rooms: stay.rooms, adults: stay.adults, children: stay.children, childAges: stay.childAges.map((age) => age ?? 0), flexDays: stay.flexDays };
    if (stay.checkIn || stay.checkOut) {
      const usable = toRoomRequest(agesFilled, product, today);
      if (!usable) stayStore.setDates(null, null);
      // A fixed-duration product repairs a link whose end date is not the start plus its nights, instead of dropping the dates.
      else if (usable.checkOut !== stay.checkOut) stayStore.setDates(usable.checkIn, usable.checkOut);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per page; the other fields are read at that moment
  }, [started, today]);

  // Asks when the search is committed: a link or a saved search at once, and after an edit when its panel closes (Done, an outside
  // click or Escape), never while a panel is open, so each change does not refresh the rooms.
  useEffect(() => {
    if (!started || editing) return;
    availabilityStore.request(request, { immediate: true });
  }, [requestKey, started, request, editing]);

  useEffect(() => {
    if (!started || editing) return;
    const next = writeStayToSearch(window.location.search, request ? { checkIn: stay.checkIn, checkOut: stay.checkOut, rooms: stay.rooms, adults: stay.adults, children: stay.children, childAges: stay.childAges, flexDays: stay.flexDays } : null);
    if (next === window.location.search.replace(/^\?/, "")) return;
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${next ? `?${next}` : ""}${window.location.hash}`);
  }, [requestKey, started, editing, request, stay.checkIn, stay.checkOut, stay.rooms, stay.adults, stay.children, stay.childAges, stay.flexDays]);

  // The search was started with "Check availability": show the Rooms tab once it starts.
  // On mobile the booking sheet holds it: the switch happens when the sheet closes, not behind it.
  useEffect(() => {
    if (status === "idle" || !revealPending || revealHeld) return;
    const frame = requestAnimationFrame(() => {
      if (availabilityStore.consumeReveal()) window.location.hash = "rooms";
    });
    return () => cancelAnimationFrame(frame);
  }, [status, revealPending, revealHeld]);

  return null;
}
