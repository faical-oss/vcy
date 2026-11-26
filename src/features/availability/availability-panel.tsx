import { BookingPrice } from "@/components/sections/hotel/booking-price";
import { PriceBanner, PriceFrom } from "@/components/sections/hotel/price-summary";
import { RoomCheckoutLink } from "@/components/sections/hotel/room-checkout-link";
import { RoomPicker } from "@/components/sections/hotel/room-picker";
import { RoomsSummaryBar, type SummaryRoom } from "@/components/sections/hotel/rooms-summary-bar";
import { CalendarX2, CloudOff } from "lucide-react";
import { formatDateShort } from "@/helpers/format";
import { parseStayParams, todayIso, type RawStayParams } from "@/helpers/stay-params";
import type { Money } from "@/interfaces";
import { loadAvailability } from "./get-availability";

type SearchParams = Promise<RawStayParams & Record<string, string | string[] | undefined>>;

/**
 * Price header of the booking box. Without valid dates it shows the indicative "from" price and fetches nothing. With a
 * valid stay it shows the live price (cached 60 s per hotel, dates, guests and currency). It reads `searchParams`, so render
 * it inside <Suspense>: the page shell stays prerendered.
 */
export async function AvailabilityPanel({ hotelSlug, searchParams, fromPrice, roomNames, followSelection = true, compact = false }: { hotelSlug: string; searchParams: SearchParams; fromPrice: Money; roomNames: Readonly<Record<string, string>>; /** One line for the mobile bottom bar: the "from" price, or a short "not available" text. */ compact?: boolean; /** Price follows the room selection (hotels choose rooms on the page). False: only the "From" price. */ followSelection?: boolean }) {
  const raw = await searchParams;
  const parsed = parseStayParams(raw, todayIso());
  if (!parsed.ok) return <PriceFrom price={fromPrice} compact={compact} note={parsed.reason === "invalid" ? "Check your dates and guests." : undefined} />;

  const result = await loadAvailability(hotelSlug, parsed.stay);
  if (compact && (!result || result.status === "unavailable")) return <p className="truncate text-sm font-medium text-error">{result ? "Not available for your dates" : "Prices unavailable"}</p>;
  if (!result) return <PriceBanner title="Prices unavailable" icon={CloudOff}>We could not load live prices. Please try again.</PriceBanner>;
  if (result.status === "unavailable") {
    return (
      <PriceBanner title="No rooms available">
        {formatDateShort(parsed.stay.checkIn)} – {formatDateShort(parsed.stay.checkOut)} is fully booked. Try other dates.
      </PriceBanner>
    );
  }
  // The page shows the "From" price only; rooms and the total are chosen at checkout.
  if (!followSelection) return <PriceFrom price={fromPrice} compact={compact} note="You choose your rooms at checkout, where the total is confirmed." />;

  // Prices are for one room and the whole stay; the booking box multiplies by what the visitor selected (BookingPrice).
  return <BookingPrice nights={result.nights} rooms={result.rooms.filter((room) => room.available).map((room) => ({ id: room.roomId, name: roomNames[room.roomId] ?? "Room", total: room.total }))} />;
}

/** On a room card: the dates are taken. A badge with its own colour, not plain text. */
function UnavailableBadge() {
  return (
    <p className="inline-flex items-center gap-1.5 border border-error/30 bg-error/5 px-2 py-1 text-xs font-medium text-error">
      <CalendarX2 className="size-3.5" aria-hidden /> Not available for these dates
    </p>
  );
}

/**
 * Under a room card in the Rooms tab: only the "Not available for these dates" badge when the hotel or this room is sold out.
 * There is no price line here (the card shows its "from" price; the booking box and the summary bar show the prices for the
 * dates). Renders nothing without a valid stay, on an error, or when the room is available.
 */
export async function RoomLivePrice({ hotelSlug, roomId, searchParams }: { hotelSlug: string; roomId: string; searchParams: SearchParams }) {
  const parsed = parseStayParams(await searchParams, todayIso());
  if (!parsed.ok) return null;
  const result = await loadAvailability(hotelSlug, parsed.stay);
  if (!result) return null;
  if (result.status === "unavailable") return <UnavailableBadge />;
  const room = result.rooms.find((entry) => entry.roomId === roomId);
  if (!room) return null;
  return room.available ? null : <UnavailableBadge />;
}

/**
 * The rooms summary bar with live prices. Without a valid stay (or when the service has nothing) the bar gets no live prices
 * and estimates from the indicative ones. It reads `searchParams`, so render it inside <Suspense>.
 */
export async function RoomsSummary({ hotelSlug, searchParams, rooms, continueHref }: { hotelSlug: string; searchParams: SearchParams; rooms: SummaryRoom[]; continueHref: string | null }) {
  const parsed = parseStayParams(await searchParams, todayIso());
  const result = parsed.ok ? await loadAvailability(hotelSlug, parsed.stay) : null;
  const livePrices = result && result.status === "available" ? Object.fromEntries(result.rooms.filter((room) => room.available).map((room) => [room.roomId, room.total])) : undefined;
  return <RoomsSummaryBar rooms={rooms} hotelSlug={hotelSlug} continueHref={continueHref} livePrices={livePrices} />;
}

/** The room card's button: disabled (and labelled) when the hotel has no rooms for the chosen dates. Render it inside <Suspense>. */
export async function RoomAction({ hotelSlug, roomId, roomName, searchParams }: { hotelSlug: string; roomId: string; roomName: string; searchParams: SearchParams }) {
  const parsed = parseStayParams(await searchParams, todayIso());
  const result = parsed.ok ? await loadAvailability(hotelSlug, parsed.stay) : null;
  return <RoomPicker roomId={roomId} roomName={roomName} unavailable={result?.status === "unavailable" || (result?.status === "available" && result.rooms.some((room) => room.roomId === roomId && !room.available))} />;
}

/** The room card's shortcut to checkout (`RoomCheckoutLink`), disabled when this room is sold out for the dates. Render inside <Suspense>. */
export async function RoomCheckoutAction({ hotelSlug, roomId, roomName, searchParams, enabled }: { hotelSlug: string; roomId: string; roomName: string; searchParams: SearchParams; enabled: boolean }) {
  const parsed = parseStayParams(await searchParams, todayIso());
  const result = parsed.ok ? await loadAvailability(hotelSlug, parsed.stay) : null;
  const sold = result?.status === "unavailable" || (result?.status === "available" && result.rooms.some((room) => room.roomId === roomId && !room.available));
  return <RoomCheckoutLink roomId={roomId} roomName={roomName} kind="hotel" id={hotelSlug} enabled={enabled} unavailable={sold} />;
}
