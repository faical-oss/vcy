"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/helpers/cn";
import { Container } from "./container";
import { IconButton } from "./icon-button";

interface CardCarouselProps {
  /** Left side of the heading row (usually a <SectionHeading/>). */
  heading: ReactNode;
  /** Optional row between heading and cards (e.g. filter pills). */
  toolbar?: ReactNode;
  /** Accessible name for the scrolling region. */
  label: string;
  /** Optional row under the cards, right-aligned (e.g. "All hotels"). */
  footer?: ReactNode;
  /**
   * Cards visible per breakpoint, as Tailwind custom-property classes. Card width is derived from it so
   * the track always shows whole cards: `[--cols:1.4] sm:[--cols:2] lg:[--cols:4]` (default; on phones the next card peeks in, as in the mobile design).
   */
  cols?: string;
  children: ReactNode;
  className?: string;
}

/** Horizontal scroll-snap carousel with prev/next arrows. Cards should be `shrink-0 snap-start`. */
export function CardCarousel({ heading, toolbar, label, footer, cols = "[--cols:1.4] sm:[--cols:2] lg:[--cols:4]", children, className }: CardCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  const scrollByPage = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    // Move by exactly the number of fully visible cards so the track always lands on a card edge.
    const first = el.firstElementChild as HTMLElement | null;
    if (!first) return;
    const step = first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
    const visible = Math.max(1, Math.round(el.clientWidth / step));
    el.scrollBy({ left: direction * visible * step, behavior: "smooth" });
  };

  return (
    <Container className={className}>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="min-w-0 flex-1">{heading}</div>
        <div className="flex shrink-0 gap-1 self-end">
          <IconButton aria-label="Previous" onClick={() => scrollByPage(-1)} disabled={!canPrev} className="border-muted-blue text-muted-blue disabled:border-border disabled:text-border disabled:opacity-100">
            <ChevronLeft className="size-5" />
          </IconButton>
          <IconButton aria-label="Next" onClick={() => scrollByPage(1)} disabled={!canNext} className="border-muted-blue text-muted-blue disabled:border-border disabled:text-border disabled:opacity-100">
            <ChevronRight className="size-5" />
          </IconButton>
        </div>
      </div>
      {toolbar}
      <div
        ref={trackRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        onScroll={update}
        data-grid="carousel"
        className={cn("scrollbar-none mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [&>*]:w-[calc((100%-(var(--cols)-1)*1.25rem)/var(--cols))] [&>*]:shrink-0", cols)}
      >
        {children}
      </div>
      {footer ? <div className="flex justify-end pt-6">{footer}</div> : null}
    </Container>
  );
}
