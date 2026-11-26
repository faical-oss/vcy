"use client";

import { useState } from "react";
import { Pill } from "@/components/ui/pill";
import { ScrollRow } from "@/components/ui/scroll-row";

/** Visual-only filter chips for now; wiring to real filtering comes with the experiences API. */
export function ExperienceFilters({ filters }: { filters: string[] }) {
  const [active, setActive] = useState(filters[0]);
  return (
    <ScrollRow role="group" aria-label="Experience types" className="mt-[calc(1.5rem-8px)]">
      {filters.map((filter) => (
        <Pill key={filter} active={filter === active} onClick={() => setActive(filter)}>
          {filter}
        </Pill>
      ))}
    </ScrollRow>
  );
}
