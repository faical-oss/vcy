"use client";

import { Heart } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/helpers/cn";
import { useFavorites } from "@/hooks/use-favorites";
import type { FavoriteRef } from "@/interfaces";

/** Heart toggle for cards, backed by the shared favorites store. Signed-out visitors get the login dialog (as on the original site). */
export function FavoriteButton({ item, name, className }: { item: FavoriteRef; name: string; className?: string }) {
  const { openAuth } = useAuth();
  const { signedIn, has, toggle } = useFavorites();
  const active = signedIn && has(item);
  return (
    <button
      type="button"
      aria-label={`${active ? "Remove" : "Add"} ${name} ${active ? "from" : "to"} favorites`}
      aria-pressed={active}
      onClick={(event) => (signedIn ? toggle(item) : openAuth("login", event.currentTarget))}
      className={cn("absolute z-20 flex items-center justify-center border border-border bg-card transition-colors hover:bg-surface", className)}
    >
      <Heart className={cn("size-3.5", active ? "fill-accent text-accent" : "text-body")} aria-hidden />
    </button>
  );
}
