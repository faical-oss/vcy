"use client";

import { searchSummary } from "@/helpers/search-summary";
import { useAvailability } from "@/hooks/use-availability";
import { useToday } from "@/hooks/use-today";

/**
 * Experiences only: which search the prices on screen are for ("Prices for 12–19 Mar · 3 travellers, per person. …"), from the search the rooms
 * answer, so it follows every change and never shows a draft. Hidden while the rooms load (the skeleton shows instead) and
 * when there is no answer; below 640px the short wording is used. Text only: the Rooms tab's live region announces it.
 */
export function PriceSummaryLine({ className }: { className?: string }) {
  const { status, request } = useAvailability();
  const today = useToday();
  if (status !== "ready" || !request || request.kind === "hotel" || !today) return null; // hotels show no such line
  const { full, compact } = searchSummary(request, { today });
  return (
    <p className={className}>
      <span className="hidden sm:inline">{full}</span>
      <span className="sm:hidden">{compact}</span>
    </p>
  );
}
