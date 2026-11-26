"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Play, X } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { cn } from "@/helpers/cn";
import type { DetailImage, GalleryGroup, GalleryVideo } from "@/interfaces";
import { PhotoLightbox } from "./photo-lightbox";
import { VideoModal } from "./video-modal";
import { SAFE_AREA_PADDING } from "@/constants/safe-area";

/** Groups to show: the given ones, or one "All photos" section built from `images` (and then no strip). */
export function resolveGroups(groups: readonly GalleryGroup[] | undefined, images: readonly DetailImage[]): { groups: GalleryGroup[]; grouped: boolean } {
  const usable = (groups ?? []).filter((group) => group.images.length > 0);
  if (usable.length > 0) return { groups: usable, grouped: true };
  return { groups: images.length > 0 ? [{ id: "all-photos", title: "All photos", thumbnail: images[0], images: [...images] }] : [], grouped: false };
}

/** The id of the first group that holds this photo (by its source), or null. */
export function groupOfImage(groups: readonly GalleryGroup[], src: string): string | null {
  return groups.find((group) => group.images.some((image) => image.src === src))?.id ?? null;
}

/**
 * The grid of one section: a full-width photo, then two side by side, and so on. Every photo has a fixed aspect ratio, so
 * nothing shifts while it loads, and loads lazily (the modal is far below the fold of its own scroll).
 */
function PhotoGrid({ images, videos = [], offset, onOpen, onPlay }: { images: DetailImage[]; videos?: GalleryVideo[]; offset: number; onOpen: (flatIndex: number, opener: HTMLElement) => void; onPlay: (video: GalleryVideo, opener: HTMLElement) => void }) {
  const total = images.length;
  return (
    <ul className="grid grid-cols-2 gap-2">
      {videos.map((video) => (
        <li key={video.url} className="relative col-span-2 aspect-video overflow-hidden bg-primary">
          <button type="button" onClick={(event) => onPlay(video, event.currentTarget)} aria-label={`Play video: ${video.title}`} className="group absolute inset-0">
            <Image src={video.poster.src} alt="" fill loading="lazy" sizes="(min-width: 1024px) 760px, 100vw" className="object-cover opacity-90 transition-opacity group-hover:opacity-100" />
            <span aria-hidden className="absolute inset-0 bg-primary/30" />
            <span aria-hidden className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-card text-primary shadow-header transition-transform group-hover:scale-105">
              <Play className="size-5 fill-primary" />
            </span>
            <span aria-hidden className="absolute bottom-3 left-3 bg-primary/90 px-2.5 py-1 text-xs font-medium text-white">Video</span>
          </button>
        </li>
      ))}
      {images.map((image, index) => {
        const wide = index % 3 === 0;
        return (
          <li key={`${image.src}-${index}`} className={cn("relative overflow-hidden bg-surface", wide ? "col-span-2 aspect-[3/2]" : "aspect-[4/3]")}>
            <button type="button" onClick={(event) => onOpen(offset + index, event.currentTarget)} aria-label={`Open photo ${index + 1} of ${total}: ${image.alt}`} className="absolute inset-0">
              <Image src={image.src} alt={image.alt} fill loading="lazy" sizes={wide ? "(min-width: 1024px) 760px, 100vw" : "(min-width: 1024px) 376px, 50vw"} className="object-cover transition-opacity hover:opacity-90" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function GalleryContent({ groups, grouped, title, startSrc, returnFocusTo, onClose }: { groups: GalleryGroup[]; grouped: boolean; title: string; startSrc?: string; returnFocusTo?: RefObject<HTMLElement | null>; onClose: () => void }) {
  const sections = useRef<Record<string, HTMLElement | null>>({});
  const [lightbox, setLightbox] = useState<number | null>(null);
  const lightboxOpener = useRef<HTMLElement | null>(null);
  const [video, setVideo] = useState<GalleryVideo | null>(null);
  const videoOpener = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(groups[0]?.id);
  // State, not refs: Radix mounts the portal content after this component, so effects must wait for the elements to exist.
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const [strip, setStrip] = useState<HTMLElement | null>(null);
  const stripButtons = useRef<Record<string, HTMLButtonElement | null>>({});
  // Height of the sticky strip (an estimate until measured): sections stop below it when scrolled to.
  const [stripH, setStripH] = useState(grouped && groups.length > 1 ? 120 : 0);
  const flat = useMemo(() => groups.flatMap((group) => group.images), [groups]);
  const offsets = useMemo(() => groups.map((_, index) => groups.slice(0, index).reduce((sum, group) => sum + group.images.length, 0)), [groups]);

  // Opened from a photo of the page: bring that photo's section to the top, once, as soon as the section exists (Radix mounts
  // the portal content after this component, so an effect here would run too early).
  const startId = useMemo(() => (startSrc ? groupOfImage(groups, startSrc) : null), [groups, startSrc]);
  const scrolledToStart = useRef(false);
  const attach = (id: string) => (node: HTMLElement | null) => {
    sections.current[id] = node;
    // The first group is already at the top, under the strip: leave it there so the strip stays in view.
    if (node && id === startId && id !== groups[0]?.id && !scrolledToStart.current) {
      scrolledToStart.current = true;
      node.scrollIntoView?.({ block: "start" });
    }
  };

  // Measure the sticky strip.
  useEffect(() => {
    if (!strip) return;
    const measure = () => setStripH(Math.round(strip.getBoundingClientRect().height));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [strip]);

  // The strip follows the scroll: the last section whose top has reached the strip is the current one (at the very end, the last
  // group), and its thumbnail stays in view. A scroll listener (one frame at a time), not an IntersectionObserver, so it needs no
  // browser support beyond scroll events and works the same everywhere.
  useEffect(() => {
    const root = scroller;
    if (!root || groups.length < 2) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rootTop = root.getBoundingClientRect().top;
      let current = groups[0].id;
      for (const group of groups) {
        const node = sections.current[group.id];
        if (node && node.getBoundingClientRect().top - rootTop <= stripH + 24) current = group.id;
      }
      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 2 && root.scrollTop > 0) current = groups[groups.length - 1].id;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      root.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [groups, stripH, scroller]);

  // Keep the current thumbnail in view by scrolling the strip's own list sideways. Not `scrollIntoView`: it would also start a
  // smooth scroll of the modal and cancel the one a click just started (a thumbnail then needed two clicks).
  const stripList = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const list = stripList.current;
    const button = active ? stripButtons.current[active] : null;
    if (!list || !button) return;
    list.scrollTo?.({ left: button.offsetLeft - (list.clientWidth - button.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  function goTo(id: string) {
    setActive(id);
    sections.current[id]?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-card" />
      <Dialog.Content
        aria-modal="true"
        className={`fixed inset-0 z-50 flex flex-col bg-card outline-none ${SAFE_AREA_PADDING}`}
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          onClose();
        }}
        onCloseAutoFocus={(event) => {
          if (!returnFocusTo?.current) return;
          event.preventDefault();
          returnFocusTo.current.focus(); // the page photo or tile that opened the gallery
        }}
      >
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border px-4 sm:px-6">
          <Dialog.Close aria-label="Close photos" onClick={(event) => { event.preventDefault(); onClose(); }} className="flex size-10 items-center justify-center rounded-full border border-border text-primary transition-colors hover:bg-surface">
            <X className="size-4" aria-hidden />
          </Dialog.Close>
          <Dialog.Title className="truncate text-sm font-semibold text-primary">Photos of {title}</Dialog.Title>
          <Dialog.Description className="sr-only">{flat.length} photos{grouped ? `, in ${groups.length} groups` : ""}. Press Escape to close.</Dialog.Description>
        </header>

        <div ref={setScroller} className="flex-1 overflow-y-auto" style={{ "--strip-h": `${stripH}px` } as CSSProperties}>
          {grouped && groups.length > 1 ? (
            <nav ref={setStrip} aria-label="Photo groups" className="sticky top-0 z-10 border-b border-border bg-card">
              <div className="mx-auto w-full max-w-[1100px] px-4 py-2.5 sm:px-6">
                <ul ref={stripList} className="relative flex gap-3 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4">
                  {groups.map((group) => (
                    <li key={group.id} className="shrink-0">
                      <button
                        ref={(node) => {
                          stripButtons.current[group.id] = node;
                        }}
                        type="button"
                        onClick={() => goTo(group.id)}
                        aria-current={active === group.id}
                        className="group block w-20 text-left sm:w-28"
                      >
                        <span className={cn("relative block aspect-[4/3] overflow-hidden border-2 transition-colors", active === group.id ? "border-primary" : "border-transparent group-hover:border-border")}>
                          <Image src={group.thumbnail.src} alt="" fill sizes="112px" className="object-cover" />
                        </span>
                        <span className={cn("mt-1 block truncate text-xs", active === group.id ? "font-semibold text-primary" : "text-body")}>{group.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          ) : null}

          <div className="mx-auto w-full max-w-[1100px] px-4 pb-16 sm:px-6">
            <div className="divide-y divide-border">
              {groups.map((group, index) => (
                <section
                  key={group.id}
                  id={group.id}
                  ref={attach(group.id)}
                  aria-labelledby={`${group.id}-title`}
                  className="grid scroll-mt-[calc(var(--strip-h,0px)+16px)] gap-4 py-8 md:grid-cols-[minmax(160px,260px)_1fr] md:gap-10"
                >
                  <h2 id={`${group.id}-title`} className="font-display text-title-sm font-medium text-primary md:sticky md:top-[calc(var(--strip-h,0px)+24px)] md:self-start">
                    {group.title}
                  </h2>
                  <PhotoGrid
                    images={group.images}
                    videos={group.videos}
                    offset={offsets[index]}
                    onPlay={(clicked, opener) => {
                      videoOpener.current = opener;
                      setVideo(clicked);
                    }}
                    onOpen={(flatIndex, opener) => {
                      lightboxOpener.current = opener;
                      setLightbox(flatIndex);
                    }}
                  />
                </section>
              ))}
            </div>
          </div>
        </div>

        <Dialog.Root open={video !== null} onOpenChange={(open) => !open && setVideo(null)}>
          {video ? <VideoModal videoUrl={video.url} title={video.title} returnFocusTo={videoOpener} /> : null}
        </Dialog.Root>
        <Dialog.Root open={lightbox !== null} onOpenChange={(open) => !open && setLightbox(null)}>
          {lightbox !== null ? <PhotoLightbox images={flat} title={title} start={lightbox} returnFocusTo={lightboxOpener} /> : null}
        </Dialog.Root>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

/**
 * Full-screen photo gallery of a detail page. At the top a strip with one thumbnail and label per group (it scrolls smoothly
 * to the section); then one section per group: the title on the left (sticky on desktop, above the grid on a phone) and the
 * photos on the right (full width, then two side by side, repeating). Without groups it is one "All photos" section and no
 * strip. A photo opens the lightbox (arrows, keyboard, counter); closing it returns to the same scroll position. The caller
 * owns `open` (see `useHashDialog`: the `#photos` hash). Escape and the close button call `onClose`; Radix gives the scroll lock,
 * the focus trap and the focus return. `startSrc` is the photo that was clicked on the page; `returnFocusTo` is what gets focus when the gallery closes.
 */
export function PhotoGalleryModal({ groups, images, title, open, startSrc, returnFocusTo, onClose }: { groups?: readonly GalleryGroup[]; images: readonly DetailImage[]; title: string; open: boolean; startSrc?: string; returnFocusTo?: RefObject<HTMLElement | null>; onClose: () => void }) {
  const resolved = useMemo(() => resolveGroups(groups, images), [groups, images]);
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      {open && resolved.groups.length > 0 ? <GalleryContent groups={resolved.groups} grouped={resolved.grouped} title={title} startSrc={startSrc} returnFocusTo={returnFocusTo} onClose={onClose} /> : null}
    </Dialog.Root>
  );
}
