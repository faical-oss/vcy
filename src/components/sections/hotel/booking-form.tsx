"use client";

import { CalendarDays, ChevronDown, Users, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { ChildAges, FlexChips, Stepper } from "@/components/ui/guest-fields";
import { cn } from "@/helpers/cn";
import { minimumGroupNote, travellerLimits } from "@/helpers/experience-stay";
import { DEFAULT_GROUP_SIZE, FLEXIBLE_STAY, departureEnd, durationHint, isFixedStay, isNightsAllowed } from "@/helpers/stay-duration";
import { nightsBetween } from "@/helpers/stay-params";
import { formatDateShort } from "@/helpers/format";
import { STAY_LIMITS, todayIso } from "@/helpers/stay-params";
import { useBookingSheetIntent } from "@/hooks/use-booking-sheet-intent";
import { useBookingState, type BookingTarget } from "@/hooks/use-booking-state";
import { useStay } from "@/hooks/use-stay";
import { availabilityStore } from "@/store/availability-store";
import { stayStore } from "@/store/stay-store";
import { DateRangePicker } from "./date-range-picker";

function DateBox({ label, value, active }: { label: string; value: string | null; active: boolean }) {
  return (
    <div className={cn("border px-3 py-2.5", active ? "border-primary" : "border-border")}>
      <p className="text-micro uppercase tracking-widest text-muted-blue">{label}</p>
      <p className="text-sm text-primary">{value ? formatDateShort(value) : "Select date"}</p>
    </div>
  );
}

function FieldButton({ icon: Icon, label, value, placeholder, open, onClick, buttonRef, className }: { icon: LucideIcon; label: string; value: string | null; placeholder?: boolean; open: boolean; onClick: () => void; buttonRef: React.Ref<HTMLButtonElement>; className?: string }) {
  return (
    <button ref={buttonRef} type="button" aria-expanded={open} onClick={onClick} className={cn("flex w-full items-center gap-3 px-3 py-2.5 text-left", className)}>
      <Icon className="size-4 shrink-0 text-muted-blue" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-micro uppercase tracking-widest text-muted-blue">{label}</span>
        <span className={cn("block text-sm", placeholder ? "text-muted-blue" : "text-primary")}>{value}</span>
      </span>
      <ChevronDown className={cn("size-4 shrink-0 text-muted-blue transition-transform", open && "rotate-180")} aria-hidden />
    </button>
  );
}

/** Floating-panel look of the design: border and a soft shadow (token gap: no token for this larger shadow). */
const PANEL = "z-40 mt-2 border border-border bg-card p-5 shadow-[0_8px_24px_rgb(0_0_0/0.12)] lg:absolute lg:mt-0";

export type { CheckoutTarget, ProductFormOptions } from "@/hooks/use-booking-state";

/**
 * The booking card's form, for hotels and experiences. Dates, travellers (rooms, adults, children with an age each) and
 * flexibility live in the stay store; the URL is kept in sync by `AvailabilityController`, which also asks for availability.
 * ONE primary button whose label follows the state: no dates "Check availability" (it opens the dates, no call is made; once the
 * range is chosen, availability loads at once); loading a disabled "Checking availability…"; rooms available "Reserve now"
 * (checkout with dates, adults, children ages, rooms and the product id); none available or an error a disabled "Reserve now",
 * and for an error a Retry. Availability is asked when a panel closes (Done, outside click, Escape), not on every change. Product mode (`product`, experiences
 * and packages): the same labels, panels and buttons as hotels; with a fixed duration a start date sets the end date, with a flexible one the
 * range is picked as for a hotel, within the minimum and maximum nights; the steppers stop at the maximum group size
 * and the minimum shows as a note ("Runs with 4+ guests").
 */
export function BookingForm({ product, checkout, rooms: selectable }: BookingTarget) {
  const stay = useStay();
  const { rooms, adults, children, childAges, flexDays } = stay;
  const range = { start: stay.checkIn, end: stay.checkOut };
  const booking = useBookingState({ product, checkout, rooms: selectable });
  // In the mobile sheet the bar says which panel to open (the dates when there are none, the travellers when they are the problem); the desktop box ignores it.
  const intent = useBookingSheetIntent();
  const [open, setOpen] = useState<"dates" | "guests" | null>(intent);
  const wrapper = useRef<HTMLDivElement>(null);
  const datesButton = useRef<HTMLButtonElement>(null);
  const guestsButton = useRef<HTMLButtonElement>(null);
  const datesPanel = useRef<HTMLDivElement>(null);

  const group = product?.group ?? DEFAULT_GROUP_SIZE;
  const duration = product?.duration ?? FLEXIBLE_STAY;
  const fixed = isFixedStay(duration);
  // The range is complete (a fixed duration: the start date, the end follows): the picker closes and availability loads at once.
  const onRange = (next: { start: string | null; end: string | null }) => {
    if (fixed && next.start) stayStore.setDates(next.start, departureEnd(next.start, duration.nights));
    else stayStore.setDates(next.start, next.end);
    // A flexible range outside its minimum and maximum nights stays open, with the message: every date can be picked, the range is checked.
    const outside = !fixed && !!next.start && !!next.end && !isNightsAllowed(duration, nightsBetween(next.start, next.end));
    if (next.start && (fixed || next.end) && !outside) {
      setOpen(null);
      datesButton.current?.focus();
    }
  };
  const limits = product ? travellerLimits(group, { adults, children }, { maxAdults: group.max, maxChildren: STAY_LIMITS.maxChildren }) : STAY_LIMITS;

  // While the dates or travellers panel is open the search is being edited: nothing is asked until it closes (Done, an outside
  // click, Escape, or the picker closing itself once the range is complete).
  useEffect(() => {
    if (!open) return;
    return availabilityStore.beginEdit();
  }, [open]);

  // Outside click closes the open panel.
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  // Opening the date popover moves focus into it, onto the day Tab would reach.
  useEffect(() => {
    if (open === "dates") datesPanel.current?.querySelector<HTMLButtonElement>('button[data-day][tabindex="0"]')?.focus();
  }, [open]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape" || !open) return;
    event.stopPropagation();
    const field = open === "dates" ? datesButton : guestsButton;
    setOpen(null);
    field.current?.focus();
  }

  const { kind, label, disabled, note, request, status } = booking;
  const primaryClick = kind === "prompt" ? () => { availabilityStore.markReveal(); setOpen("dates"); } : kind === "reserve" ? booking.reserve : () => {};

  const travellers = adults + children;
  const guestSummary = `${rooms > 1 ? `${rooms} rooms, ` : ""}${travellers} ${travellers === 1 ? "traveller" : "travellers"}`;
  const nightCount = range.start && range.end ? nightsBetween(range.start, range.end) : 0;
  const dateSummary = range.start && range.end ? `${formatDateShort(range.start)} – ${formatDateShort(range.end)}${product ? ` · ${nightCount} ${nightCount === 1 ? "night" : "nights"}` : ""}` : range.start ? `${formatDateShort(range.start)} – select check-out` : "Add dates";
  const toggle = (panel: "dates" | "guests") => setOpen(open === panel ? null : panel);

  return (
    <div ref={wrapper} onKeyDown={onKeyDown} className="space-y-3">
      <div className="border border-primary">
        <div className="relative">
          <FieldButton icon={CalendarDays} label="Check-in – check-out" value={dateSummary} placeholder={!range.start} open={open === "dates"} onClick={() => toggle("dates")} buttonRef={datesButton} className="border-b border-border" />
          {open === "dates" ? (
            <div ref={datesPanel} role="dialog" aria-label="Choose your dates" className={`${PANEL} space-y-5 lg:right-0 lg:top-full lg:w-[560px]`}>
              <div className="grid gap-3 sm:grid-cols-2">
                <DateBox label="Check in" value={range.start} active={!range.start || !!range.end} />
                <DateBox label="Check out" value={range.end} active={!!range.start && !range.end} />
              </div>
              <DateRangePicker value={range} onChange={onRange} minDate={todayIso()} />
              {booking.rangeMessage ? (
                <p role="alert" className="text-xs font-medium text-error">
                  {booking.rangeMessage}
                </p>
              ) : product && durationHint(duration, product.noun ?? "experience") ? (
                <p className="text-xs text-body">{durationHint(duration, product.noun ?? "experience")}</p>
              ) : null}
              <FlexChips value={flexDays} onChange={stayStore.setFlexDays} />
              <div className="flex items-center justify-between border-t border-border pt-4">
                <button type="button" onClick={() => stayStore.setDates(null, null)} className="text-sm text-primary underline">
                  Clear
                </button>
                <Button
                  type="button"
                  size="md"
                  className="px-8"
                  onClick={() => {
                    setOpen(null);
                    datesButton.current?.focus();
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="relative">
          <FieldButton icon={Users} label="Rooms & guests" value={guestSummary} open={open === "guests"} onClick={() => toggle("guests")} buttonRef={guestsButton} />
          {open === "guests" ? (
            <div role="dialog" aria-label="Rooms and guests" className={`${PANEL} lg:inset-x-[-1px] lg:top-full`}>
              <div className="divide-y divide-border">
                <Stepper label="Rooms" value={rooms} min={1} max={STAY_LIMITS.maxRooms} onChange={stayStore.setRooms} />
                <Stepper label="Adults" hint="Age 18+" value={adults} min={1} max={limits.maxAdults} onChange={stayStore.setAdults} />
                <Stepper label="Children" hint="Ages 0–17" value={children} min={0} max={limits.maxChildren} onChange={stayStore.setChildren} />
                <ChildAges ages={childAges} onChange={stayStore.setChildAge} />
              </div>
              {product ? <p className="mt-2 text-xs text-body">Up to {group.max} travellers.</p> : null}
              <Button
                type="button"
                size="md"
                className="mt-3 w-full"
                onClick={() => {
                  setOpen(null);
                  guestsButton.current?.focus();
                }}
              >
                Done
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {product && minimumGroupNote(group) ? <p className="text-center text-xs text-body">{minimumGroupNote(group)}</p> : null}

      <div>
        <Button
          type="button"
          size="lg"
          disabled={disabled}
          aria-busy={status === "loading" || undefined}
          aria-describedby="availability-note"
          className="h-14 w-full uppercase tracking-cta"
          onClick={primaryClick}
        >
          {label}
        </Button>
        <div id="availability-note" role="status" className="mt-2 text-center text-xs text-body">
          {note}
          {status === "error" && request ? (
            <button type="button" onClick={() => availabilityStore.retry()} className="ml-1 font-medium text-primary underline">
              Retry
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
