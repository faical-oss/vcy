"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Play } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/helpers/cn";
import { useHashDialog } from "@/hooks/use-hash-dialog";
import type { DetailImage, GalleryGroup } from "@/interfaces";
import { PhotoGalleryModal, resolveGroups } from "./photo-gallery-modal";
import { VideoModal } from "./video-modal";

/**
 * Photos in the server HTML. From `md`: one large photo (61% of the width) and three tiles in a 355px-high grid, a wide tile on top and
 * two small ones below. Below `md`: one hero photo (16:10, the full width) and under it one row of thumbnails (4:3, the same 8px gap):
 * three for four photos or more, two for three, one (full width) for two, none for one photo; no empty tile. The last thumbnail of
 * four photos or more carries "View all N photos" on a dark scrim (white on it is above 4.5:1 even over a white photo). The first photo
 * is the page's LCP image (`loading="eager"` and `fetchPriority="high"`; `priority` is deprecated in Next 16); the rest load lazily, and
 * every box has its ratio, so nothing shifts. Clicking any photo, or the last tile, opens the full-screen photo gallery
 * (`PhotoGalleryModal`, in the `#photos` hash so the back button closes it), scrolled to the photo that was clicked. The second photo
 * has the dark tint of the design from `md`, with a "Watch video" chip only when a video URL exists; on a phone the video is a link under
 * the photos. It opens the video in its own modal. (Token gap: 355px, 186px and the 61/38 split.)
 */
export function DetailGallery({ images, groups, videoUrl, title }: { images: DetailImage[]; groups?: GalleryGroup[]; videoUrl?: string; title: string }) {
  const photos = useHashDialog("photos");
  const [startSrc, setStartSrc] = useState<string | undefined>();
  const [videoOpen, setVideoOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  if (images.length === 0) return null;
  const [lead, ...rest] = images;
  const tiles = rest.slice(0, 3);
  const total = resolveGroups(groups, images).groups.reduce((sum, group) => sum + group.images.length, 0);
  const hidden = total - 4;
  const chip = "flex items-center gap-2 bg-primary/90 px-3 py-1.5 text-xs font-medium text-white";
  const openAt = (src: string | undefined, from: HTMLElement) => {
    opener.current = from;
    setStartSrc(src);
    photos.show();
  };

  // The thumbnails' columns below md: one each, none empty. The photo's width in `sizes` follows.
  const columns = tiles.length >= 3 ? "grid-cols-3" : tiles.length === 2 ? "grid-cols-2" : "grid-cols-1";
  const thumbSizes = tiles.length >= 3 ? "34vw" : tiles.length === 2 ? "50vw" : "100vw";
  return (
    <>
      <div className={cn("grid gap-2 md:h-[355px] md:grid-cols-[61fr_38fr] md:grid-rows-[186px_1fr] lg:grid-cols-[534px_1fr]", columns)}>
        <div className="relative col-span-full aspect-[16/10] overflow-hidden md:col-span-1 md:row-span-2 md:aspect-auto">
          <Image src={lead.src} alt={lead.alt} fill loading="eager" fetchPriority="high" sizes="(min-width: 1024px) 534px, 100vw" className="object-cover" />
          <button type="button" onClick={(event) => openAt(lead.src, event.currentTarget)} aria-label={`Open all photos, starting with: ${lead.alt}`} className="absolute inset-0" />
        </div>
        {tiles.length > 0 ? (
          <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto">
            <Image src={tiles[0].src} alt={tiles[0].alt} fill sizes={`(min-width: 768px) 330px, ${thumbSizes}`} className="object-cover" />
            <div aria-hidden className="absolute inset-0 bg-primary/40 max-md:hidden" />
            <button type="button" onClick={(event) => openAt(tiles[0].src, event.currentTarget)} aria-label={`Open all photos, starting with: ${tiles[0].alt}`} className="absolute inset-0" />
            {videoUrl ? (
              <div className="pointer-events-none absolute inset-0 items-center justify-center max-md:hidden md:flex">
                <button type="button" onClick={() => setVideoOpen(true)} className={`${chip} pointer-events-auto`}>
                  <Play className="size-3 fill-white" aria-hidden /> Watch video
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="contents md:grid md:grid-cols-2 md:gap-2">
          {tiles.slice(1).map((tile, index) => (
            <div key={tile.src} className="relative aspect-[4/3] overflow-hidden md:aspect-auto">
              <Image src={tile.src} alt={tile.alt} fill sizes={`(min-width: 768px) 161px, ${thumbSizes}`} className="object-cover" />
              {index === 1 && total >= 4 ? (
                <button type="button" onClick={(event) => openAt(undefined, event.currentTarget)} className={cn("absolute inset-0 flex items-center justify-center bg-primary/75 px-2 text-center text-xs font-semibold text-white transition-colors hover:bg-primary/85 motion-reduce:transition-none md:font-medium", hidden > 0 ? "md:bg-primary/55 md:hover:bg-primary/65" : "md:bg-transparent md:hover:bg-transparent")}>
                  <span className="md:hidden">View all {total} photos</span>
                  {hidden > 0 ? <span className="hidden md:inline">+{hidden} more</span> : null}
                  <span className="sr-only"> photos of {title}</span>
                </button>
              ) : (
                <button type="button" onClick={(event) => openAt(tile.src, event.currentTarget)} aria-label={`Open all photos, starting with: ${tile.alt}`} className="absolute inset-0" />
              )}
            </div>
          ))}
        </div>
        {videoUrl ? (
          <div className="col-span-full md:hidden">
            <button type="button" onClick={() => setVideoOpen(true)} className="text-sm font-medium text-primary underline">
              Watch video
            </button>
          </div>
        ) : null}
      </div>

      <PhotoGalleryModal groups={groups} images={images} title={title} open={photos.open} startSrc={startSrc} returnFocusTo={opener} onClose={photos.hide} />
      {videoUrl ? (
        <Dialog.Root open={videoOpen} onOpenChange={setVideoOpen}>
          {videoOpen ? <VideoModal videoUrl={videoUrl} title={title} /> : null}
        </Dialog.Root>
      ) : null}
    </>
  );
}
