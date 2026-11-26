"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { CalendarDays, ChevronUp, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { barSummary } from "@/helpers/booking-bar-summary";
import { BookingSheetIntentContext, type BookingSheetIntent } from "@/hooks/use-booking-sheet-intent";
import { useAvailability } from "@/hooks/use-availability";
import { useBookingState, type BookingTarget } from "@/hooks/use-booking-state";
import { useStay } from "@/hooks/use-stay";
import { useToday } from "@/hooks/use-today";
import { availabilityStore } from "@/store/availability-store";
import { BookingBarPrice, BookingBarSummary } from "./booking-bar-summary";

/**
 * Below `lg` the booking box is not in the page: a bar fixed to the bottom shows the search and a button, and the box (`children`)
 * opens as a sheet. The bar says what the desktop booking card says (see `barSummary`): the dates and the travellers, for hotels
 * the rooms chosen on the left, and on the right the price per night or per person (or, for a hotel with its rooms chosen, the total) above the button. The whole summary is one
 * button (a border, a chevron, a pressed and a focus state, 64px high); its name is its visible text followed by "Change dates and
 * guests". Tapping it opens the sheet with the panel that needs attention open (the travellers when they are the problem, else
 * nothing). With no dates the bar is one full-width "Select dates" button that opens the dates. The primary button follows the
 * booking card's state (`useBookingState`): "Select dates" or "Review search" opens the sheet, "Checking…" is disabled, "Reserve now"
 * goes to the checkout (or opens the sheet when there is none), and is disabled when no room is available. The bar is at least 5rem
 * high (plus the bottom safe area) and as tall as its content: a ResizeObserver publishes its height as `--booking-bar-h`, which the page's
 * spacer and the footer's use, so neither is ever covered.
 * A link to `#<hash>` (for example "Select room") opens the sheet too. While the sheet is open a pending switch to the Rooms tab
 * waits (`availabilityStore.holdReveal`) and happens when it closes.
 */
export function MobileBookingBar({ children, hash, label, booking }: { children: ReactNode; hash: string; label: string; booking: BookingTarget }) {
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<BookingSheetIntent>(null);
  // The button that opened the sheet gets the focus back when it closes (two buttons open it, and Radix returns it to only one of them).
  const opener = useRef<HTMLElement | null>(null);
  const state = useBookingState(booking);
  const stay = useStay();
  const availability = useAvailability();
  const today = useToday();
  const summary = today ? barSummary({ stay, availability, booking: state, selectable: booking.rooms, today }) : null;

  // The bar's height follows its content (the rooms list): publish it as `--booking-bar-h`, which the page's spacer and the footer use.
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = bar.current;
    if (!element) return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty("--booking-bar-h", `${element.getBoundingClientRect().height}px`);
    publish();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(publish);
    observer?.observe(element);
    window.addEventListener("resize", publish);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", publish);
      root.style.removeProperty("--booking-bar-h");
    };
  }, []);

  useEffect(() => {
    availabilityStore.holdReveal(open);
    return () => availabilityStore.holdReveal(false);
  }, [open]);

  useEffect(() => {
    const check = () => {
      if (window.location.hash === `#${hash}` && window.matchMedia("(max-width: 1023px)").matches) {
        setIntent(null);
        setOpen(true);
      }
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [hash]);

  const primary =
    state.kind === "reserve" && booking.checkout.enabled ? (
      <Button type="button" size="lg" className="shrink-0 px-5" onClick={state.reserve}>
        {state.barLabel}
      </Button>
    ) : (
      <Dialog.Trigger asChild>
        <Button
          type="button"
          size="lg"
          className={summary ? "shrink-0 px-5" : "h-14 w-full"}
          disabled={state.disabled}
          aria-busy={state.kind === "busy" || undefined}
          onClick={(event) => {
            opener.current = event.currentTarget;
            // "Select dates" opens the dates; a search that is not valid opens what is wrong with it.
            setIntent(state.kind === "prompt" ? state.panel : null);
            if (state.kind === "prompt") availabilityStore.markReveal();
          }}
        >
          {summary ? null : <CalendarDays className="size-5" aria-hidden />}
          {state.barLabel}
        </Button>
      </Dialog.Trigger>
    );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div ref={bar} data-booking-bar className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] shadow-header lg:hidden">
        {/* At least 5rem in all (this row and the 1px border above it); taller when the rooms list is. */}
        <div className="flex min-h-[calc(5rem-1px)] items-center gap-3 px-4 py-0.5">
          {summary ? (
            <>
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  data-booking-summary
                  onClick={(event) => {
                    opener.current = event.currentTarget;
                    setIntent(state.panel);
                  }}
                  className="flex min-h-[4.5rem] min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-md border border-border px-3 py-1 text-left transition-colors hover:bg-surface active:bg-surface-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <BookingBarSummary summary={summary} />
                  <ChevronUp className="ml-auto size-4 shrink-0 text-primary" aria-hidden />
                  {/* Part of the name, after the visible text: the name starts with what is on screen (WCAG 2.5.3). */}
                  <span className="sr-only">. Change dates and guests</span>
                </button>
              </Dialog.Trigger>
              {/* Right side: the price above the button, so the left side has the room for the dates and every room. */}
              <div className="flex shrink-0 flex-col items-end justify-center gap-1">
                <BookingBarPrice summary={summary} />
                {primary}
              </div>
            </>
          ) : (
            primary
          )}
        </div>
      </div>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 lg:hidden" />
        <Dialog.Content
          onCloseAutoFocus={(event) => {
            if (!opener.current) return;
            event.preventDefault();
            opener.current.focus();
          }}
          className="fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="font-display text-title-sm text-primary">{label}</Dialog.Title>
            <Dialog.Close aria-label="Close booking" className="flex size-10 items-center justify-center border border-border hover:bg-surface">
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Select your dates to see prices.</Dialog.Description>
          <BookingSheetIntentContext.Provider value={intent}>{children}</BookingSheetIntentContext.Provider>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
