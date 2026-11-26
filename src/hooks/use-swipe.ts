import { useRef, type TouchEvent } from "react";

/** A mostly horizontal drag of 40px or more calls `onSwipe(-1)` (left: next) or `onSwipe(1)` (right: previous). Vertical scrolling is left alone. Spread the result on the element. */
export function useSwipe(onSwipe: (direction: 1 | -1) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart: (event: TouchEvent) => {
      start.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    },
    onTouchEnd: (event: TouchEvent) => {
      const from = start.current;
      start.current = null;
      const to = event.changedTouches[0];
      if (!from || !to) return;
      const dx = to.clientX - from.x;
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(to.clientY - from.y)) onSwipe(dx < 0 ? -1 : 1);
    },
  };
}
