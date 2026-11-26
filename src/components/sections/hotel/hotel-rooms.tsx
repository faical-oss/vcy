import { Suspense, type ReactNode } from "react";
import { formatMoney } from "@/helpers/format";
import type { HotelRoom } from "@/interfaces";
import { DialogPrice } from "./room-details-dialog";
import { RoomRow } from "./room-row";
import { RoomCheckoutLinkFallback } from "./room-checkout-link";

/**
 * Rooms tab: room cards with a photo carousel, the details dialog, features and a "from" price. `action` is the control on each
 * card and in its dialog: on hotels the quantity stepper (rooms are chosen on the page, with `summary` the sticky bar under the
 * list); on experiences there is none (rooms are chosen in checkout), so the cards are informational. `heading`, `intro`, `priceCaption` and
 * `priceSuffix` let an experience say "per person". `livePrice(roomId)` renders the live price for the chosen dates inside its
 * own Suspense, so it never enters the cached shell. (Token gaps: the 200px photo and the 180px, or 230px inline, price columns.)
 */
export function HotelRooms({ rooms, hotelName, cancellationNote, livePrice, action, heading = "Choose your room", intro = "All rooms include daily breakfast. Select dates to see total prices.", priceCaption = "Per night from", priceSuffix, priceLayout = "stacked", summary }: { rooms: HotelRoom[]; hotelName: string; cancellationNote: string; heading?: string; intro?: string; /** The small line above each card's price ("Per night from", "From"). */ priceCaption?: string; /** Text after each price (" per person"). */ priceSuffix?: string; /** "stacked": small caption over a serif price (hotels). "inline": one line "From $1,295 per person" (experiences). */ priceLayout?: "stacked" | "inline"; livePrice?: (roomId: string) => ReactNode; /** The optional shortcut on a card and in its dialog (a link to checkout with the room preselected). Without it the cards are purely informational (experiences). */ action?: (room: { id: string; name: string }) => ReactNode; /** The sticky "N of M rooms selected" bar with Continue (hotels, where rooms are chosen on the page). */ summary?: ReactNode }) {
  return (
    <section aria-labelledby="rooms-heading">
      <h2 id="rooms-heading" className="font-display text-title-sm font-medium text-primary">
        {heading}
      </h2>
      <p className="mt-2 text-sm text-body">{intro}</p>
      <ul className="mt-6 space-y-4">
        {rooms.map((room) => (
          <RoomRow
            key={room.id}
            room={room}
            hotelName={hotelName}
            cancellationNote={cancellationNote}
            wide={priceLayout === "inline"}
            dialogPrice={room.priceFrom ? <DialogPrice price={room.priceFrom} caption={priceCaption} suffix={priceSuffix} /> : undefined}
            dialogAction={action ? <Suspense fallback={<RoomCheckoutLinkFallback roomName={room.name} />}>{action(room)}</Suspense> : undefined}
          >
            {room.priceFrom ? (
              priceLayout === "inline" ? (
                // One centred line, "From $1,295 per person": the caption and the unit in body text, the price bold in the accent colour.
                <p className="flex items-baseline justify-center gap-x-1.5 whitespace-nowrap text-sm text-body">
                  <span>{priceCaption}</span>
                  <span className="text-base font-bold text-accent">{formatMoney(room.priceFrom)}</span>
                  {priceSuffix ? <span>{priceSuffix}</span> : null}
                </p>
              ) : (
                <p className="flex flex-wrap items-baseline justify-center gap-x-1.5">
                  <span className="text-micro uppercase tracking-widest text-muted-blue">{priceCaption}</span>
                  <span className="font-display text-title-sm font-semibold text-primary">{formatMoney(room.priceFrom)}</span>
                  {priceSuffix ? <span className="text-xs text-body">{priceSuffix}</span> : null}
                </p>
              )
            ) : null}
            {/* Second line: empty until valid dates are chosen; stacked cards reserve its height so they do not jump. */}
            {livePrice ? <div className={priceLayout === "inline" ? "text-sm text-primary empty:hidden" : "min-h-5 text-sm text-primary"}>{livePrice(room.id)}</div> : null}
            {action ? <Suspense fallback={<RoomCheckoutLinkFallback roomName={room.name} />}>{action(room)}</Suspense> : null}
          </RoomRow>
        ))}
      </ul>
      {summary ? <Suspense fallback={null}>{summary}</Suspense> : null}
    </section>
  );
}
