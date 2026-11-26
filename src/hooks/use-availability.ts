"use client";

import { useSyncExternalStore } from "react";
import { availabilityStore, type AvailabilitySnapshot } from "@/store/availability-store";

/** The room availability of the page: idle on the server and on the hydration render, so the HTML is the same for every search. */
export function useAvailability(): AvailabilitySnapshot {
  return useSyncExternalStore(availabilityStore.subscribe, availabilityStore.getSnapshot, availabilityStore.getServerSnapshot);
}
