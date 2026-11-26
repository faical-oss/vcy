"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/helpers/cn";

export interface DateRange {
  start: string | null;
  end: string | null;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const DAY_FORMAT = new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const MS_PER_DAY = 86_400_000;

const iso = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
const addDays = (day: string, delta: number) => new Date(Date.parse(`${day}T00:00:00Z`) + delta * MS_PER_DAY).toISOString().slice(0, 10);

/** Days of one month with leading blanks; weeks start on Monday. Dates are ISO strings, so there is no time zone drift. */
function monthCells(year: number, month: number): (string | null)[] {
  const leading = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return [...Array.from({ length: leading }, () => null), ...Array.from({ length: days }, (_, index) => iso(year, month, index + 1))];
}

/**
 * Check-in and check-out in one calendar: click a day to start, click a later day to end. Two months side by side
 * (stacked on narrow screens), each header with previous and next arrows. Days before `minDate` are disabled.
 * Keyboard: Tab enters the grid at one day (the check-in, or the first free day); the arrow keys move by a day or a week
 * (turning the month when needed), Enter or Space picks. The caller owns the value.
 */
export function DateRangePicker({ value, onChange, minDate }: { value: DateRange; onChange: (next: DateRange) => void; minDate: string }) {
  const start = value.start ?? minDate;
  const [view, setView] = useState({ year: Number(start.slice(0, 4)), month: Number(start.slice(5, 7)) - 1 });
  const days = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);

  useEffect(() => {
    if (pendingFocus && days.current[pendingFocus]) {
      days.current[pendingFocus]?.focus();
      setPendingFocus(null);
    }
  }, [pendingFocus, view]);

  function pick(day: string) {
    if (!value.start || value.end || day <= value.start) onChange({ start: day, end: null });
    else onChange({ start: value.start, end: day });
  }

  const shift = (delta: number) => setView((current) => ({ year: current.year + Math.floor((current.month + delta) / 12), month: (((current.month + delta) % 12) + 12) % 12 }));
  const canGoBack = iso(view.year, view.month, 1) > `${minDate.slice(0, 7)}-01`;
  const months = [0, 1].map((offset) => {
    const month = view.month + offset;
    return { year: view.year + Math.floor(month / 12), month: month % 12 };
  });
  const shown = new Set(months.map(({ year, month }) => iso(year, month, 1).slice(0, 7)));
  const tabbable = value.start && value.start >= minDate ? value.start : minDate;

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, day: string) {
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (!delta) return;
    event.preventDefault();
    const target = addDays(day, delta);
    if (target < minDate) return;
    if (!shown.has(target.slice(0, 7))) setView({ year: Number(target.slice(0, 4)), month: Number(target.slice(5, 7)) - 1 - (target > day ? 1 : 0) });
    setPendingFocus(target);
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2" role="group" aria-label="Choose check-in and check-out dates">
      {months.map(({ year, month }, index) => (
        <div key={`${year}-${month}`}>
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => shift(-1)} disabled={!canGoBack} aria-label={index === 0 ? "Previous month" : "Earlier months"} className="flex size-6 items-center justify-center text-primary disabled:opacity-30">
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <p className="text-sm font-semibold text-primary">{MONTH_FORMAT.format(new Date(Date.UTC(year, month, 1)))}</p>
            <button type="button" onClick={() => shift(1)} aria-label={index === 1 ? "Next month" : "Later months"} className="flex size-6 items-center justify-center text-primary">
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-micro text-muted-blue">
            {WEEKDAYS.map((weekday) => (
              <span key={weekday} className="py-1">
                {weekday}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthCells(year, month).map((day, cell) => {
              if (!day) return <span key={`blank-${cell}`} />;
              const selectedStart = day === value.start;
              const selectedEnd = day === value.end;
              const inRange = !!value.start && !!value.end && day > value.start && day < value.end;
              return (
                <button
                  key={day}
                  ref={(node) => {
                    days.current[day] = node;
                  }}
                  type="button"
                  data-day={day}
                  tabIndex={day === tabbable ? 0 : -1}
                  disabled={day < minDate}
                  onClick={() => pick(day)}
                  onKeyDown={(event) => onKeyDown(event, day)}
                  aria-label={DAY_FORMAT.format(new Date(`${day}T00:00:00Z`))}
                  aria-pressed={selectedStart || selectedEnd}
                  className={cn("h-9 border-2 border-card text-sm transition-colors disabled:text-border", selectedStart || selectedEnd ? "bg-primary text-primary-foreground" : inRange ? "bg-surface-blue text-primary" : "text-primary hover:bg-surface")}
                >
                  {Number(day.slice(8))}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
