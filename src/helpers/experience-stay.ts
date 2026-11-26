/**
 * Rules of an experience departure: the stay is a start date, the end is fixed (start plus the experience's nights), and the
 * group may not exceed the maximum group size. The minimum group size never blocks anything: it is shown as a note.
 * Pure, so the page (server), the booking form (client) and the tests apply the same rules.
 */
import { experienceDetail, packageDetail } from "@/constants/routes";
import { DEFAULT_GROUP_SIZE, parseStayForDuration, type GroupSize } from "./stay-duration";
import { STAY_LIMITS, type RawStayParams, type Stay, type StayLimits } from "./stay-params";

export type { GroupSize } from "./stay-duration";
export { DEFAULT_GROUP_SIZE, departureEnd } from "./stay-duration";

/** The stay limits of an experience: adults may go up to the group maximum (the shared limit of 9 is for hotels). */
export function experienceStayLimits(group: GroupSize = DEFAULT_GROUP_SIZE): StayLimits {
  return { ...STAY_LIMITS, maxAdults: group.max };
}

/** The guest limits for a page: an experience or package page takes its group maximum, anything else the shared limits. TODO(api): per product group size. */
export function guestLimitsForPath(pathname: string): { maxRooms: number; maxAdults: number; maxChildren: number } {
  const limits = pathname.startsWith(experienceDetail("")) || pathname.startsWith(packageDetail("")) ? experienceStayLimits() : STAY_LIMITS;
  return { maxRooms: limits.maxRooms, maxAdults: limits.maxAdults, maxChildren: limits.maxChildren };
}

/** How many more travellers fit before the group is full. Never negative. */
export function seatsLeft(group: GroupSize, adults: number, children: number): number {
  return Math.max(0, group.max - adults - children);
}

/** Limits for the steppers: adults and children together stay within the maximum (and within the shared guest limits). */
export function travellerLimits(group: GroupSize, guests: { adults: number; children: number }, limits: { maxAdults: number; maxChildren: number }): { maxAdults: number; maxChildren: number } {
  return {
    maxAdults: Math.min(limits.maxAdults, group.max - guests.children),
    maxChildren: Math.min(limits.maxChildren, group.max - guests.adults),
  };
}

/** The note about the minimum group size: information only. Null when the minimum is 1 or less. */
export function minimumGroupNote(group: GroupSize): string | null {
  return group.min > 1 ? `Runs with ${group.min}+ guests` : null;
}

export type DepartureParse = { ok: true; stay: Stay } | { ok: false; reason: "missing" | "invalid" };

/**
 * A fixed-duration departure: like `parseStayParams`, with the end recomputed from the start (`nights` later) and adults plus
 * children within the group maximum. Kept for callers that only know the nights; `parseStayForDuration` is the general rule.
 */
export function parseDepartureParams(raw: RawStayParams, today: string, nights: number, group: GroupSize = DEFAULT_GROUP_SIZE): DepartureParse {
  return parseStayForDuration(raw, today, { type: "fixed", nights }, group);
}
