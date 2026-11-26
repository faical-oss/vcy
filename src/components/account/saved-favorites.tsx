"use client";

import { useEffect, useState } from "react";
import { useFavorites } from "@/hooks/use-favorites";
import type { Favorite, FavoriteRef, ResolveFavoritesResult } from "@/interfaces";
import { FavoritesSection } from "./favorites-section";

interface SavedFavoritesProps {
  /** Server action: saved ids in, public card data out. */
  resolve: (refs: FavoriteRef[]) => Promise<ResolveFavoritesResult>;
}

/** Favorites page body: reads the saved ids from the shared store and asks the server for the matching cards. */
export function SavedFavorites({ resolve }: SavedFavoritesProps) {
  const { ready, refs, has } = useFavorites();
  const [resolved, setResolved] = useState<Favorite[] | null>(null);
  const [failed, setFailed] = useState(false);
  const key = refs.map((ref) => `${ref.kind}:${ref.id}`).join("|");

  useEffect(() => {
    if (!ready) return;
    if (refs.length === 0) return;
    let cancelled = false;
    resolve([...refs]).then(
      (result) => {
        if (cancelled) return;
        setFailed(!result.ok);
        if (result.ok) setResolved(result.favorites);
      },
      () => !cancelled && setFailed(true),
    );
    return () => {
      cancelled = true;
    };
    // `key` stands for the contents of `refs`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key, resolve]);

  if (failed) {
    return (
      <p role="alert" className="mt-5 text-sm text-error">
        We couldn&apos;t load your favorites. Please refresh the page.
      </p>
    );
  }
  // Until storage has been read, show nothing rather than a false "empty" state.
  if (!ready || (refs.length > 0 && resolved === null)) return <div aria-hidden className="mt-5 h-40 rounded-card bg-surface sm:mt-6" />;
  return <FavoritesSection favorites={(resolved ?? []).filter((favorite) => has({ kind: favorite.kind, id: favorite.id }))} />;
}
