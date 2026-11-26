"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useMemo, useSyncExternalStore } from "react";
import { guestLimitsForPath } from "@/helpers/experience-stay";
import { createStayState, stayStore, type StayState } from "@/store/stay-store";

/**
 * The stay store (dates, guests, child ages, flexibility) for the current detail page. The server render and the hydration
 * render use the defaults, so the server HTML is the same for every search; right after hydration, before the browser paints,
 * the store starts from the URL (when it names dates) or the search saved for the page, and the component re-renders with it.
 * It reads `window.location` there, not `useSearchParams`, so nothing needs a <Suspense> boundary.
 */
export function useStay(): StayState {
  const pathname = usePathname();
  const serverState = useMemo(() => createStayState(pathname, { rooms: 1, adults: 2, children: 0, childAges: [] }, guestLimitsForPath(pathname)), [pathname]);

  // Idempotent per page: only the first call for a pathname starts the store.
  useLayoutEffect(() => {
    stayStore.hydrateFromBrowser(pathname, window.location.search, guestLimitsForPath(pathname));
  }, [pathname]);

  const state = useSyncExternalStore(stayStore.subscribe, stayStore.getSnapshot, () => serverState);

  // Until the store has been started for this page, show the defaults (never another page's leftovers).
  return state.key === pathname ? state : serverState;
}
