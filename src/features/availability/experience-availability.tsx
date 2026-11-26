import { CloudOff } from "lucide-react";
import { ExperienceBookingPrice } from "@/components/sections/experience/experience-booking-price";
import { PriceBanner, PriceFrom } from "@/components/sections/hotel/price-summary";
import { RoomCheckoutLink } from "@/components/sections/hotel/room-checkout-link";
import { RoomPicker } from "@/components/sections/hotel/room-picker";
import { RoomsSummaryBar, type SummaryRoom } from "@/components/sections/hotel/rooms-summary-bar";
import { parseDepartureParams, type GroupSize } from "@/helpers/experience-stay";
import { formatDateShort, formatMoney } from "@/helpers/format";
import { todayIso, type RawStayParams } from "@/helpers/stay-params";
import type { Money } from "@/interfaces";
import { loadExperienceAvailability } from "./get-availability";

type SearchParams = Promise<RawStayParams & Record<string, string | string[] | undefined>>;

export interface ExperienceRoomRef {
  id: string;
  name: string;
  maxAdults: number;
  maxOccupancy: number;
  /** Indicative price per person (cached with the experience). */
  priceFrom: Money;
}

interface Departure {
  slug: string;
  nights: number;
  group: GroupSize;
  searchParams: SearchParams;
}

/**
 * Price header of an experience's booking card. Without a valid departure (dates, the fixed duration, a group within the
 * maximum) it shows the indicative "from" price per person and fetches nothing. With one it checks availability (a full
 * departure or a failed load shows a banner) and keeps the "from" price; with `followSelection` it shows the live prices through
 * `ExperienceBookingPrice`, which follows the room selection. Reads `searchParams`: render it inside <Suspense>.
 */
export async function ExperiencePricePanel({ slug, nights, group, searchParams, fromPrice, rooms, followSelection = false, compact = false }: Departure & { fromPrice: Money; rooms: ExperienceRoomRef[]; /** One line for the mobile bottom bar. */ compact?: boolean; /** Price from the room selection (the checkout's way); the detail page does not choose rooms. */ followSelection?: boolean }) {
  const parsed = parseDepartureParams(await searchParams, todayIso(), nights, group);
  if (!parsed.ok) return <PriceFrom unit="person" compact={compact} price={fromPrice} note={parsed.reason === "invalid" ? "Check your dates and travellers." : undefined} />;

  const result = await loadExperienceAvailability(slug, parsed.stay);
  if (compact && (!result || result.status === "unavailable")) return <p className="truncate text-sm font-medium text-error">{result ? "Not available for your dates" : "Prices unavailable"}</p>;
  if (!result) return <PriceBanner title="Prices unavailable" icon={CloudOff}>We could not load live prices. Please try again.</PriceBanner>;
  if (result.status === "unavailable") {
    return (
      <PriceBanner title="Departure full">
        {formatDateShort(parsed.stay.checkIn)} – {formatDateShort(parsed.stay.checkOut)} is fully booked. Try other dates.
      </PriceBanner>
    );
  }
  // The page shows the "From" price only; rooms and the total are chosen at checkout.
  if (!followSelection) return <PriceFrom unit="person" compact={compact} price={fromPrice} note="You choose your rooms at checkout, where the total is confirmed." />;
  const prices = result.rooms.filter((room) => room.available).flatMap((live) => {
    const room = rooms.find((entry) => entry.id === live.roomId);
    return room ? [{ id: room.id, name: room.name, perPerson: live.perPerson, maxAdults: room.maxAdults, maxOccupancy: room.maxOccupancy }] : [];
  });
  return <ExperienceBookingPrice nights={result.nights} rooms={prices} />;
}

/**
 * Live price of ONE room type under its card, per person for the chosen dates. Shown only when it differs from the indicative
 * "From" price above it (so the card never repeats the same number); the sold-out badge always shows. Nothing without a valid
 * departure or on an error.
 */
export async function ExperienceRoomLivePrice({ slug, roomId, fromAmount, nights, group, searchParams }: Departure & { roomId: string; fromAmount: number }) {
  const parsed = parseDepartureParams(await searchParams, todayIso(), nights, group);
  if (!parsed.ok) return null;
  const result = await loadExperienceAvailability(slug, parsed.stay);
  if (!result) return null;
  if (result.status === "unavailable") return <UnavailableBadge />;
  const room = result.rooms.find((entry) => entry.roomId === roomId);
  if (!room) return null;
  if (!room.available) return <UnavailableBadge />;
  if (room.perPerson.amount === fromAmount) return null;
  return (
    <p className="text-sm text-primary">
      <span className="font-semibold">{formatMoney(room.perPerson)}</span> per person
      <span className="block text-xs text-muted-blue">for your dates</span>
    </p>
  );
}

function UnavailableBadge() {
  return <p className="inline-flex items-center gap-1.5 border border-error/30 bg-error/5 px-2 py-1 text-xs font-medium text-error">Not available for these dates</p>;
}

/** The room card's select control: disabled (and labelled) when the departure or this room is sold out. Render inside <Suspense>. */
export async function ExperienceRoomAction({ slug, roomId, roomName, nights, group, searchParams }: Departure & { roomId: string; roomName: string }) {
  const parsed = parseDepartureParams(await searchParams, todayIso(), nights, group);
  const result = parsed.ok ? await loadExperienceAvailability(slug, parsed.stay) : null;
  const sold = result?.status === "unavailable" || (result?.status === "available" && result.rooms.some((room) => room.roomId === roomId && !room.available));
  return <RoomPicker roomId={roomId} roomName={roomName} unavailable={sold} />;
}

/** The sticky rooms summary with live per-person prices (estimates from the indicative prices without a live result). */
export async function ExperienceRoomsSummary({ slug, nights, group, searchParams, rooms }: Departure & { rooms: SummaryRoom[] }) {
  const parsed = parseDepartureParams(await searchParams, todayIso(), nights, group);
  const result = parsed.ok ? await loadExperienceAvailability(slug, parsed.stay) : null;
  const livePrices = result && result.status === "available" ? Object.fromEntries(result.rooms.filter((room) => room.available).map((room) => [room.roomId, room.perPerson])) : undefined;
  // TODO(api): the checkout does not exist yet; Continue stays off until it does (see the hotel page's stub).
  return <RoomsSummaryBar rooms={rooms} hotelSlug={slug} continueHref={null} livePrices={livePrices} perPerson fixedNights={nights} />;
}

/** The room card's shortcut to checkout (`RoomCheckoutLink`), disabled when the departure or this room is sold out. Render inside <Suspense>. */
export async function ExperienceRoomCheckoutAction({ slug, roomId, roomName, nights, group, searchParams, enabled }: Departure & { roomId: string; roomName: string; enabled: boolean }) {
  const parsed = parseDepartureParams(await searchParams, todayIso(), nights, group);
  const result = parsed.ok ? await loadExperienceAvailability(slug, parsed.stay) : null;
  const sold = result?.status === "unavailable" || (result?.status === "available" && result.rooms.some((room) => room.roomId === roomId && !room.available));
  return <RoomCheckoutLink roomId={roomId} roomName={roomName} kind="experience" id={slug} enabled={enabled} unavailable={sold} />;
}
