"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { RefObject } from "react";

/**
 * The "Watch video" player in a dark dialog: a native video with its own controls (play, scrubber, time, full screen),
 * Close at the top right, Escape closes it. Rendered inside a `Dialog.Root` owned by the caller. TODO(api): the video comes
 * from the API (`videoUrl`); captions and a poster image are not known yet.
 */
export function VideoModal({ videoUrl, title, returnFocusTo }: { videoUrl: string; title: string; /** What gets focus when it closes, when the caller has no Dialog.Trigger. */ returnFocusTo?: RefObject<HTMLElement | null> }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85" />
      <Dialog.Content
        onCloseAutoFocus={(event) => {
          if (!returnFocusTo?.current) return;
          event.preventDefault();
          returnFocusTo.current.focus();
        }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] outline-none"
      >
        <Dialog.Title className="sr-only">Video: {title}</Dialog.Title>
        <Dialog.Description className="sr-only">A video about {title}. Use the player controls to play, pause or go full screen.</Dialog.Description>
        <Dialog.Close className="flex items-center gap-1.5 self-end px-2 py-1 text-sm text-white hover:bg-white/10 md:mr-[max(0px,calc((100vw-900px)/2))]">
          <X className="size-4" aria-hidden /> Close
        </Dialog.Close>
        <video src={videoUrl} controls autoPlay playsInline preload="metadata" className="aspect-video max-h-[75dvh] w-full max-w-[900px] bg-black">
          Your browser cannot play this video.
        </video>
        <p className="text-micro uppercase tracking-widest text-white/80">Video: {title}</p>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
