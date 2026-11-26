"use client";

import { useEffect } from "react";
import { favoritesStore } from "@/store/favorites-store";

/** Tells the favorites store who is signed in. Rendered next to the session so cards elsewhere stay static. */
export function FavoritesSessionSync({ userId }: { userId: string | null }) {
  useEffect(() => {
    favoritesStore.setUser(userId);
  }, [userId]);
  return null;
}
