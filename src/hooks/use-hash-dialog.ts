"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Open state of a dialog that lives in the URL hash (`#photos`), so the browser's back button closes it. Opening adds a
 * history entry; closing goes back to it (or, when the visitor arrived on a `#photos` link, just removes the hash). The
 * page's own tab hash (`#rooms`) is untouched: it is what the hash returns to. `show` and `hide` are stable.
 */
export function useHashDialog(name: string): { open: boolean; show: () => void; hide: () => void } {
  const [open, setOpen] = useState(false);
  const pushed = useRef(false);
  // `hide` may be called twice for one Escape or click (the dialog and the caller both report it); going back must happen once.
  const closing = useRef(false);
  const target = `#${name}`;

  useEffect(() => {
    const sync = () => {
      const isOpen = window.location.hash === target;
      if (!isOpen) {
        pushed.current = false;
        closing.current = false;
      }
      setOpen(isOpen);
    };
    sync(); // a link that already carries the hash opens the dialog
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, [target]);

  const show = useCallback(() => {
    if (window.location.hash !== target) {
      window.history.pushState(null, "", `${window.location.pathname}${window.location.search}${target}`);
      pushed.current = true;
    }
    closing.current = false;
    setOpen(true);
  }, [target]);

  const hide = useCallback(() => {
    if (closing.current) return;
    if (window.location.hash === target) {
      if (pushed.current) {
        closing.current = true;
        window.history.back(); // popstate follows and closes it
        return;
      }
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
    setOpen(false);
  }, [target]);

  return { open, show, hide };
}
