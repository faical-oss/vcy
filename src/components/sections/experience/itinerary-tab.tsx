"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";
import { cn } from "@/helpers/cn";
import type { ItineraryDay } from "@/interfaces";

/**
 * Day-by-day itinerary as a single-open accordion: the first day is open on load, opening another closes the previous one.
 * Every day's text is in the server HTML (closed panels are only `hidden`), so search engines read the whole itinerary.
 * Rows are real buttons with `aria-expanded` and `aria-controls`; the open panel has the photo (88 x 66) and the text.
 */
export function ItineraryTab({ days }: { days: ItineraryDay[] }) {
  const base = useId();
  const [open, setOpen] = useState<number | null>(days[0]?.day ?? null);

  return (
    <section aria-labelledby="itinerary-heading">
      <h2 id="itinerary-heading" className="font-display text-title-sm font-medium text-primary">
        Day-by-day itinerary
      </h2>
      <p className="mt-2 text-sm text-body">All schedules are indicative and may be adjusted based on group needs and conditions.</p>
      <ol className="mt-5 space-y-2">
        {days.map((day) => {
          const expanded = open === day.day;
          return (
            <li key={day.day} className="border border-border bg-card">
              <h3>
                <button
                  type="button"
                  id={`${base}-day-${day.day}`}
                  aria-expanded={expanded}
                  aria-controls={`${base}-panel-${day.day}`}
                  onClick={() => setOpen(expanded ? null : day.day)}
                  className="flex w-full items-center gap-4 px-4 py-3.5 text-left"
                >
                  <span className="w-12 shrink-0 text-micro uppercase tracking-widest text-body">Day {day.day}</span>
                  <span className="flex-1 text-sm font-medium text-primary">{day.title}</span>
                  {expanded ? <ChevronDown className="size-4 shrink-0 text-muted-blue" aria-hidden /> : <ChevronRight className="size-4 shrink-0 text-muted-blue" aria-hidden />}
                </button>
              </h3>
              <div id={`${base}-panel-${day.day}`} role="region" aria-labelledby={`${base}-day-${day.day}`} hidden={!expanded} className={cn("gap-4 border-t border-border px-4 py-4", expanded && "flex")}>
                <div className="relative h-[66px] w-[88px] shrink-0 overflow-hidden">
                  <Image src={day.image.src} alt={day.image.alt} fill sizes="88px" className="object-cover" />
                </div>
                <p className="text-sm leading-relaxed text-body">{day.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
