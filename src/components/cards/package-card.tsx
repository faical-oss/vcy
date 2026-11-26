import { Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { cn } from "@/helpers/cn";
import type { PackageCardData } from "@/interfaces";

function Tick() {
  return (
    <svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className="shrink-0 text-accent">
      <path d="M2 5l2.5 2.5L8 3" />
    </svg>
  );
}

/**
 * Package card (300/340 wide). Same shell as the experience card plus a highlights list. With an `href` the whole card is
 * the link (hover border, stretched link); without one it is a plain card: no hover state, no pointer. The rating row
 * only shows when the package has a rating. `compact` is the "You might also like" card of the mobile design: no highlights, the nights
 * under the location, and the rating and the price share the bottom row.
 */
export function PackageCard({ id, title, badge, category, provider, location, rating, reviewCount, highlights, nights, price, href, images, unavailable, compact, className }: PackageCardData & { unavailable?: boolean; compact?: boolean; className?: string }) {
  return (
    <article className={cn("snap-start", className)}>
      <div className={cn("group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card", href && "transition-colors hover:border-primary")}>
        <ImageCarousel images={images} alt={title} aspect="aspect-[3/2]" sizes="340px">
          <span className="absolute left-3 top-3 z-20 bg-primary px-2.5 py-0.5 text-micro font-medium uppercase tracking-wider text-white">{badge}</span>
          <FavoriteButton item={{ kind: "package", id }} name={title} className="right-2 top-2 size-9" />
        </ImageCarousel>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div>
            <span className="text-micro uppercase tracking-widest text-muted-blue">{category}</span>
            <h3 className="mt-0.5 font-display text-title-sm font-medium leading-snug text-primary">
              {href ? (
                <Link href={href} className="after:absolute after:inset-0 after:z-10">
                  {title}
                </Link>
              ) : (
                title
              )}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-xs text-body">{provider}</p>
          </div>
          <p className="flex items-center gap-1 text-xs text-body">
            <MapPin className="size-[11px] shrink-0" aria-hidden /> {location}
          </p>
          {compact ? (
            <p className="flex items-center gap-1 text-xs text-body">
              <Calendar className="size-[11px] shrink-0" aria-hidden /> {nights} nights
            </p>
          ) : (
            <>
              {rating !== undefined ? <Rating value={rating} reviewCount={reviewCount} /> : null}
              <ul className="mt-1 flex flex-col gap-1">
                {highlights.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-body">
                    <Tick /> {item}
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2.5">
            {compact ? (
              rating !== undefined ? <Rating value={rating} reviewCount={reviewCount} /> : null
            ) : (
              <span className="flex items-center gap-1 text-xs text-body">
                <Calendar className="size-[11px] shrink-0" aria-hidden /> {nights} nights
              </span>
            )}
            <span className="ml-auto">
              <Price price={price} unit="per person" unavailable={unavailable} />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
