"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { cn } from "@/helpers/cn";
import { useSwipe } from "@/hooks/use-swipe";
import type { DetailImage } from "@/interfaces";
import { SAFE_AREA_PADDING } from "@/constants/safe-area";

/**
 * Full-screen viewer for every photo: "All photos · N photos" and Close on top, the photo with previous and next buttons and a
 * "1 / N" counter, and a strip of thumbnails below (the current one has a white border). The arrow keys move between photos
 * (Home and End jump), Escape and the Close button close it and give focus back to what opened it. The photo is hidden from
 * the page behind (Radix makes it inert). Rendered inside a `Dialog.Root` owned by the caller.
 */
export function PhotoLightbox({ images, title, start = 0, returnFocusTo }: { images: DetailImage[]; title: string; start?: number; /** What gets focus when it closes (Radix only knows a Dialog.Trigger, and the caller has none). */ returnFocusTo?: RefObject<HTMLElement | null> }) {
  const [index, setIndex] = useState(start);
  const active = useRef<HTMLButtonElement>(null);
  const move = (delta: number) => setIndex((current) => (current + delta + images.length) % images.length);
  const swipeHandlers = useSwipe((direction) => move(-direction));

  // Keep the current thumbnail in view in the strip.
  useEffect(() => {
    active.current?.scrollIntoView?.({ block: "nearest", inline: "center" }); // not in every environment (jsdom)
  }, [index]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") move(-1);
    else if (event.key === "ArrowRight") move(1);
    else if (event.key === "Home") setIndex(0);
    else if (event.key === "End") setIndex(images.length - 1);
    else return;
    event.preventDefault();
  }

  const current = images[index];
  const arrow = "absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-primary transition-colors hover:bg-card";

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90" />
      <Dialog.Content
        onKeyDown={onKeyDown}
        onCloseAutoFocus={(event) => {
          if (!returnFocusTo?.current) return;
          event.preventDefault();
          returnFocusTo.current.focus();
        }}
        className={`fixed inset-0 z-50 flex flex-col text-white outline-none ${SAFE_AREA_PADDING}`}
      >
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <Dialog.Title className="text-sm">
            <span className="font-semibold">All photos</span> <span className="text-white/70">· {images.length} photos</span>
          </Dialog.Title>
          <Dialog.Description className="sr-only">Photos of {title}. Use the left and right arrow keys to move between photos.</Dialog.Description>
          <Dialog.Close className="flex items-center gap-1.5 px-2 py-1 text-sm hover:bg-white/10">
            <X className="size-4" aria-hidden /> Close
          </Dialog.Close>
        </div>

        <div className="relative mx-auto min-h-0 w-full max-w-[1100px] flex-1 px-4 sm:px-14">
          <div className="relative size-full touch-pan-y" {...swipeHandlers}>
            <Image key={current.src} src={current.src} alt={current.alt} fill sizes="(min-width: 1100px) 1100px, 100vw" className="object-contain" />
          </div>
          {images.length > 1 ? (
            <>
              <button type="button" aria-label="Previous photo" onClick={() => move(-1)} className={cn(arrow, "left-2 sm:left-4")}>
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button type="button" aria-label="Next photo" onClick={() => move(1)} className={cn(arrow, "right-2 sm:right-4")}>
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </>
          ) : null}
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 text-xs" aria-live="polite">
            {index + 1} / {images.length}
          </p>
        </div>

        {images.length > 1 ? (
          <ul className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3 sm:px-6" aria-label={`Photos of ${title}`}>
            {images.map((image, position) => (
              <li key={`${image.src}-${position}`} className="shrink-0">
                <button
                  ref={position === index ? active : undefined}
                  type="button"
                  aria-label={`Show photo ${position + 1}`}
                  aria-current={position === index}
                  onClick={() => setIndex(position)}
                  className={cn("relative block h-12 w-16 overflow-hidden border-2 transition-opacity sm:h-14 sm:w-20", position === index ? "border-white" : "border-transparent opacity-60 hover:opacity-100")}
                >
                  <Image src={image.src} alt="" fill sizes="80px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
