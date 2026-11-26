"use client";

import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PriceBreakdown } from "@/components/sections/hotel/booking-price";
import { Button, ButtonLink } from "@/components/ui/button";
import { formatMoney } from "@/helpers/format";
import { checkoutQueryFromUrl } from "@/helpers/checkout-params";
import { priceRooms, totalOf } from "@/helpers/experience-pricing";
import { checkCapacity, selectedCount, type RoomLimits } from "@/helpers/room-selection";
import { nightsBetween, parseStayParams, todayIso } from "@/helpers/stay-params";
import { useStay } from "@/hooks/use-stay";
import type { Money } from "@/interfaces";

export interface SummaryRoom extends RoomLimits {
  name: string;
  /** Indicative nightly price, used for the total only while there is no live price (none: 0). */
  priceFrom?: Money;
}

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/**
 * Sticky bar under the room cards: "N of M rooms selected", the total for the stay, what it is made of (a collapsible
 * list: room, quantity, subtotal) and Continue. Continue stays disabled until N equals M and the selected rooms fit
 * everybody; a message says what is wrong. Without dates there is no total, only a hint. `livePrices` (one room, whole
 * stay, by room id) comes from the availability service; without it the total is an estimate from the indicative prices.
 * `continueHref` is null while there is no checkout to go to. Reads the URL: render it inside <Suspense>.
 */
export function RoomsSummaryBar({ rooms, hotelSlug, continueHref, livePrices, perPerson = false, fixedNights }: { rooms: SummaryRoom[]; hotelSlug: string; continueHref: string | null; livePrices?: Record<string, Money>; /** Experience: prices are per person and the guests are split over the chosen rooms. */ perPerson?: boolean; /** Experience: the fixed duration. */ fixedNights?: number }) {
  const params = useSearchParams();
  const { rooms: wanted, adults, children, selection } = useStay();
  const count = selectedCount(selection);
  const stay = parseStayParams(Object.fromEntries(params), todayIso());
  const nights = fixedNights ?? (stay.ok ? nightsBetween(stay.stay.checkIn, stay.stay.checkOut) : 0);
  const complete = count === wanted;
  const capacity = checkCapacity(selection, rooms, { adults, children });
  const currency = rooms[0]?.priceFrom?.currency ?? "USD";

  // Hotel: one room for the whole stay is the live price, else the indicative nightly price times the nights.
  // Experience (`perPerson`): the price is per person for the whole stay and the guests are split over the chosen rooms.
  const oneRoom = (room: SummaryRoom): number => livePrices?.[room.id]?.amount ?? (room.priceFrom?.amount ?? 0) * nights;
  const lines = perPerson
    ? priceRooms(selection, rooms.map((room) => ({ id: room.id, perPerson: livePrices?.[room.id]?.amount ?? (room.priceFrom?.amount ?? 0), maxAdults: room.maxAdults, maxOccupancy: room.maxOccupancy })), adults + children).flatMap((share) => {
        const room = rooms.find((entry) => entry.id === share.roomId);
        return room ? [{ room, quantity: selection[room.id], subtotal: share.subtotal }] : [];
      })
    : nights > 0
      ? rooms.filter((room) => (selection[room.id] ?? 0) > 0).map((room) => ({ room, quantity: selection[room.id], subtotal: selection[room.id] * oneRoom(room) }))
      : [];
  const total = perPerson ? totalOf(lines.map((line) => ({ roomId: line.room.id, guests: 0, subtotal: line.subtotal }))) : lines.reduce((sum, line) => sum + line.subtotal, 0);

  let message: string | null = null;
  if (complete && !capacity.ok) {
    message =
      capacity.reason === "adults"
        ? `The selected rooms take ${capacity.capacity} adults, but you are travelling with ${capacity.needed}. Choose roomier rooms or add a room.`
        : `The selected rooms hold ${capacity.capacity} guests, but you are travelling with ${capacity.needed} (adults and children). Choose roomier rooms or add a room.`;
  } else if (!stay.ok) {
    message = "Select your dates to see total prices.";
  } else if (!complete) {
    message = `Choose ${plural(wanted - count, "more room")} to continue.`;
  } else if (!continueHref) {
    message = "Online booking opens soon: your rooms are chosen, but there is no checkout to continue to yet.";
  }
  const isError = complete && !capacity.ok;

  const ready = complete && capacity.ok && stay.ok && !!continueHref;
  const selected = Object.entries(selection).map(([id, quantity]) => `${id}:${quantity}`).join(",");
  const href = ready ? `${continueHref}${continueHref.includes("?") ? "&" : "?"}${checkoutQueryFromUrl(params, { kind: "hotel", id: hotelSlug })}&selection=${encodeURIComponent(selected)}` : null;

  return (
    <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 mt-6 border border-border bg-card p-4 shadow-[0_-4px_12px_rgb(0_0_0/0.06)] lg:bottom-0" role="region" aria-label="Your rooms">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary" aria-live="polite">
            {count} of {plural(wanted, "room")} selected
          </p>
          <p className="text-sm text-body">
            {lines.length > 0 ? (
              <>
                {complete ? "Total" : "So far"} for {plural(nights, "night")}: <span className="font-semibold text-primary">{formatMoney({ amount: total, currency })}</span>
              </>
            ) : (
              "Your total appears once you have chosen rooms and dates."
            )}
          </p>
        </div>
        {href ? (
          <ButtonLink href={href} size="lg">
            Continue
          </ButtonLink>
        ) : (
          <Button size="lg" disabled aria-describedby="rooms-summary-message" title={continueHref ? undefined : "Online booking opens soon."}>
            Continue
          </Button>
        )}
      </div>
      {count > 1 && lines.length > 0 ? (
        <details className="group mt-3 border-t border-border pt-3 text-sm">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 font-medium text-primary [&::-webkit-details-marker]:hidden">
            Price details <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <PriceBreakdown className="mt-3" heading={false} lines={lines.map(({ room, quantity, subtotal }) => ({ id: room.id, name: room.name, quantity, subtotal: { amount: subtotal, currency } }))} />
        </details>
      ) : null}
      <p
        id="rooms-summary-message"
        role={isError ? "alert" : undefined}
        className={isError ? "mt-3 min-h-5 text-sm font-medium text-error" : !complete && stay.ok ? "mt-3 min-h-5 border-l-4 border-accent bg-accent/10 px-3 py-1.5 text-sm font-medium text-primary" : "mt-3 min-h-5 text-sm text-body"}
      >
        {message}
      </p>
    </div>
  );
}
