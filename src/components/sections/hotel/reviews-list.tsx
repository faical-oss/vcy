"use client";

import { Loader2 } from "lucide-react";
import { startTransition, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMonthYear } from "@/helpers/format";
import { initialsOf } from "@/helpers/initials";
import type { HotelReview, ReviewListResult } from "@/interfaces";
import { reviewStars } from "./review-stars";

export type LoadMoreReviews = (slug: string, offset: number) => Promise<ReviewListResult>;

interface ReviewsListProps {
  /** The reviews in the server HTML. */
  initial: HotelReview[];
  /** All reviews of the item ("Showing 3 of 124 reviews"). */
  total: number;
  slug: string;
  /** Absent: no "Load more" (the list is what the server sent). */
  loadMore?: LoadMoreReviews;
  avatar?: "round" | "square";
}

/**
 * The review list with a "Load more reviews" button and a "Showing 14 of 975 reviews" count, like the booking sites. Below `md` the list grows
 * with the page (no inner scroll box). From `md` it is a box of at most 40rem that scrolls inside; its scroll always continues to the page at its
 * ends (`overscroll-auto`: a scroll is never trapped), it is a named region, and it is a tab stop only while it scrolls (so the keyboard can
 * scroll it). The first
 * reviews come from the server HTML; the button asks for the next 10 in the browser, keeps the ones shown, moves focus to the
 * first new review, and announces the result. On failure it says so and offers "Try again".
 */
export function ReviewsList({ initial, total, slug, loadMore, avatar = "round" }: ReviewsListProps) {
  const [items, setItems] = useState(initial);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [announcement, setAnnouncement] = useState("");
  const focusIndex = useRef<number | null>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const busy = useRef(false);
  const box = useRef<HTMLDivElement>(null);

  // A scroll box is a keyboard stop only while it scrolls (from md, with a long list); a list that grows with the page is not one.
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const update = () => (element.scrollHeight > element.clientHeight + 1 ? element.setAttribute("tabindex", "0") : element.removeAttribute("tabindex"));
    update();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(element);
    return () => observer?.disconnect();
  }, [items]);

  useEffect(() => {
    if (focusIndex.current === null) return;
    itemRefs.current[focusIndex.current]?.focus();
    focusIndex.current = null;
  }, [items]);

  const remaining = Math.max(0, total - items.length);

  function more() {
    if (!loadMore || busy.current) return;
    busy.current = true;
    setStatus("loading");
    setAnnouncement("Loading more reviews…");
    startTransition(async () => {
      const result = await loadMore(slug, items.length).catch((): ReviewListResult => ({ ok: false, code: "unavailable" }));
      busy.current = false;
      if (!result.ok) {
        setStatus("error");
        setAnnouncement("We could not load more reviews.");
        return;
      }
      const known = new Set(items.map((item) => item.id));
      const added = result.items.filter((item) => !known.has(item.id)).slice(0, remaining);
      focusIndex.current = items.length;
      setItems([...items, ...added]);
      setStatus("idle");
      setAnnouncement(`${added.length} more reviews loaded. Showing ${items.length + added.length} of ${total} reviews.`);
    });
  }

  return (
    <div>
      <div ref={box} role="region" aria-label="Guest reviews" className="border-y border-border md:max-h-[40rem] md:overflow-y-auto md:overscroll-auto md:pr-3">
        <ul className="divide-y divide-border">
        {items.map((review, index) => (
          <li key={review.id} ref={(node) => { itemRefs.current[index] = node; }} tabIndex={-1} className="flex gap-4 py-6 outline-none focus-visible:bg-surface">
            <span aria-hidden className={avatar === "square" ? "flex size-10 shrink-0 items-center justify-center bg-border/60 text-sm font-medium text-body" : "flex size-10 shrink-0 items-center justify-center rounded-full bg-border/60 text-sm font-medium text-body"}>
              {avatar === "square" ? review.author.charAt(0) : initialsOf(review.author)}
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                <span className="font-semibold text-primary">{review.author}</span>
                <span className="text-xs text-muted-blue">{review.location}</span>
                <span className="text-xs text-muted">{formatMonthYear(review.date)}</span>
              </p>
              <div className="mt-1 flex" role="img" aria-label={`${review.rating} out of 5`}>
                {reviewStars(review.rating, "size-3")}
              </div>
              <p className="mt-2 text-sm font-semibold text-primary">{review.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-body">{review.text}</p>
            </div>
          </li>
        ))}
        </ul>
      </div>

      {total > initial.length || items.length > initial.length ? (
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          {loadMore && remaining > 0 ? (
            <Button type="button" variant="outline" size="lg" onClick={more} aria-disabled={status === "loading"} className="min-w-56 border-primary/40 normal-case tracking-normal">
              {status === "loading" ? (
                <>
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> Loading…
                </>
              ) : status === "error" ? (
                "Try again"
              ) : (
                "Load more reviews"
              )}
            </Button>
          ) : null}
          <p className="text-sm text-primary">{remaining === 0 ? `Showing all ${total} reviews` : `Showing ${items.length} of ${total} reviews`}</p>
          {status === "error" ? <p className="text-sm text-error">We could not load more reviews.</p> : null}
        </div>
      ) : null}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
