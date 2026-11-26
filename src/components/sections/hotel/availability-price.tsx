"use client";

import { CloudOff } from "lucide-react";
import { formatMoney } from "@/helpers/format";
import { selectedCount, type SelectableRoom } from "@/helpers/room-selection";
import { nightsBetween } from "@/helpers/stay-params";
import { useAvailability } from "@/hooks/use-availability";
import { useStay } from "@/hooks/use-stay";
import type { RoomAvailability } from "@/interfaces";
import { PriceSummaryLine } from "./price-summary-line";
import { PriceBanner } from "./price-summary";

const cheapest = (rooms: RoomAvailability[]): RoomAvailability | null => rooms.filter((room) => room.available).reduce<RoomAvailability | null>((best, room) => (!best || room.price.amount < best.price.amount ? room : best), null);

/**
 * Hotels: the rooms chosen on the page, in the booking card, with their nightly prices and, once the choice is complete, the
 * total for the stay. Before any choice it points to the Rooms tab.
 */
function SelectedRooms({ rooms, prices }: { rooms: SelectableRoom[]; prices: RoomAvailability[] }) {
  const { rooms: wanted, selection, checkIn, checkOut } = useStay();
  const count = selectedCount(selection);
  if (count === 0) return <p className="mt-3 text-sm text-body">Select your rooms in the Rooms tab.</p>;
  const priceOf = new Map(prices.map((room) => [room.roomId, room.price]));
  const chosen = rooms.filter((room) => selection[room.id] && priceOf.has(room.id));
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const perNight = chosen.reduce((sum, room) => sum + (priceOf.get(room.id)?.amount ?? 0) * selection[room.id], 0);
  const currency = priceOf.get(chosen[0]?.id ?? "")?.currency ?? "USD";
  return (
    <div className="mt-3 space-y-2 text-sm">
      <p className="font-medium text-primary">
        {count} of {wanted} {wanted === 1 ? "room" : "rooms"} selected
      </p>
      <ul className="space-y-1 text-body">
        {chosen.map((room) => (
          <li key={room.id} className="flex items-baseline justify-between gap-3">
            <span>
              {selection[room.id]} × {room.name}
            </span>
            <span className="shrink-0">{formatMoney({ amount: (priceOf.get(room.id)?.amount ?? 0) * selection[room.id], currency })} per night</span>
          </li>
        ))}
      </ul>
      {count === wanted && nights > 0 ? (
        <p className="flex items-baseline justify-between gap-3 border-t border-border pt-2 font-medium text-primary">
          <span>
            Total for {nights} {nights === 1 ? "night" : "nights"}
          </span>
          <span>{formatMoney({ amount: perNight * nights, currency })}</span>
        </p>
      ) : null}
    </div>
  );
}

function Bar({ className }: { className: string }) {
  return <span aria-hidden className={`block animate-pulse rounded-sm bg-border/70 motion-reduce:animate-none ${className}`} />;
}

/**
 * Price header of the booking card. Prices are hidden until dates are chosen: no search shows "Select
 * your dates to see prices"; while the rooms load a skeleton; with rooms available the lowest price for the dates (then which search the prices are for, and for hotels the rooms chosen) ("From $820 per
 * person" or "per night"); none available or an error a banner. It reads the availability store, which is idle on the server, so the HTML
 * never holds a price.
 */
export function BookingAvailabilityPrice({ selectable }: { /** Hotels: the rooms chosen on the page are shown instead of the checkout note. */ selectable?: SelectableRoom[] }) {
  const { status, rooms } = useAvailability();
  const room = cheapest(rooms);

  if (status === "loading") {
    return (
      <div role="status" aria-busy="true" aria-label="Loading prices" className="space-y-3">
        <Bar className="h-8 w-40" />
        <Bar className="h-4 w-56" />
      </div>
    );
  }
  if (status === "ready" && room) {
    const unit = room.unit === "person" ? "per person" : "per night";
    return (
      <div role="status">
        <p className="flex items-baseline gap-2">
          <span className="text-xs text-body">From</span>
          <span className="text-heading-xs font-bold text-accent">{formatMoney(room.price)}</span>
          <span className="text-xs text-body">{unit}</span>
        </p>
        <PriceSummaryLine className="mt-3 text-sm text-body" />
        {selectable ? <SelectedRooms rooms={selectable} prices={rooms} /> : null}
      </div>
    );
  }
  if (status === "none") return <PriceBanner title="No rooms available">There are no rooms for these dates. Try other dates.</PriceBanner>;
  if (status === "error") return <PriceBanner title="Prices unavailable" icon={CloudOff}>We could not check availability. Please try again.</PriceBanner>;
  return <p className="text-sm font-medium text-primary">Select your dates to see prices</p>;
}
