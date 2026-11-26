/**
 * The line that says which search the prices on screen answer, from the search itself (never from the draft in the form), for
 * experiences only (hotels show no such line):
 *   "Prices for 12–19 Mar · 3 travellers, per person. You'll choose your room at checkout."
 *   compact (below 640px): "Prices for 12–19 Mar · 3 travellers. Choose your room at checkout."
 * Pure, so the card, the Rooms tab and the tests share one wording.
 */
import { formatDateRange } from "./format";
import type { RoomAvailabilityRequest } from "@/interfaces";

export interface SearchSummary {
  /** The full line (from 640px). */
  full: string;
  /** The short line (below 640px). */
  compact: string;
}

export function searchSummary(request: Pick<RoomAvailabilityRequest, "checkIn" | "checkOut" | "adults" | "children">, { today, locale }: { today: string; locale?: string | string[] }): SearchSummary {
  const dates = formatDateRange(request.checkIn, request.checkOut, { today, locale });
  const total = request.adults + request.children;
  const travellers = `${total} ${total === 1 ? "traveller" : "travellers"}`;
  return { full: `Prices for ${dates} · ${travellers}, per person. You'll choose your room at checkout.`, compact: `Prices for ${dates} · ${travellers}. Choose your room at checkout.` };
}
