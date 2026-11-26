"use client";

import { useSyncExternalStore } from "react";
import { todayIso } from "@/helpers/stay-params";

const never = () => () => {};

/**
 * Today's date (ISO, UTC) in the browser, and null on the server and on the hydration render. A page that is prerendered must not
 * read the clock while rendering (Next would freeze that moment into the HTML), so anything that needs "today" waits for this.
 */
export function useToday(): string | null {
  return useSyncExternalStore(never, todayIso, () => null);
}
