"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROUTES } from "@/constants/routes";
import { toRoomRequest } from "@/helpers/availability-request";
import { checkoutQuery, type CheckoutKind } from "@/helpers/checkout-params";
import { DEFAULT_GROUP_SIZE, durationLabel, isNightsAllowed, type GroupSize } from "@/helpers/stay-duration";
import { nightsBetween } from "@/helpers/stay-params";
import { checkCapacity, selectedCount, type SelectableRoom } from "@/helpers/room-selection";
import type { RoomAvailabilityRequest, StayDuration } from "@/interfaces";
import { useAvailability } from "./use-availability";
import { useStay } from "./use-stay";
import { useToday } from "./use-today";

/** The date and group rules of an experience or a package (a hotel has none: it is always a flexible range). */
export interface ProductFormOptions {
  /** `fixed`: picking a start date sets the end date. `flexible`: a range, within the minimum and maximum nights when given. */
  duration: StayDuration;
  /** What the product is called in the date hint ("experience", "package"). */
  noun?: string;
  /** Most travellers (enforced on the steppers) and fewest (shown as a note only). */
  group?: GroupSize;
}

/** What "Reserve now" opens once rooms are available: the checkout, with the stay in the URL (`checkoutQuery`). */
export interface CheckoutTarget {
  kind: CheckoutKind;
  /** The hotel or experience slug. */
  id: string;
  /** False while there is no checkout to go to: the button then says so instead of navigating. */
  enabled: boolean;
}

export interface BookingTarget {
  checkout: CheckoutTarget;
  /** Absent for a hotel. */
  product?: ProductFormOptions;
  /**
   * Hotels: the rooms to choose from. Rooms are chosen on the page, so "Reserve now" stays off until the rooms chosen add up to
   * the rooms searched and hold every guest, and the checkout link carries the choice. Experiences leave it out (rooms are
   * chosen in checkout).
   */
  rooms?: SelectableRoom[];
}

/**
 * What the primary button does in each state; the booking card and the mobile bar both follow it:
 *  - `prompt`: no complete, valid search yet (card "Check availability", bar "Select dates"); it opens the dates, no call is made;
 *  - `busy`: the rooms are loading (disabled);
 *  - `reserve`: at least one room is available (enabled, "Reserve now");
 *  - `blocked`: none available, or an error (disabled "Reserve now"; an error also offers Retry).
 */
export type BookingKind = "prompt" | "busy" | "reserve" | "blocked";

export interface BookingState {
  /** The complete, valid search, or null (dates missing, a child without an age, rooms more than adults, group too large...). */
  request: RoomAvailabilityRequest | null;
  status: ReturnType<typeof useAvailability>["status"];
  hasDates: boolean;
  /** A flexible product with a minimum or maximum, and a range outside it: "Choose a stay of 3–7 nights.". Null otherwise. Every date can be picked; the range is what is checked. */
  rangeMessage: string | null;
  /** At least one child has no age chosen (there is no default). */
  missingAges: boolean;
  kind: BookingKind;
  /** The booking card's button label. */
  label: string;
  /** The mobile bar's button label. */
  barLabel: string;
  /** Which part of the booking sheet fixes what is wrong or missing: the dates, or the travellers; null when nothing is (the sheet opens as it is). */
  panel: "dates" | "guests" | null;
  disabled: boolean;
  /** The status line under the button. */
  note: string;
  /** Goes to the checkout, or shows "Online booking opens soon." when there is none. Only does something when rooms are available. */
  reserve: () => void;
}

/** The one place that decides the state of the booking button for a page. Pure derivation from the stay and availability stores. */
export function useBookingState({ checkout, product, rooms: selectable }: BookingTarget): BookingState {
  const router = useRouter();
  const stay = useStay();
  const availability = useAvailability();
  const today = useToday();
  const [notice, setNotice] = useState(false);
  const group = product?.group ?? DEFAULT_GROUP_SIZE;
  const { checkIn, checkOut, rooms, adults, children, childAges, flexDays, selection } = stay;

  const request = today ? toRoomRequest({ checkIn, checkOut, rooms, adults, children, childAges, flexDays }, { kind: checkout.kind, id: checkout.id, duration: product?.duration, group: product ? group : undefined }, today) : null;
  const hasDates = !!checkIn && !!checkOut;
  const duration = product?.duration;
  const limitLabel = duration && duration.type === "flexible" ? durationLabel(duration) : null;
  const rangeMessage = hasDates && duration && limitLabel && !isNightsAllowed(duration, nightsBetween(checkIn!, checkOut!)) ? `Choose a stay of ${limitLabel.charAt(0).toLowerCase()}${limitLabel.slice(1)}.` : null;
  const missingAges = childAges.some((age) => age === null);
  const status = availability.status;
  const searching = !!request && (status === "loading" || status === "idle");

  // Hotels: the rooms chosen must add up to the rooms searched and hold everybody.
  const chosen = selectedCount(selection);
  const missing = request ? request.rooms - chosen : 0;
  const word = (count: number) => (count === 1 ? "room" : "rooms");
  const selectionNote =
    selectable && request && status === "ready"
      ? missing > 0
        ? chosen === 0
          ? `Choose ${missing} ${word(missing)} to reserve.`
          : `Choose ${missing} more ${word(missing)} to reserve.`
        : !checkCapacity(selection, selectable, { adults: request.adults, children: request.children }).ok
          ? "The selected rooms cannot hold all your guests."
          : null
      : null;

  const kind: BookingKind = !request ? "prompt" : searching ? "busy" : status === "ready" && !selectionNote ? "reserve" : "blocked";
  const label = kind === "prompt" ? "Check availability" : kind === "busy" ? "Checking availability…" : "Reserve now";
  // No dates: "Select dates". Dates but the search is not valid (a child without an age, a stay outside its limits): "Review search".
  const barLabel = kind === "prompt" ? (hasDates ? "Review search" : "Select dates") : kind === "busy" ? "Checking…" : "Reserve now";
  const panel: BookingState["panel"] = !hasDates || rangeMessage ? "dates" : !request ? "guests" : null;

  const note = !hasDates
    ? "Add your dates to check availability."
    : rangeMessage
      ? rangeMessage
      : missingAges
      ? "Select the age of each child."
      : !request
        ? "Check your dates and travellers."
        : searching
          ? "Checking rooms for your dates…"
          : status === "none"
            ? "No rooms are available for these dates. Try other dates."
            : status === "error"
              ? "We could not check availability."
              : selectionNote
                ? selectionNote
                : notice
                ? "Online booking opens soon."
                : "";

  function reserve() {
    if (!request || kind !== "reserve") return;
    if (!checkout.enabled) return setNotice(true);
    router.push(`${ROUTES.checkout}?${checkoutQuery({ kind: checkout.kind, id: checkout.id, checkIn: request.checkIn, checkOut: request.checkOut, rooms: request.rooms, adults: request.adults, children: request.children, childAges: request.childAges, flexDays, selection: selectable ? selection : undefined })}`);
  }

  return { request, status, hasDates, rangeMessage, missingAges, kind, label, barLabel, panel, disabled: kind === "busy" || kind === "blocked", note, reserve };
}
