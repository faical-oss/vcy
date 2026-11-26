"use client";

import { checkCapacity, selectedCount, type RoomLimits } from "@/helpers/room-selection";
import { useStay } from "@/hooks/use-stay";
import { ReserveCta } from "./reserve-cta";

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/**
 * RESERVE NOW follows the room selection: it stays off until the rooms chosen add up to the rooms searched and fit every
 * guest, and its small line says what is missing. Once the rooms are right it shows what the server decided (`href`, or
 * the reason it is off). Reads the URL for the guests: render it inside <Suspense>.
 */
export function ReserveGate({ href, note, rooms }: { href?: string; note?: string; rooms: RoomLimits[] }) {
  const { rooms: wanted, adults, children, selection } = useStay();
  const count = selectedCount(selection);
  if (count < wanted) return <ReserveCta note={`Choose ${plural(wanted - count, "more room")} to reserve.`} hint={`Choose ${plural(wanted - count, "room")} first`} />;
  if (!checkCapacity(selection, rooms, { adults, children }).ok) return <ReserveCta note="The selected rooms cannot hold all your guests." hint="Rooms too small for your group" />;
  const chosen = Object.entries(selection).map(([id, quantity]) => `${id}:${quantity}`).join(",");
  return <ReserveCta href={href ? `${href}&selection=${encodeURIComponent(chosen)}` : undefined} note={note} />;
}
