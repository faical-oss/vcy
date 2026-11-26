"use client";

import { useEffect, useRef, type Dispatch } from "react";
import { DateRangePicker } from "@/components/sections/hotel/date-range-picker";
import { Button } from "@/components/ui/button";
import { ChildAges, FlexChips, Stepper } from "@/components/ui/guest-fields";
import { cn } from "@/helpers/cn";
import { formatDateShort } from "@/helpers/format";
import { defaultDates, type SearchAction, type SearchBoxState } from "@/helpers/search-box";
import { STAY_LIMITS, todayIso } from "@/helpers/stay-params";

/*
 * The two heavy popovers of the search box. They live in their own module so the page loads them only when a visitor opens
 * the dates or the travellers (`next/dynamic` in search-bar.tsx): Home's first load does not carry the calendar.
 */

interface PopoverProps {
  state: SearchBoxState;
  dispatch: Dispatch<SearchAction>;
  onDone: () => void;
  className?: string;
  /** Inside the sheet below lg: the sheet is the dialog and draws the frame, so this is a plain group. */
  sheet?: boolean;
}

function DateBox({ label, value, active }: { label: string; value: string | null; active: boolean }) {
  return (
    <div className={cn("border px-3 py-2.5", active ? "border-primary" : "border-border")}>
      <p className="text-micro uppercase tracking-widest text-muted-blue">{label}</p>
      <p className="text-sm text-primary">{value ? formatDateShort(value) : "Select date"}</p>
    </div>
  );
}

/** Check-in and check-out, a two-month calendar (days before today disabled), the flexibility chips, Clear and Done. */
export function DatesPopover({ state, dispatch, onDone, className, sheet }: PopoverProps) {
  const panel = useRef<HTMLDivElement>(null);
  // Opening moves focus into the calendar, onto the day Tab would reach.
  useEffect(() => {
    panel.current?.querySelector<HTMLButtonElement>('button[data-day][tabindex="0"]')?.focus();
  }, []);
  return (
    <div ref={panel} role={sheet ? "group" : "dialog"} aria-label="Choose your dates" className={cn("space-y-5", !sheet && "rounded-card border border-border bg-card p-5 shadow-xl", className)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <DateBox label="Check in" value={state.checkIn} active={!state.checkIn || !!state.checkOut} />
        <DateBox label="Check out" value={state.checkOut} active={!!state.checkIn && !state.checkOut} />
      </div>
      <DateRangePicker value={{ start: state.checkIn, end: state.checkOut }} onChange={({ start, end }) => dispatch({ kind: "dates", checkIn: start, checkOut: end })} minDate={todayIso()} />
      <FlexChips value={state.flexDays} onChange={(days) => dispatch({ kind: "flex", days })} />
      <div className="flex items-center justify-between border-t border-border pt-4">
        <button type="button" onClick={() => dispatch({ kind: "dates", ...defaultDates() })} className="min-h-11 text-sm text-primary underline">
          Clear
        </button>
        <Button type="button" size="md" className="px-8" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}

/** Rooms, adults and children steppers (44px buttons), the child ages, and Done. Limits are the shared guest limits. */
export function TravellersPopover({ state, dispatch, onDone, className, sheet }: PopoverProps) {
  return (
    <div role={sheet ? "group" : "dialog"} aria-label="Rooms and guests" className={cn(!sheet && "rounded-card border border-border bg-card p-4 shadow-xl", className)}>
      <div className="divide-y divide-border">
        <Stepper large label="Rooms" value={state.rooms} min={1} max={STAY_LIMITS.maxRooms} onChange={(value) => dispatch({ kind: "rooms", value })} />
        <Stepper large label="Adults" hint="Age 18+" value={state.adults} min={1} max={STAY_LIMITS.maxAdults} onChange={(value) => dispatch({ kind: "adults", value })} />
        <Stepper large label="Children" hint="Ages 0–17" value={state.children} min={0} max={STAY_LIMITS.maxChildren} onChange={(value) => dispatch({ kind: "children", value })} />
        <ChildAges ages={state.childAges} onChange={(index, age) => dispatch({ kind: "childAge", index, age })} />
      </div>
      <Button type="button" size="md" className="mt-3 w-full" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
