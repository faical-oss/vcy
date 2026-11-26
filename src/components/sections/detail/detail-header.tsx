import { ScrollRow } from "@/components/ui/scroll-row";
import { Star } from "lucide-react";
import type { ReactNode } from "react";

export function Stars({ count, className }: { count: number; className: string }) {
  return Array.from({ length: 5 }, (_, index) => <Star key={index} aria-hidden className={index < count ? `${className} fill-star text-star` : `${className} text-border`} />);
}

/**
 * Rating stars, the score and the review count, as in the meta row of every detail page. The stars and the score stay together; the review
 * count follows them on the same line and, when the line is full (320px), wraps below the score, never over it. It is first in the header's
 * meta, so below `md` it reads right after the title; from `md` it moves to the end of the row (`md:order-last`).
 */
export function RatingLine({ overall, count }: { overall: number; count: number }) {
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 md:order-last">
      <span className="flex items-center gap-1.5">
        <span className="flex" role="img" aria-label={`${overall.toFixed(1)} out of 5`}>
          <Stars count={Math.round(overall)} className="size-3.5" />
        </span>
        <span className="font-semibold leading-5 text-primary">{overall.toFixed(1)}</span>
      </span>
      <span className="leading-5">({count} reviews)</span>
    </span>
  );
}

/** One item of the meta row: an icon and its text. Below `md` the items stack in DOM order, under the rating. */
export function MetaItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="flex items-start gap-1.5 md:items-center">
      <span className="mt-0.5 shrink-0 md:mt-0">{icon}</span>
      <span className="min-w-0">{children}</span>
    </span>
  );
}

/**
 * Shared header of the detail pages. The DOM, visual and focus order are one below `md`: the breadcrumb, `actions` (Back, then Favorite and
 * Share side by side), the page's single H1, an optional subtitle, the meta (rating and review count, location, key facts), then the badges.
 * From `md` the actions sit on the right, spanning the breadcrumb row and the info block (grid placement), and in the info block the badges
 * move above the H1 and the rating to the end of the meta row (`order`): the desktop design is unchanged. The one column below `md` is
 * `minmax(0,1fr)`: with an implicit `auto` column the badge row (one line, scrolls) stretched it past the screen and clipped the action
 * buttons. The title wraps over as many lines as it needs and is never cut.
 */
export function DetailHeader({ breadcrumb, badges, title, subtitle, meta, actions }: { breadcrumb: ReactNode; badges: ReactNode; title: string; subtitle?: string; meta: ReactNode; actions: ReactNode }) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-x-4 md:gap-y-0">
      <div className="min-w-0 md:col-start-1 md:row-start-1">{breadcrumb}</div>
      <div className="md:col-start-2 md:row-span-2 md:row-start-1">{actions}</div>
      <div className="flex min-w-0 flex-col gap-y-2 md:col-start-1 md:row-start-2 md:gap-y-0">
        <h1 className="break-words font-display text-title-sm font-medium text-primary md:order-2 md:mt-2 md:text-title-lg">{title}</h1>
        {subtitle ? <p className="text-sm text-body md:order-3 md:mt-1">{subtitle}</p> : null}
        <p className="contents text-sm text-body md:order-4 md:mt-2 md:flex md:flex-wrap md:items-center md:gap-x-4 md:gap-y-1">{meta}</p>
        <ScrollRow role="group" aria-label="Highlights" className="items-center md:order-1 md:mt-[calc(0.75rem-8px)] [&>*]:whitespace-nowrap">{badges}</ScrollRow>
      </div>
    </header>
  );
}
