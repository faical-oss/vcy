"use client";

import { ScrollRow } from "@/components/ui/scroll-row";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { cn } from "@/helpers/cn";
import { STAY_LIMITS } from "@/helpers/stay-params";
import { FLEX_OPTIONS } from "@/helpers/stay-url";

export const flexLabel = (days: number) => (days === 0 ? "Exact dates" : `± ${days} ${days === 1 ? "day" : "days"}`);
const AGES = Array.from({ length: STAY_LIMITS.maxChildAge + 1 }, (_, age) => age);
const ageLabel = (age: number) => (age === 0 ? "Under 1" : `${age} ${age === 1 ? "yr" : "yrs"}`);

/** Rooms, adults or children: a label, an optional hint and round minus and plus buttons within `min` and `max`. */
export function Stepper({ label, hint, value, min, max, onChange, large = false }: { label: string; hint?: string; value: number; min: number; max: number; onChange: (next: number) => void; /** 44px buttons (the search box), else 36px. */ large?: boolean }) {
  const round = cn("flex items-center justify-center rounded-full border border-border text-primary disabled:opacity-40", large ? "size-11" : "size-9");
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div>
        <p className="text-sm font-medium text-primary">{label}</p>
        {hint ? <p className="text-xs text-muted-blue">{hint}</p> : null}
      </div>
      <div className="flex items-center gap-4">
        <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)} className={round}>
          <Minus className="size-3.5" aria-hidden />
        </button>
        <span className="w-4 text-center text-sm text-primary" aria-live="polite">
          {value}
        </span>
        <button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)} className={round}>
          <Plus className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/** One age select per child (0-17). There is no default: a child without an age shows "Select age" and makes the search invalid. */
export function ChildAges({ ages, onChange }: { ages: (number | null)[]; onChange: (index: number, age: number | null) => void }) {
  if (ages.length === 0) return null;
  const missing = ages.some((age) => age === null);
  return (
    <div className="space-y-3 py-3">
      <p className="text-micro uppercase tracking-widest text-muted-blue">Child ages</p>
      {ages.map((age, index) => {
        const id = `child-age-${index}`;
        return (
          <div key={id} className="flex items-center justify-between gap-3">
            <label htmlFor={id} className="text-sm text-body">
              Child {index + 1}
            </label>
            <span className="relative">
              <select
                id={id}
                required
                value={age ?? ""}
                aria-invalid={age === null || undefined}
                aria-describedby={age === null ? "child-ages-error" : undefined}
                onChange={(event) => onChange(index, event.target.value === "" ? null : Number(event.target.value))}
                className={cn("h-10 w-36 appearance-none border bg-card pl-3 pr-8 text-sm focus:border-accent", age === null ? "border-error text-body" : "border-border text-primary")}
              >
                <option value="" disabled>
                  Select age
                </option>
                {AGES.map((value) => (
                  <option key={value} value={value}>
                    {ageLabel(value)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-blue" aria-hidden />
            </span>
          </div>
        );
      })}
      {missing ? (
        <p id="child-ages-error" role="alert" className="text-xs text-error">
          Select the age of each child.
        </p>
      ) : null}
    </div>
  );
}

/** "Flexibility": exact dates or plus or minus 1, 2, 3 or 7 days. */
export function FlexChips({ value, onChange }: { value: number; onChange: (days: number) => void }) {
  return (
    <div className="border-t border-border pt-4">
      <p id="flex-label" className="text-micro uppercase tracking-widest text-muted-blue">
        Flexibility
      </p>
      <ScrollRow role="group" aria-labelledby="flex-label" className="mt-[calc(0.75rem-8px)]">
        {FLEX_OPTIONS.map((days) => (
          <button
            key={days}
            type="button"
            aria-pressed={value === days}
            onClick={() => onChange(days)}
            className={cn("h-10 border px-4 text-sm transition-colors", value === days ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-primary hover:bg-surface")}
          >
            {flexLabel(days)}
          </button>
        ))}
      </ScrollRow>
    </div>
  );
}
