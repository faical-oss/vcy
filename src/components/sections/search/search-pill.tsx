"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type FocusEvent } from "react";
import { cn } from "@/helpers/cn";
import { datesSummary, travellerSummary, type SearchBoxState } from "@/helpers/search-box";
import type { SearchBoxContent } from "@/interfaces";
import { SearchBar } from "./search-bar";

/** What the pill says: where, and under it the dates and the travellers. */
export interface PillSummary {
  where: string;
  dates: string;
  who: string;
}

/** The pill's text for a state of the search box: the picked type and destination (or the text typed), "Anywhere" when there are none. */
export function pillSummary(state: Pick<SearchBoxState, "type" | "typeText" | "destination" | "destinationText" | "checkIn" | "checkOut" | "adults" | "children">): PillSummary {
  const where = [state.type?.label ?? state.typeText.trim(), state.destination?.label ?? state.destinationText.trim()].filter(Boolean).join(" · ");
  return { where: where || "Anywhere", dates: datesSummary(state), who: travellerSummary(state) };
}

/** The visible part of the screen while the on-screen keyboard is up: the sheet follows it, so the field and the Search button stay in view. */
function useVisibleBox(): { top: number; height: number } | null {
  const [box, setBox] = useState<{ top: number; height: number } | null>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => setBox({ top: viewport.offsetTop, height: viewport.height });
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);
  return box;
}

function PillSheet({ content, onClose }: { content: SearchBoxContent; onClose: () => void }) {
  const box = useVisibleBox();
  const ref = useRef<HTMLDivElement>(null);
  // A field that takes the focus (the keyboard comes up) is brought to the middle of the visible part of the sheet.
  const reveal = (event: FocusEvent<HTMLElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.closest("[data-sheet-body]")) return;
    window.setTimeout(() => target.scrollIntoView({ block: "center", behavior: "smooth" }), 250);
  };
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-x-0 bottom-0 top-header z-[70] bg-black/40 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none" />
      <Dialog.Content
        ref={ref}
        aria-describedby={undefined}
        // While a field's list or panel is open Escape closes that first (the bar's own handler); a second Escape closes the sheet.
        onEscapeKeyDown={(event) => {
          if (ref.current?.querySelector("[data-panel-open]")) event.preventDefault();
        }}
        onFocusCapture={reveal}
        // With a visual viewport the sheet sits on the top of what is visible (the keyboard comes up under it) and is at most 90% of it; without one, `dvh` does it.
        style={box ? ({ "--sheet-top": `${Math.max(0, box.top)}px`, "--sheet-max": `${box.height * 0.9}px` } as CSSProperties) : undefined}
        className={cn(
          // A card as tall as its content, directly under the navbar at every width (a flat panel, phones and tablets alike), at most 90dvh: the body scrolls inside when a panel opens. It slides down and back up; Radix keeps it mounted until the exit animation ends, and reduced motion has none.
          "fixed inset-x-0 top-[calc(var(--spacing-header)+var(--sheet-top,0px))] z-[70] flex max-h-[calc(var(--sheet-max,90dvh)-var(--spacing-header))] flex-col overflow-hidden border-b border-border bg-card shadow-header focus:outline-none",
          "data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none",
          "pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]",
        )}
      >
        <Dialog.Title className="sr-only">Search</Dialog.Title>
        <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col">
          <SearchBar variant="sheet" content={content} onClose={onClose} onSearched={onClose} />
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

/**
 * The search below `xl` as one pill: where, the dates and the travellers on two lines, a search icon. It opens the whole search as a
 * sheet (`SearchBar variant="sheet"`: tabs and a Close button on top, the fields stacked and large, the Search button under the last
 * field): a flat panel as tall as its content directly under the navbar with a dimmed backdrop, at most 90dvh, the body scrolling
 * inside when a panel opens. The text wraps, it is never cut. The caller says what it shows.
 */
export function SearchPill({ content, summary, className }: { content: SearchBoxContent; summary: PillSummary; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={cn("flex min-h-12 w-full items-center gap-3 rounded-full border border-border bg-card py-1 pl-4 pr-1.5 text-left transition-colors hover:border-primary", className)}
        >
          <Search className="size-4 shrink-0 text-muted-blue" aria-hidden />
          <span className="min-w-0 flex-1">
            {/* Part of the name, in front of the visible text (an aria-label that left the visible text out failed WCAG 2.5.3). */}
            <span className="sr-only">Edit search: </span>
            <span className="block break-words text-sm font-semibold leading-tight text-primary">{summary.where}</span>
            <span className="block break-words text-xs leading-tight text-body">
              {summary.dates} · {summary.who}
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-blue" aria-hidden />
          <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Search className="size-4" />
          </span>
        </button>
      </Dialog.Trigger>
      <PillSheet content={content} onClose={() => setOpen(false)} />
    </Dialog.Root>
  );
}
