import { ROUTES } from "@/constants/routes";
import { checkoutQuery, type CheckoutKind } from "@/helpers/checkout-params";
import type { Stay } from "@/helpers/stay-params";

/** URL of the checkout stub for a stay: the kind and id, the dates, the guests with child ages, and optionally a preselected room. */
export function checkoutHref(kind: CheckoutKind, id: string, stay: Stay, roomId?: string): string {
  return `${ROUTES.checkout}?${checkoutQuery({ kind, id, checkIn: stay.checkIn, checkOut: stay.checkOut, rooms: stay.rooms, adults: stay.adults, children: stay.children, childAges: stay.childAges, flexDays: stay.flexDays, roomId })}`;
}
