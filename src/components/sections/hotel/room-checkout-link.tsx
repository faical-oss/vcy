"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { checkoutQueryFromUrl, type CheckoutKind } from "@/helpers/checkout-params";

const label = (roomName: string, text: string) => (
  <>
    {text}
    <span className="sr-only"> {roomName}</span>
  </>
);

/**
 * The shortcut on a room card: "Select room" opens the checkout with this room preselected (`roomId`) and whatever stay is in
 * the page URL. It is never required: the booking card's "Check availability" reaches the same checkout and rooms are chosen
 * there. A sold-out room (`unavailable`) shows a disabled "Unavailable"; while there is no checkout (`enabled` false) the
 * button is disabled. Reads the URL: render it inside <Suspense>.
 */
export function RoomCheckoutLink({ roomId, roomName, kind, id, enabled, unavailable = false }: { roomId: string; roomName: string; kind: CheckoutKind; id: string; enabled: boolean; unavailable?: boolean }) {
  const params = useSearchParams();
  if (unavailable) {
    return (
      <button type="button" disabled className={buttonVariants({ variant: "outline", size: "md" })}>
        Unavailable
        <span className="sr-only"> {roomName}: not available for these dates</span>
      </button>
    );
  }
  if (!enabled) {
    return (
      <button type="button" disabled title="Online booking opens soon." className={buttonVariants({ variant: "primary", size: "md" })}>
        {label(roomName, "Select room")}
      </button>
    );
  }
  return (
    <Link href={`${ROUTES.checkout}?${checkoutQueryFromUrl(params, { kind, id, roomId })}`} className={buttonVariants({ variant: "primary", size: "md" })}>
      {label(roomName, "Select room")}
    </Link>
  );
}

/** What the card shows until the URL is read: the same size as the link, not clickable. */
export function RoomCheckoutLinkFallback({ roomName }: { roomName: string }) {
  return (
    <button type="button" disabled className={buttonVariants({ variant: "primary", size: "md" })}>
      {label(roomName, "Select room")}
    </button>
  );
}
