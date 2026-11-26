"use client";

import { ArrowLeft, Heart, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type MouseEvent } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/helpers/cn";
import { readSearchReturn } from "@/helpers/search-return";
import { useFavorites } from "@/hooks/use-favorites";
import type { FavoriteRef } from "@/interfaces";

const subscribeNever = () => () => {};
const ACTION = "inline-flex h-9 items-center justify-center gap-2 border border-border bg-card px-4 text-sm text-primary transition-colors hover:bg-surface";

/**
 * Right-hand action stack: "Back" on top (goes back in the browser history when the visitor came from another page on this site, else to
 * `fallbackHref`, the matching listing page), then Favorite and Share in a second row (the device share sheet, or copies the link).
 */
export function DetailActions({ fallbackHref, backLabel, favorite, name }: { fallbackHref: string; backLabel: string; favorite: FavoriteRef; name: string }) {
  const router = useRouter();
  const { openAuth } = useAuth();
  const { signedIn, has, toggle } = useFavorites();
  const saved = signedIn && has(favorite);
  const [shareNote, setShareNote] = useState("");
  // Read after hydration (sessionStorage; null on the server): the visitor came from the search results, so Back says so and returns to them.
  const searchBack = useSyncExternalStore(subscribeNever, readSearchReturn, () => null);

  function goBack(event: MouseEvent<HTMLAnchorElement>) {
    if (searchBack) {
      event.preventDefault();
      if (window.history.length > 1) router.back();
      else router.push(searchBack);
      return;
    }
    const fromThisSite = window.history.length > 1 && document.referrer !== "" && new URL(document.referrer).origin === window.location.origin;
    if (!fromThisSite) return; // the link's own href is the fallback
    event.preventDefault();
    router.back();
  }

  async function share() {
    const url = window.location.origin + window.location.pathname;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareNote("Link copied");
      }
    } catch {
      // The visitor closed the share sheet, or the browser blocked clipboard access: nothing to report.
    }
  }

  return (
    // One two-column grid: Back spans both columns, Favorite and Share take one each, so the three buttons share one overall
    // width (the width of the widest, Back) at every breakpoint; full width below `sm`, where the header stacks.
    <div className="grid w-full grid-cols-2 gap-x-2 gap-y-3 sm:w-auto sm:justify-self-end">
      <a href={searchBack ?? fallbackHref} onClick={goBack} className={cn(ACTION, "col-span-2 border-primary")}>
        <ArrowLeft className="size-3.5" aria-hidden /> {searchBack ? "Back to search results" : backLabel}
      </a>
      <button type="button" aria-pressed={saved} onClick={(event) => (signedIn ? toggle(favorite) : openAuth("login", event.currentTarget))} className={ACTION}>
        <Heart className={cn("size-3.5", saved ? "fill-accent text-accent" : "text-body")} aria-hidden /> Favorite
      </button>
      <button type="button" onClick={share} className={ACTION}>
        <Share2 className="size-3.5 text-body" aria-hidden /> Share
      </button>
      <span role="status" className="sr-only">
        {shareNote}
      </span>
    </div>
  );
}
