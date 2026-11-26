import { MapPin, Star } from "lucide-react";
import type { ReactNode } from "react";
import { DetailHeader, MetaItem, RatingLine } from "@/components/sections/detail/detail-header";
import type { HotelDetail } from "@/interfaces";

/**
 * Hotel header on the shared `DetailHeader`: class stars with the type badge and highlights ("Top rated"), the H1, and the
 * rating and location line (rating first in the DOM; from `md` it is last in the row). `actions` is Back, then Favorite and Share.
 */
export function HotelHeader({ hotel, breadcrumb, actions }: { hotel: HotelDetail; breadcrumb: ReactNode; actions: ReactNode }) {
  return (
    <DetailHeader
      breadcrumb={breadcrumb}
      title={hotel.name}
      actions={actions}
      badges={
        <>
          <div className="flex gap-px" role="img" aria-label={`${hotel.stars}-star hotel`}>
            {Array.from({ length: hotel.stars }, (_, index) => (
              <Star key={index} aria-hidden className="size-3.5 fill-star text-star" />
            ))}
          </div>
          <span className="border border-border px-2 py-1 text-micro uppercase tracking-widest text-muted-blue">{hotel.badge}</span>
          {hotel.highlights.map((highlight) => (
            <span key={highlight} className="border border-primary bg-primary px-2 py-1 text-micro font-semibold uppercase tracking-widest text-white">
              {highlight}
            </span>
          ))}
        </>
      }
      meta={
        <>
          <RatingLine overall={hotel.reviews.overall} count={hotel.reviews.count} />
          <MetaItem icon={<MapPin className="size-3.5" aria-hidden />}>{hotel.location.label}</MetaItem>
        </>
      }
    />
  );
}
