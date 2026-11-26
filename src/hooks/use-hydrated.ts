import { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/** False on the server and during hydration, true afterwards: what depends on the URL or the browser renders only once it is true, so the server HTML is the same for every request. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}
