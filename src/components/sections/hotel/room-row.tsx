import { BedDouble, Check } from "lucide-react";
import type { ReactNode } from "react";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { cn } from "@/helpers/cn";
import type { HotelRoom } from "@/interfaces";
import { RoomDetailsDialog } from "./room-details-dialog";

/**
 * One room row: photo carousel, name (opens the details dialog), size, bed, board and features, then a price column. The row
 * knows no price and no button: `children` is the price column (a "from" price, "Select your dates to see prices", an exact
 * price, a sold-out mark...). `dialogPrice` and `dialogAction` fill the dialog's footer. `wide` makes the price column 230px for
 * a one-line price; `muted` marks a sold-out row: a tinted card, the photo greyed under a crossed-bed icon and "Sold out", and text that keeps 4.5:1 contrast. (Token gaps: the 200px photo and the 180px or 230px price columns.)
 */
export function RoomRow({ room, hotelName, cancellationNote, children, dialogPrice, dialogAction, wide = false, muted = false }: { room: HotelRoom; hotelName: string; cancellationNote: string; children: ReactNode; dialogPrice?: ReactNode; dialogAction?: ReactNode; wide?: boolean; muted?: boolean }) {
  return (
    <li className={cn("grid overflow-hidden border border-border", muted ? "bg-surface-blue" : "bg-card", wide ? "md:grid-cols-[200px_1fr_230px]" : "md:grid-cols-[200px_1fr_180px]")} data-sold-out={muted || undefined}>
      <div className="relative">
        <div className={cn(muted && "opacity-60 grayscale")}>
          <ImageCarousel images={room.images.map((image) => image.src)} alt={room.images[0]?.alt ?? `${room.name} at ${hotelName}`} aspect="aspect-[4/3] md:aspect-auto md:h-full md:min-h-[160px]" sizes="200px" touchArrows swipe />
        </div>
        {muted ? (
          <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-primary/45 text-white">
            <span className="relative flex size-14 items-center justify-center rounded-full border-2 border-white">
              <BedDouble className="size-6" strokeWidth={1.75} />
              <span className="absolute h-0.5 w-9 -rotate-45 bg-white" />
            </span>
            <span className="text-sm font-medium">Sold out</span>
          </div>
        ) : null}
      </div>
      <div className="flex flex-col justify-center gap-3 p-5">
        <h3 className="text-base font-medium text-primary">
          <RoomDetailsDialog room={room} cancellationNote={cancellationNote} price={dialogPrice} action={dialogAction} />
        </h3>
        <p className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs", muted ? "text-body" : "text-primary")}>
          <span>
            <span className={muted ? "text-body" : "text-muted-blue"}>Size:</span> {room.sizeSqm} m²
          </span>
          <span>
            <span className={muted ? "text-body" : "text-muted-blue"}>Bed:</span> {room.bed}
          </span>
          <span>
            <span className={muted ? "text-body" : "text-muted-blue"}>Board:</span> {room.board}
          </span>
        </p>
        <ul className={cn("flex flex-wrap gap-x-4 gap-y-1 text-xs", muted ? "text-body" : "text-primary")}>
          {room.features.map((feature) => (
            <li key={feature} className="flex items-center gap-1.5">
              <Check className="size-3 shrink-0 text-primary" strokeWidth={3} aria-hidden /> {feature}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 border-t border-border p-5 text-center md:border-l md:border-t-0">{children}</div>
    </li>
  );
}
