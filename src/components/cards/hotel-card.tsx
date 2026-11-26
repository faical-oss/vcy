import { MapPin } from "lucide-react";
import Link from "next/link";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { cn } from "@/helpers/cn";
import type { HotelCardData } from "@/interfaces";

/**
 * Hotel card (240/260 wide): name, location, rating, amenity chips, nightly price. `compact` is the "You might also like" card of the
 * mobile design: no amenity chips, and the rating and the price share one row.
 */
export function HotelCard({ id, title, badge, stars, location, rating, reviewCount, amenities, price, href, images, unavailable, compact, className }: HotelCardData & { unavailable?: boolean; compact?: boolean; className?: string }) {
  return (
    <article className={cn("snap-start", className)}>
      <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary">
        <ImageCarousel images={images} alt={title} aspect="aspect-[4/3]" sizes="260px">
          <span className="absolute left-3 top-3 z-30 bg-primary px-2.5 py-1 text-micro uppercase tracking-widest text-white">{badge}</span>
          <FavoriteButton item={{ kind: "hotel", id }} name={title} className="right-2 top-2 z-30 size-9" />
        </ImageCarousel>
        <div className="flex flex-1 flex-col gap-2 p-4">
          {/* The class (stars) is data, not decoration: it stays for screen readers only. */}
          <span className="sr-only">{stars}-star hotel</span>
          <h3 className="font-display text-title-sm font-medium leading-snug text-primary">
            <Link href={href} className="after:absolute after:inset-0 after:z-10">
              {title}
            </Link>
          </h3>
          <p className="flex items-center gap-1 text-xs text-body">
            <MapPin className="size-[11px] shrink-0" aria-hidden /> {location}
          </p>
          {compact ? null : <Rating value={rating} reviewCount={reviewCount} />}
          {compact ? null : (
            <ul className="mt-0.5 flex flex-wrap gap-1">
              {amenities.map((item) => (
                <li key={item} className="border border-border bg-card px-2 py-0.5 text-micro text-body">
                  {item}
                </li>
              ))}
            </ul>
          )}
          <div className={cn("mt-auto border-t border-border pt-2.5", compact && "flex flex-wrap items-center justify-between gap-x-3 gap-y-1")}>
            {compact ? <Rating value={rating} reviewCount={reviewCount} /> : null}
            <Price price={price} unit="per night" unavailable={unavailable} />
          </div>
        </div>
      </div>
    </article>
  );
}
