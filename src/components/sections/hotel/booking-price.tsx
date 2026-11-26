"use client";

import { cn } from "@/helpers/cn";
import { PriceNotice } from "@/components/sections/hotel/price-summary";
import { formatMoney } from "@/helpers/format";
import { selectedCount } from "@/helpers/room-selection";
import { useStay } from "@/hooks/use-stay";
import type { Money } from "@/interfaces";

export interface LiveRoomPrice {
  id: string;
  name: string;
  /** One room, the whole stay. */
  total: Money;
}

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/** Sum of quantity x one-room price. Rooms the price list does not know are ignored. */
export function selectionTotal(selection: Readonly<Record<string, number>>, prices: readonly LiveRoomPrice[]): Money | null {
  const first = prices[0];
  if (!first) return null;
  const amount = prices.reduce((sum, room) => sum + (selection[room.id] ?? 0) * room.total.amount, 0);
  return { amount, currency: first.total.currency };
}

export interface PriceLine {
  id: string;
  name: string;
  quantity: number;
  subtotal: Money;
}

/** "Price details": what the total is made of, one line per room type (name, quantity, subtotal). */
export function PriceBreakdown({ lines, className, heading = true }: { lines: PriceLine[]; className?: string; heading?: boolean }) {
  return (
    <div className={className}>
      {heading ? <p className="text-xs font-semibold uppercase tracking-widest text-muted-blue">Price details</p> : null}
      <ul className={cn(heading && "mt-2", "divide-y divide-border border-y border-border")}>
        {lines.map((line) => (
          <li key={line.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
            <span className="text-body">
              <span className="font-medium text-primary">{line.quantity} ×</span> {line.name}
            </span>
            <span className="shrink-0 font-medium text-primary">{formatMoney(line.subtotal)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Lines of the chosen rooms, in the list's order. */
export function priceLines(selection: Readonly<Record<string, number>>, prices: readonly LiveRoomPrice[]): PriceLine[] {
  return prices.filter((room) => (selection[room.id] ?? 0) > 0).map((room) => ({ id: room.id, name: room.name, quantity: selection[room.id], subtotal: { amount: selection[room.id] * room.total.amount, currency: room.total.currency } }));
}

/**
 * Price header of the booking box with live prices. It follows the room selection, so the number always says what the
 * visitor chose: nothing chosen yet shows the cheapest room per room (no total); a partial choice shows "N of M selected" and
 * a running subtotal; a complete choice shows the total for all rooms and what it is made of. Reads the URL for the guests,
 * so render it inside <Suspense>.
 */
export function BookingPrice({ nights, rooms }: { nights: number; rooms: LiveRoomPrice[] }) {
  const { rooms: wanted, selection } = useStay();
  const count = selectedCount(selection);
  const stayLabel = plural(nights, "night");
  const lines = priceLines(selection, rooms);
  // One room needs no breakdown: its name is enough. Two or more get the "Price details" list.
  const single = lines[0];
  const details =
    count > 1 ? (
      <PriceBreakdown lines={lines} className="mt-4" />
    ) : single ? (
      <div className="mt-3 text-sm">
        <p className="font-medium text-primary">{single.name}</p>
        <p className="text-body">
          {formatMoney({ amount: Math.round(single.subtotal.amount / nights), currency: single.subtotal.currency })} per night × {stayLabel}
        </p>
      </div>
    ) : null;

  if (count === 0) {
    const cheapest = rooms.reduce((best, room) => (room.total.amount < best.total.amount ? room : best), rooms[0]);
    return (
      <div role="status">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-xs text-body">From</span>
          <span className="text-heading-xs font-bold text-accent">{formatMoney(cheapest.total)}</span>
          <span className="text-xs text-body">for {stayLabel}, per room</span>
        </p>
        <PriceNotice>Choose {plural(wanted, "room")} below to see your total.</PriceNotice>
      </div>
    );
  }

  const total = selectionTotal(selection, rooms) as Money;
  if (count < wanted) {
    return (
      <div role="status">
        <p className="text-sm font-semibold text-primary">
          {count} of {plural(wanted, "room")} selected
        </p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-heading-xs font-bold text-accent">{formatMoney(total)}</span>
          <span className="text-xs text-body">so far, for {stayLabel}</span>
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
        <span className="text-xs text-body">total for {stayLabel}</span>
      </p>
      {details}
    </div>
  );
}
