/**
 * The date rule of a product (see `StayDuration`): fixed (start date only, the end follows) or flexible (a range, within an
 * optional minimum and maximum). Pure, so the booking form, the controller, the availability route and the checkout stub apply
 * the same rule. Hotels are always flexible.
 */
import { EXPERIENCE_GROUP_SIZE } from "@/constants/experience";
import type { StayDuration } from "@/interfaces";
import { STAY_LIMITS, nightsBetween, parseStayParams, type RawStayParams, type Stay, type StayLimits, type StayParse } from "./stay-params";

export interface GroupSize {
  min: number;
  max: number;
}

export const DEFAULT_GROUP_SIZE: GroupSize = EXPERIENCE_GROUP_SIZE;

/** Hotels, and any product with no duration of its own: a range of 1 to 30 nights. */
export const FLEXIBLE_STAY: StayDuration = { type: "flexible" };

const MS_PER_DAY = 86_400_000;

/** The end date of a fixed stay: `start` plus `nights`, as an ISO date. */
export function departureEnd(start: string, nights: number): string {
  return new Date(Date.parse(`${start}T00:00:00Z`) + nights * MS_PER_DAY).toISOString().slice(0, 10);
}

/** The fewest and most nights a stay may have (a flexible duration without limits: 1 to the shared maximum). */
export function nightsRange(duration: StayDuration): { min: number; max: number } {
  if (duration.type === "fixed") return { min: duration.nights, max: duration.nights };
  // Limits outside 1 to 30 nights, or a minimum above the maximum, are tidied here so the picker, the rule and the label agree.
  const min = Math.min(STAY_LIMITS.maxNights, Math.max(1, duration.minNights ?? 1));
  const max = Math.min(STAY_LIMITS.maxNights, Math.max(min, duration.maxNights ?? STAY_LIMITS.maxNights));
  return { min, max };
}

export function isNightsAllowed(duration: StayDuration, nights: number): boolean {
  const { min, max } = nightsRange(duration);
  return nights >= min && nights <= max;
}

/** True when the visitor picks only the start date. */
export const isFixedStay = (duration: StayDuration): duration is { type: "fixed"; nights: number } => duration.type === "fixed";

/** "7 nights", "1 night", "2–14 nights", "At least 3 nights", "Up to 14 nights"; null for a flexible stay with no limits. */
export function durationLabel(duration: StayDuration): string | null {
  const noun = (count: number) => `${count} ${count === 1 ? "night" : "nights"}`;
  if (duration.type === "fixed") return noun(duration.nights);
  const { min, max } = nightsRange(duration);
  const hasMin = duration.minNights !== undefined;
  const hasMax = duration.maxNights !== undefined;
  if (hasMin && hasMax) return min === max ? noun(min) : `${min}–${max} nights`;
  if (hasMin) return `At least ${noun(min)}`;
  if (hasMax) return `Up to ${noun(max)}`;
  return null;
}

/** The note under the date picker: what the visitor has to do for this duration. */
export function durationHint(duration: StayDuration, noun: string): string | null {
  if (duration.type === "fixed") return `This ${noun} lasts ${durationLabel(duration)}: pick your start date and the end date follows.`;
  const label = durationLabel(duration);
  return label ? `Stay ${label.charAt(0).toLowerCase()}${label.slice(1)}.` : null;
}

/** The stay limits of a product with a group size: adults may go up to the group maximum, and a fixed stay may be longer than 30 nights. */
export function groupStayLimits(group: GroupSize, duration: StayDuration = FLEXIBLE_STAY): StayLimits {
  return { ...STAY_LIMITS, maxAdults: group.max, maxNights: Math.max(STAY_LIMITS.maxNights, nightsRange(duration).max) };
}

export type DurationParse = { ok: true; stay: Stay } | { ok: false; reason: "missing" | "invalid" };

/**
 * Parses the stay parameters of a product under its duration rule. Fixed: the end is always recomputed from the start (a link
 * with another end is repaired, not refused). Flexible: the range must be within the minimum and maximum. With a `group`,
 * adults plus children must fit its maximum and adults may go up to it.
 */
export function parseStayForDuration(raw: RawStayParams, today: string, duration: StayDuration = FLEXIBLE_STAY, group?: GroupSize): DurationParse {
  const limits = group ? groupStayLimits(group, duration) : STAY_LIMITS;
  const start = Array.isArray(raw.checkIn) ? raw.checkIn[0] : raw.checkIn;
  const input: RawStayParams = isFixedStay(duration) && start && /^\d{4}-\d{2}-\d{2}$/.test(start) && !Number.isNaN(Date.parse(`${start}T00:00:00Z`)) ? { ...raw, checkOut: departureEnd(start, duration.nights) } : raw;
  const parsed: StayParse = parseStayParams(input, today, limits);
  if (!parsed.ok) return parsed;
  const { stay } = parsed;
  if (!isNightsAllowed(duration, nightsBetween(stay.checkIn, stay.checkOut)) && duration.type === "flexible") return { ok: false, reason: "invalid" };
  if (group && stay.adults + stay.children > group.max) return { ok: false, reason: "invalid" };
  return parsed;
}
