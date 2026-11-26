"use client";

import { useEffect } from "react";
import { formatMoney } from "@/helpers/format";
import { useAvailability } from "@/hooks/use-availability";
import { searchSummary } from "@/helpers/search-summary";
import { useStay } from "@/hooks/use-stay";
import { useToday } from "@/hooks/use-today";
import type { HotelRoom, RoomAvailability } from "@/interfaces";
import { availabilityStore } from "@/store/availability-store";
import { stayStore } from "@/store/stay-store";
import { PriceSummaryLine } from "./price-summary-line";
import { RoomPicker } from "./room-picker";
import { RoomRow } from "./room-row";

function RoomRowSkeleton() {
  const bar = "block animate-pulse rounded-sm bg-border/70 motion-reduce:animate-none";
  return (
    <li aria-hidden className="grid overflow-hidden border border-border bg-card md:grid-cols-[200px_1fr_230px]">
      <span className={`${bar} aspect-[4/3] rounded-none md:aspect-auto md:min-h-[160px]`} />
      <div className="flex flex-col justify-center gap-3 p-5">
        <span className={`${bar} h-5 w-48`} />
        <span className={`${bar} h-3 w-64 max-w-full`} />
        <span className={`${bar} h-3 w-56 max-w-full`} />
      </div>
      <div className="flex flex-col items-center justify-center gap-2 border-t border-border p-5 md:border-l md:border-t-0">
        <span className={`${bar} h-5 w-32`} />
      </div>
    </li>
  );
}

function Message({ title, children, onRetry }: { title: string; children: string; onRetry: () => void }) {
  return (
    <div role="alert" className="mt-6 border border-border bg-card p-6 text-center">
      <p className="text-sm font-semibold text-primary">{title}</p>
      <p className="mt-1 text-sm text-body">{children}</p>
      <button type="button" onClick={onRetry} className="mt-4 inline-flex h-9 items-center border border-primary px-6 text-sm font-medium text-primary transition-colors hover:bg-surface">
        Retry
      </button>
    </div>
  );
}

/**
 * The Rooms tab. Display only: no steppers and no select buttons. Without a search it shows the room types for reference with
 * "Select your dates to see prices"; while a search loads, skeleton rows; with an answer, each room with its exact price (per
 * person for an experience, per night for a hotel) and sold-out rooms marked; none available or an error a clear message and a
 * Retry. Hotels (`selectable`) add a Select button (then a stepper) to each available room once priced; rooms chosen on the page are
 * shown in the booking card. The server and the first render are always the no-dates state, so the HTML is the same for every search and holds the
 * rooms for search engines. A polite live region says "Rooms updated" after each answer.
 */
export function RoomsPanel({ rooms, hotelName, cancellationNote, unit, heading = "Our rooms", selectable = false, stays }: {
  /** Every room (for the loading skeleton and the single list). */
  rooms: HotelRoom[];
  hotelName: string;
  cancellationNote: string;
  unit: "night" | "person";
  heading?: string;
  /** Hotels: once the rooms are priced, each available room has a Select button (rooms are chosen on the page). Experiences choose rooms in checkout. */
  selectable?: boolean;
  /** A package of several properties: the rooms are listed under one heading per property, in order. */
  stays?: { id: string; heading: string; hotelName: string; rooms: HotelRoom[] }[];
}) {
  const { status, rooms: live, updates, request } = useAvailability();
  const today = useToday();
  const { selection } = useStay();
  const byId = new Map<string, RoomAvailability>(live.map((room) => [room.roomId, room]));

  // A room that is sold out for the dates cannot stay selected.
  useEffect(() => {
    if (!selectable || status !== "ready") return;
    for (const id of Object.keys(selection)) if (!byId.get(id)?.available) stayStore.removeRoom(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- byId is rebuilt from `live` each render
  }, [selectable, status, live, selection]);
  const wide = unit === "person";
  // The announcement names the search the new prices are for (that text changes with the search, so it is announced again); without
  // prices the trailing dot alternates so a repeated answer is still announced.
  const summary = status === "ready" && request && request.kind !== "hotel" && today ? searchSummary(request, { today }).full : "";
  const announcement = updates === 0 ? "" : summary ? `Rooms updated. ${summary}` : updates % 2 ? "Rooms updated" : "Rooms updated.";

  const priceLine = (room: RoomAvailability) => (
    <p className="flex items-baseline justify-center gap-x-1.5 whitespace-nowrap text-sm text-body">
      <span className="text-xs">From</span>
      <span className="text-base font-bold text-accent">{formatMoney(room.price)}</span>
      <span>{unit === "person" ? "per person" : "per night"}</span>
    </p>
  );

  const renderRow = (room: HotelRoom, owner: string) => {
    const answer = byId.get(room.id);
    const loaded = status === "ready";
    const soldOut = loaded && !answer?.available;
    return (
      <RoomRow
        key={room.id}
        room={room}
        hotelName={owner}
        cancellationNote={cancellationNote}
        wide={wide}
        muted={soldOut}
        dialogPrice={loaded && answer?.available ? priceLine(answer) : <span className="text-sm text-body">{loaded ? "Sold out for your dates" : "Select your dates to see prices"}</span>}
        dialogAction={selectable && loaded && answer?.available ? <RoomPicker roomId={room.id} roomName={room.name} /> : undefined}
      >
        {!loaded ? (
          <p className="text-sm text-body">Select your dates to see prices</p>
        ) : answer?.available ? (
          <>
            {priceLine(answer)}
            {selectable ? <RoomPicker roomId={room.id} roomName={room.name} /> : null}
          </>
        ) : (
          <p className="inline-flex items-center whitespace-nowrap rounded-full bg-border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-body">
            Sold out<span className="sr-only"> for your dates</span>
          </p>
        )}
      </RoomRow>
    );
  };

  return (
    <section aria-labelledby="rooms-heading" aria-busy={status === "loading" || undefined}>
      <h2 id="rooms-heading" className="font-display text-title-sm font-medium text-primary">
        {heading}
      </h2>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {status === "idle" ? (
        <div className="mt-2 space-y-1 text-sm text-body">
          <p>Rooms depend on your dates. The room types below are shown for reference. Availability and prices are confirmed after you select Check availability.</p>
          <p>{unit === "person" ? "All prices are per person, based on shared occupancy." : "All prices are per room, per night."}</p>
        </div>
      ) : status === "ready" && request && request.kind !== "hotel" ? (
        <PriceSummaryLine className="mt-2 text-sm text-body" />
      ) : (
        <p className="mt-2 text-sm text-body">{unit === "person" ? "All prices are per person, based on shared occupancy." : "All prices are per room, per night."}</p>
      )}

      {status === "loading" ? (
        <ul className="mt-6 space-y-4" aria-label="Loading rooms">
          {Array.from({ length: Math.min(rooms.length, 4) }, (_, index) => (
            <RoomRowSkeleton key={index} />
          ))}
        </ul>
      ) : status === "none" ? (
        <Message title="No rooms are available for your dates" onRetry={() => availabilityStore.retry()}>
          Try other dates, or ask again.
        </Message>
      ) : status === "error" ? (
        <Message title="We could not load the rooms for your dates" onRetry={() => availabilityStore.retry()}>
          Please try again.
        </Message>
      ) : (
        stays ? (
          <div className="mt-6 space-y-10">
            {stays.map((stay) => (
              <section key={stay.id} aria-labelledby={`${stay.id}-heading`}>
                <h3 id={`${stay.id}-heading`} className="font-display text-title-sm font-medium text-primary">
                  {stay.heading}
                </h3>
                <ul className="mt-4 space-y-4">{stay.rooms.map((room) => renderRow(room, stay.hotelName))}</ul>
              </section>
            ))}
          </div>
        ) : (
          <ul className="mt-6 space-y-4">{rooms.map((room) => renderRow(room, hotelName))}</ul>
        )
      )}
    </section>
  );
}
