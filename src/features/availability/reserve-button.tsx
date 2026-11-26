import { ReserveCta } from "@/components/sections/hotel/reserve-cta";
import { ReserveGate } from "@/components/sections/hotel/reserve-gate";
import type { RoomLimits } from "@/helpers/room-selection";
import { parseStayParams, todayIso, type RawStayParams } from "@/helpers/stay-params";
import { isCheckoutStubEnabled } from "@/lib/flags";
import { checkoutHref } from "./checkout-href";
import { loadAvailability } from "./get-availability";

type SearchParams = Promise<RawStayParams & Record<string, string | string[] | undefined>>;

/**
 * RESERVE NOW. Enabled only when (1) the checkout stub flag is on, (2) the dates are valid and (3) the live price is
 * available for them. It then links to the noindex checkout stub; it prices nothing itself (`liveRecheck` is for the real
 * checkout, not built yet). With `rooms` it also waits for the room selection (`ReserveGate`). Reads `searchParams`, so
 * render it inside <Suspense>.
 */
export async function ReserveButton({ hotelSlug, searchParams, rooms }: { hotelSlug: string; searchParams: SearchParams; rooms?: RoomLimits[] }) {
  const { href, note } = await decide(hotelSlug, searchParams);
  return rooms ? <ReserveGate href={href} note={note} rooms={rooms} /> : <ReserveCta href={href} note={note} />;
}

async function decide(hotelSlug: string, searchParams: SearchParams): Promise<{ href?: string; note?: string }> {
  if (!isCheckoutStubEnabled()) return { note: "Online booking opens soon." };
  const parsed = parseStayParams(await searchParams, todayIso());
  if (!parsed.ok) return { note: "Select your dates to see the total price." };
  const result = await loadAvailability(hotelSlug, parsed.stay);
  if (!result) return { note: "We could not load live prices. Please try again." };
  if (result.status === "unavailable") return { note: "No rooms are available for these dates." };
  return { href: checkoutHref("hotel", hotelSlug, parsed.stay) };
}
