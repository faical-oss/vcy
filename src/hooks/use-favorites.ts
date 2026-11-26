"use client";

import { useSyncExternalStore } from "react";
import type { FavoriteRef } from "@/interfaces";
import { favoritesStore } from "@/store/favorites-store";

/** Shared favorites state. The server snapshot is empty, so server HTML and first client render always match. */
export function useFavorites() {
  const { userId, ready, refs } = useSyncExternalStore(favoritesStore.subscribe, favoritesStore.getSnapshot, favoritesStore.getServerSnapshot);
  return {
    signedIn: userId !== null,
    ready,
    refs,
    has: (ref: FavoriteRef) => refs.some((entry) => entry.kind === ref.kind && entry.id === ref.id),
    toggle: favoritesStore.toggle,
  };
}
