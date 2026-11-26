"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/helpers/cn";

const FOCUSABLE = "button:not([disabled]), input:not([disabled]), [href], select, textarea, [tabindex]:not([tabindex='-1'])";

interface FiltersDrawerProps {
  open: boolean;
  /** What opened the drawer, and gets focus back. Safari does not focus a button on tap, so `document.activeElement` is not enough. */
  openerRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  onClear: () => void;
  /** Results of the search so far; null while they load. */
  count: number | null;
  children: ReactNode;
}

/**
 * The filters on a phone: a panel sliding in from the left over a dimmed page (288px, 85% of the width at most). Focus moves
 * into it on opening, Tab stays inside, Esc, the dimmed area and the close button shut it, and focus goes back to the button
 * that opened it. The page behind does not scroll (the prototype lets it). The filters apply as they are changed (checkbox, price, stars: a history replace, no new entry) and the drawer stays open, with the focus
 * on the control that changed; only the bottom button, the close button, Escape and the dimmed area close it. Its slide-out keeps it mounted, so it is `inert` while shut.
 */
export function FiltersDrawer({ open, openerRef, onClose, onClear, count, children }: FiltersDrawerProps) {
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = openerRef?.current ?? (document.activeElement as HTMLElement | null);
    closeButton.current?.focus();
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") return onClose();
      if (event.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((entry) => !entry.closest("[hidden]"));
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      html.style.overflow = overflow;
      opener?.focus();
    };
  }, [open, onClose, openerRef]);

  return (
    <div inert={!open} className={cn("fixed inset-0 z-50 transition-[visibility] duration-0 lg:hidden", open ? "visible" : "invisible delay-200")}>
      <div aria-hidden onClick={onClose} className={cn("absolute inset-0 bg-black/40 transition-opacity duration-200 motion-reduce:transition-none", open ? "opacity-100" : "opacity-0")} />
      <div ref={panel} role="dialog" aria-modal="true" aria-label="Filters" className={cn("absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-card pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pt-[env(safe-area-inset-top)] shadow-xl transition-transform duration-200 motion-reduce:transition-none", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-sm font-semibold text-primary">Filters</h2>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClear} className="border-b border-primary text-xs font-medium text-primary">
              Clear all
            </button>
            <button ref={closeButton} type="button" aria-label="Close filters" onClick={onClose} className="flex size-9 items-center justify-center text-primary">
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        <div className="border-t border-border p-4">
          {/* The filters apply as they are changed and the drawer stays open: the new count is announced politely, and the button says it too. */}
          <p role="status" aria-live="polite" className="sr-only">
            {count === null ? "Updating results" : `${count} ${count === 1 ? "result" : "results"}`}
          </p>
          <Button size="lg" className="w-full uppercase tracking-cta" onClick={onClose}>
            {count === null ? "Show results" : `Show ${count} ${count === 1 ? "result" : "results"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
