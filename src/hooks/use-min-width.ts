import { useSyncExternalStore } from "react";

const noop = () => {};

/**
 * True while the viewport is at least `px` wide. False on the server; read after hydration (a page that needs it renders its shell first).
 * Without `matchMedia` (jsdom) the viewport counts as wide, so a test sees the desktop layout.
 */
export function useMinWidth(px: number): boolean {
  const query = `(min-width: ${px}px)`;
  return useSyncExternalStore(
    (notify) => {
      if (typeof window.matchMedia !== "function") return noop;
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    () => (typeof window.matchMedia === "function" ? window.matchMedia(query).matches : true),
    () => false,
  );
}
