"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { cn } from "@/helpers/cn";

/** Space kept between a panel and the edge of the screen. */
export const PANEL_GUTTER = 16;
const LG = 1024;

interface AnchoredPanelProps {
  /** The element the panel must stay inside (the search bar): never wider than it, and never outside it. Falls back to the field. */
  bounds: RefObject<HTMLElement | null>;
  /** The panel's own width in rem (the dates, the list, the travellers). */
  width: number;
  /** Below `lg` the panel is as wide as the whole `bounds` row instead of `width` (the lists of the type and destination fields). */
  rowBelowLg?: boolean;
  children: ReactNode;
}

/**
 * Where a search popover goes, decided once for every panel of the search box (hero, docked and every page's search section).
 * It hangs under its field (its offset parent) with its left edge on the field's. If it would stick out of `bounds` it shifts
 * left until it fits, it is never wider than `bounds`, and it keeps `PANEL_GUTTER` to the viewport, so it cannot widen the page.
 * It is measured before the first paint (invisible until then) and again when the window or the bar is resized.
 */
export function AnchoredPanel({ bounds, width, rowBelowLg = false, children }: AnchoredPanelProps) {
  const panel = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const element = panel.current;
    const field = element?.offsetParent as HTMLElement | null;
    if (!element) return;
    if (!field) {
      // No layout (jsdom): show it where it hangs.
      setPlace({ left: 0, width: width * 16 });
      return;
    }
    const measure = () => {
      const fieldBox = field.getBoundingClientRect();
      const boundsBox = (bounds.current ?? field).getBoundingClientRect();
      const viewport = document.documentElement.clientWidth;
      const min = Math.max(boundsBox.left, PANEL_GUTTER);
      const max = Math.min(boundsBox.right, viewport - PANEL_GUTTER);
      const room = Math.max(0, max - min);
      if (rowBelowLg && viewport < LG) {
        setPlace({ left: min - fieldBox.left, width: room });
        return;
      }
      const wanted = width * parseFloat(getComputedStyle(document.documentElement).fontSize);
      const used = Math.min(wanted, room);
      const left = Math.min(Math.max(fieldBox.left, min), max - used);
      setPlace({ left: left - fieldBox.left, width: used });
    };
    measure();
    window.addEventListener("resize", measure);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(bounds.current ?? field);
    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [bounds, width, rowBelowLg]);

  return (
    <div
      ref={panel}
      data-search-panel
      style={place ? { left: place.left, width: place.width } : { left: 0, opacity: 0 }}
      className="absolute top-full z-40 mt-2"
    >
      {children}
    </div>
  );
}

interface SearchSheetProps {
  /** Name of the sheet (its title): "Choose your dates". */
  title: string;
  onClose: () => void;
  /** The field that opened the sheet: it gets the focus back when the sheet closes. */
  returnFocusTo: RefObject<HTMLElement | null>;
  children: ReactNode;
}

/**
 * Below `lg` the dates and the travellers open as a sheet from the bottom: the whole width, a title with a 44px Close button, the
 * content scrolling inside it when it is tall, the page behind it locked, focus kept inside and returned to the field, Escape and a
 * tap outside close it. It is in a portal, above the sticky header, tabs and docked bar.
 */
export function SearchSheet({ title, onClose, returnFocusTo, children }: SearchSheetProps) {
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50" />
        <Dialog.Content
          data-search-sheet
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusTo.current?.focus();
          }}
          className={cn(
            "fixed inset-x-0 bottom-0 z-[70] flex max-h-[90dvh] flex-col bg-card shadow-xl focus:outline-none",
            "pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]",
          )}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-1">
            <Dialog.Title className="font-display text-title-sm text-primary">{title}</Dialog.Title>
            <Dialog.Close aria-label={`Close ${title.toLowerCase()}`} className="-mr-2 flex size-11 items-center justify-center rounded-full text-body hover:bg-surface">
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
