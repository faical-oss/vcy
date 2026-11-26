"use client";

import { PriceBreakdown } from "@/components/sections/hotel/booking-price";
import { PriceNotice } from "@/components/sections/hotel/price-summary";
import { priceRooms, totalOf } from "@/helpers/experience-pricing";
import { formatMoney } from "@/helpers/format";
import { selectedCount } from "@/helpers/room-selection";
import { useStay } from "@/hooks/use-stay";
import type { Money } from "@/interfaces";

export interface LivePersonPrice {
  id: string;
  name: string;
  /** Per person, whole stay. */
  perPerson: Money;
  maxAdults: number;
  maxOccupancy: number;
}

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/**
 * Price header of an experience's booking card, per person. It follows the room selection so the number always says what the
 * visitor chose: nothing chosen shows the cheapest price per person (no total) and what to do; a partial choice shows
 * "N of M rooms selected" and a running subtotal; a complete choice shows the total for all travellers and what it is made
 * of. The guests are split over the chosen rooms (`priceRooms`). Reads the URL for the guests: render it inside <Suspense>.
 */
export function ExperienceBookingPrice({ nights, rooms }: { nights: number; rooms: LivePersonPrice[] }) {
  const { rooms: wanted, adults, children, selection } = useStay();
  const count = selectedCount(selection);
  const travellers = adults + children;
  const stayLabel = plural(nights, "night");
  const shares = priceRooms(selection, rooms.map((room) => ({ id: room.id, perPerson: room.perPerson.amount, maxAdults: room.maxAdults, maxOccupancy: room.maxOccupancy })), travellers);
  const currency = rooms[0].perPerson.currency;
  const total: Money = { amount: totalOf(shares), currency };
  const lines = shares.flatMap((share) => {
    const room = rooms.find((entry) => entry.id === share.roomId);
    return room ? [{ id: room.id, name: room.name, quantity: selection[room.id], subtotal: { amount: share.subtotal, currency } }] : [];
  });

  if (count === 0) {
    const cheapest = rooms.reduce((best, room) => (room.perPerson.amount < best.perPerson.amount ? room : best), rooms[0]);
    return (
      <div role="status">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-xs text-body">From</span>
          <span className="text-heading-xs font-bold text-accent">{formatMoney(cheapest.perPerson)}</span>
          <span className="text-xs text-body">per person</span>
        </p>
        <PriceNotice>Choose {plural(wanted, "room")} below to see your total.</PriceNotice>
      </div>
    );
  }

  const details = count > 1 ? <PriceBreakdown lines={lines} className="mt-4" /> : <p className="mt-3 text-sm font-medium text-primary">{lines[0]?.name}</p>;
  if (count < wanted) {
    return (
      <div role="status">
        <p className="text-sm font-semibold text-primary">
          {count} of {plural(wanted, "room")} selected
        </p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-heading-xs font-bold text-accent">{formatMoney(total)}</span>
          <span className="text-xs text-body">so far, for {plural(travellers, "traveller")}</span>
        </p>
        {details}
        <PriceNotice>Choose {plural(wanted - count, "more room")} below to complete your stay.</PriceNotice>
      </div>
    );
  }

  return (
    <div role="status">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-heading-xs font-bold text-accent">{formatMoney(total)}</span>
        <span className="text-xs text-body">
          total for {plural(travellers, "traveller")}, {stayLabel}
        </span>
      </p>
      {details}
    </div>
  );
}
