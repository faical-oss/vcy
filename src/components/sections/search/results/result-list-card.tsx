import { Calendar, Check, Clock, MapPin, Music, Plane, Star, Tag, Users, Utensils } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { cn } from "@/helpers/cn";
import { formatMoney } from "@/helpers/format";
import type { SearchResultItem } from "@/interfaces";

/** The dates and travellers of the search, as the experience card shows them ("14–21 Sep 2026", "2 guests"). */
export interface StayLabel {
  dates: string;
  guests: string;
}

/*
 * Sizes are those of the Figma prototype's list cards (measured on its screenshots): 297px photo, 18px padding, 10px labels, 24px
 * serif title, 11-12px text, 163px right column; about 260px tall. Hotels, packages and experiences share the shell and differ in the middle.
 */
const OUTLINE_TAG = "border border-border bg-card px-2 py-[5px] text-[10px] uppercase tracking-[0.15em] text-muted-blue";
const SOLID_TAG = "border border-primary bg-primary px-2.5 py-[5px] text-[10px] font-medium uppercase tracking-[0.1em] text-white";
const PHOTO_TAG = "absolute left-3 top-3 z-20";
const TITLE = "font-display text-title-sm font-medium text-primary group-hover:underline";
const SMALL = "flex items-center gap-1.5 text-[11px] text-body";

const Stars = ({ filled, size }: { filled: number; size: string }) => (
  <span className="flex" aria-hidden>
    {Array.from({ length: 5 }, (_, index) => (
      <Star key={index} className={cn(size, index < filled ? "fill-star text-star" : "text-border")} />
    ))}
  </span>
);

/** "From $580 per night", or no text at all without a price (a line of the same height: the cards keep their height; see `Price` for the cards of the Grid view). */
function CardPrice({ item }: { item: SearchResultItem }) {
  if (item.availability === "unavailable") return <span className="text-[11px] font-medium text-body">Not available for these dates</span>;
  if (!item.price) return <span aria-hidden className="text-[15px] font-bold">&nbsp;</span>;
  return (
    <span className="whitespace-nowrap text-[11px] text-body">
      From <span className="text-[15px] font-bold text-accent">{formatMoney(item.price)}</span> {item.kind === "hotel" ? "per night" : "per person"}
    </span>
  );
}

const INCLUSION_ICONS = [Tag, Plane, Utensils, Music];

/**
 * A result in the list view (the Grid view uses the Hotel, Experience and Package cards), laid out per kind like the prototype.
 * Hotels are priced per night, the rest per person. The whole card is the link to the detail page (`href` carries the dates and
 * travellers); the heart sits above it. The layout follows the width of the results column (a container query), not the screen:
 * beside the sidebar on a tablet it stacks.
 */
export function ResultListCard({ item, href, stay }: { item: SearchResultItem; href?: string; stay?: StayLabel }) {
  const title = (
    <h3 className={cn(TITLE, "mt-2")}>
      {href ? (
        <Link href={href} className="after:absolute after:inset-0 after:z-10">
          {item.title}
        </Link>
      ) : (
        item.title
      )}
    </h3>
  );
  const photo = (width: string, badge: ReactNode) => (
    <div className={cn("relative @2xl:shrink-0", width)}>
      <ImageCarousel images={item.images} alt={item.title} aspect="aspect-[2/1] @xl:aspect-[5/2] @2xl:aspect-auto" className="@2xl:h-full" sizes="297px" touchArrows>
        {badge}
      </ImageCarousel>
    </div>
  );
  const rating = (reviews: string) =>
    item.rating !== undefined ? (
      <div className="flex items-center gap-1.5" role="img" aria-label={`${item.rating} out of 5`}>
        <Stars filled={Math.floor(item.rating)} size="size-2.5" />
        <span className={cn("text-body", item.kind === "experience" ? "text-xs" : "text-[11px]")}>
          {item.reviewCount !== undefined ? `${item.rating} (${item.reviewCount}${reviews})` : item.rating}
        </span>
      </div>
    ) : null;
  const right = (pr: string) => (
    <div className={cn("flex items-end border-t border-border px-[18px] pb-[18px] pt-4 @2xl:w-[163px] @2xl:shrink-0 @2xl:justify-end @2xl:border-l @2xl:border-t-0 @2xl:px-0", pr)}>
      <CardPrice item={item} />
    </div>
  );
  const heart = <FavoriteButton item={{ kind: item.kind, id: item.id }} name={item.title} className="right-3 top-3 size-9 @2xl:border-transparent @2xl:bg-transparent @2xl:hover:bg-transparent" />;
  const shell = "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-border-strong @2xl:flex-row";
  const middle = "flex flex-1 flex-col p-[18px]";
  const where = (
    <p className={cn(SMALL, "mt-1.5")}>
      <MapPin className="size-3 shrink-0" aria-hidden /> {item.location}
    </p>
  );

  if (item.kind === "hotel") {
    return (
      <article className={cn(shell, "@2xl:min-h-[259px]")}>
        {photo("@2xl:w-[297px]", <span className={cn(PHOTO_TAG, "bg-card px-2.5 py-1.5 text-[10px] uppercase tracking-[0.15em] text-muted-blue")}>{item.badge}</span>)}
        <div className={middle}>
          <div className="flex">
            <span className={OUTLINE_TAG}>{item.badge}</span>
          </div>
          {title}
          {where}
          <hr className="mb-[3px] mt-[11px] border-border" />
          <p className={SMALL}>
            <Users className="size-3 shrink-0" aria-hidden /> <span className="text-primary">Per night from</span>
          </p>
          <div className="mt-1.5">{rating("")}</div>
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-3">
            {item.amenities.map((entry) => (
              <li key={entry} className="border border-border bg-card px-2 py-px text-[10px] text-body">
                {entry}
              </li>
            ))}
          </ul>
        </div>
        {right("@2xl:pr-6")}
        {heart}
      </article>
    );
  }

  const tags = (badge?: string) => (
    <div className="flex items-stretch gap-1.5">
      <span className={cn(OUTLINE_TAG, "leading-4")}>{item.category}</span>
      {badge ? <span className={cn(SOLID_TAG, "leading-4")}>{badge}</span> : null}
    </div>
  );

  if (item.kind === "package") {
    const [first, second, ...rest] = item.highlights;
    const check = (entry: string, tone: string) => (
      <li key={entry} className={cn("flex items-center gap-1.5 text-xs leading-4", tone)}>
        <Check className="size-3 shrink-0 text-primary" aria-hidden /> {entry}
      </li>
    );
    return (
      <article className={shell}>
        {photo("@2xl:w-[297px]", <span className={cn(PHOTO_TAG, SOLID_TAG)}>{item.badge}</span>)}
        <div className={middle}>
          {tags(item.badge)}
          {title}
          <p className={cn(SMALL, "mt-1.5")}>{item.provider}</p>
          {where}
          <p className={cn(SMALL, "mt-1.5")}>
            <Calendar className="size-3 shrink-0" aria-hidden /> {item.nights} nights
          </p>
          <hr className="mb-[3px] mt-[11px] border-border" />
          <ul className="flex flex-wrap gap-x-3 gap-y-0.5">{[first, second].filter(Boolean).map((entry) => check(entry, "text-primary"))}</ul>
          <div className="mt-1.5">{rating("")}</div>
          <ul className="mt-3.5 flex flex-col gap-0.5">{rest.map((entry) => check(entry, "text-body"))}</ul>
        </div>
        {right("@2xl:pr-3")}
        {heart}
      </article>
    );
  }

  return (
    <article className={shell}>
      {photo("@2xl:w-[297px]", null)}
      <div className={middle}>
        {tags(item.badge)}
        {title}
        <p className={cn(SMALL, "mt-1.5")}>{item.provider}</p>
        {where}
        <p className={cn(SMALL, "mt-1.5 gap-3")}>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3 shrink-0" aria-hidden /> {item.nights} nights
          </span>
          {item.groupMax ? (
            <span className="flex items-center gap-1.5">
              <Users className="size-3 shrink-0" aria-hidden /> Max {item.groupMax}
            </span>
          ) : null}
        </p>
        <hr className="mb-[3px] mt-[11px] border-border" />
        {stay ? (
          <p className="flex items-center gap-3 text-xs text-primary">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3 shrink-0" aria-hidden /> {stay.dates}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-3 shrink-0" aria-hidden /> {stay.guests}
            </span>
          </p>
        ) : null}
        <div className="mt-1.5">{rating(" reviews")}</div>
        {item.inclusions?.length ? (
          <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-0.5">
            {item.inclusions.map((entry, index) => {
              const Icon = INCLUSION_ICONS[index % INCLUSION_ICONS.length];
              return (
                <li key={entry} className="flex items-center gap-1.5 text-xs leading-4 text-body">
                  <Icon className="size-3 shrink-0" aria-hidden /> {entry}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      {right("@2xl:pr-4")}
      {heart}
    </article>
  );
}
