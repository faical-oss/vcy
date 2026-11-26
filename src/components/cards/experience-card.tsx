import { Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { cn } from "@/helpers/cn";
import type { ExperienceCardData } from "@/interfaces";

/**
 * Experience card (280/300 wide). Photo gallery on top, details below, price pinned to the bottom. `compact` is the "You might also like" card of
 * the mobile design: the nights sit under the location, and the rating and the price share the bottom row.
 */
export function ExperienceCard({ id, title, category, provider, location, rating, reviewCount, nights, price, href, images, unavailable, compact, className }: ExperienceCardData & { unavailable?: boolean; compact?: boolean; className?: string }) {
  return (
    <article className={cn("snap-start", className)}>
      <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-border-strong">
        <ImageCarousel images={images} alt={title} aspect="aspect-[4/3]" sizes="300px">
          <FavoriteButton item={{ kind: "experience", id }} name={title} className="right-3 top-3 p-1.5" />
          <span className="absolute left-3 top-3 z-20 bg-primary px-2.5 py-1 text-micro uppercase tracking-widest text-white">{category}</span>
        </ImageCarousel>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="font-display text-title-sm font-medium leading-snug text-primary">
            <Link href={href} className="after:absolute after:inset-0 after:z-10">
              {title}
            </Link>
          </h3>
          <p className="-mt-1 line-clamp-1 text-xs text-body">{provider}</p>
          <p className="flex items-center gap-1 text-xs text-body">
            <MapPin className="size-[11px] shrink-0" aria-hidden /> {location}
          </p>
          {compact ? (
            <p className="flex items-center gap-1 text-xs text-body">
              <Clock className="size-[11px] shrink-0" aria-hidden /> {nights} nights
            </p>
          ) : (
            <Rating value={rating} reviewCount={reviewCount} />
          )}
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2.5">
            {compact ? (
              <Rating value={rating} reviewCount={reviewCount} />
            ) : (
              <span className="flex items-center gap-1 text-xs text-body">
                <Clock className="size-[11px] shrink-0" aria-hidden /> {nights} nights
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
