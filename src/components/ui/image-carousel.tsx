"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useSwipe } from "@/hooks/use-swipe";
import { cn } from "@/helpers/cn";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  /** Tailwind aspect utility, e.g. "aspect-[4/3]". */
  aspect: string;
  sizes: string;
  /** Also show the arrows on touch devices (always visible there, as there is no hover). Hover devices reveal them only while the image is hovered or focused. */
  touchArrows?: boolean;
  /** A horizontal swipe changes the photo. Leave it off inside a sideways scrolling list (the swipe belongs to the list). */
  swipe?: boolean;
  /** Classes of the root, e.g. `h-full` to fill a taller parent (with `aspect-auto` as the aspect). */
  className?: string;
  /** Overlays (badge, favorite button) rendered above the photos. */
  children?: ReactNode;
}

/** Cross-fading photo gallery for cards: arrows appear when the card is hovered or focused on hover-capable devices (and always on touch devices with `touchArrows`), dots below. */
export function ImageCarousel({ images, alt, aspect, sizes, touchArrows = false, swipe = false, className, children }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const go = (next: number) => setIndex((next + images.length) % images.length);
  const swipeHandlers = useSwipe((direction) => go(index - direction));

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn("group/carousel relative w-full overflow-hidden", aspect, className && "h-full")}
        {...(swipe ? swipeHandlers : {})}
      >
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i === index ? alt : ""}
            fill
            sizes={sizes}
            className={cn("object-cover transition-opacity duration-300", i === index ? "z-10 opacity-100" : "z-0 opacity-0")}
          />
        ))}
        {images.length > 1 ? (
          <>
            {([-1, 1] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                aria-label={dir === -1 ? "Previous image" : "Next image"}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  go(index + dir);
                }}
                className={cn(
                  "absolute top-1/2 z-20 size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-primary transition-opacity focus-visible:opacity-100 motion-reduce:transition-none",
                  // Hover devices: hidden until the image is hovered or focused. Touch: hidden, or always visible with `touchArrows`.
                  touchArrows ? "flex" : "hidden",
                  "[@media(hover:hover)]:flex [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/carousel:opacity-100 [@media(hover:hover)]:group-focus-within/carousel:opacity-100",
                  dir === -1 ? "left-2" : "right-2",
                )}
              >
                {dir === -1 ? <ChevronLeft className="size-3.5" aria-hidden /> : <ChevronRight className="size-3.5" aria-hidden />}
              </button>
            ))}
            <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1">
              {images.map((src, i) => (
                <button key={src} type="button" aria-label={`Go to image ${i + 1}`} aria-current={i === index || undefined} onClick={() => setIndex(i)} className="flex size-5 items-center justify-center">
                  <span className={cn("block size-1.5 rounded-full transition-colors", i === index ? "bg-card" : "bg-card/50")} />
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
      {children}
    </div>
  );
}
