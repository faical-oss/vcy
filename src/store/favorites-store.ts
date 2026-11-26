import type { FavoriteRef } from "@/interfaces";
import { createLocalFavoritesRepository, favoritesStorageKey, sameRef, type FavoritesRepository } from "./favorites-repository";

export interface FavoritesSnapshot {
  /** Signed-in member whose list this is; null when signed out or before the session is known. */
  userId: string | null;
  /** False until the browser's storage has been read (always false on the server). */
  ready: boolean;
  refs: readonly FavoriteRef[];
}

const SERVER_SNAPSHOT: FavoritesSnapshot = { userId: null, ready: false, refs: [] };

let snapshot: FavoritesSnapshot = SERVER_SNAPSHOT;
let repository: FavoritesRepository | null = null;
const listeners = new Set<() => void>();

function publish(next: FavoritesSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

/** Reads the repository again; keeps the same snapshot object when nothing changed so React does not re-render. */
function refresh() {
  if (!repository || !snapshot.userId) return;
  const refs = repository.list();
  const same = refs.length === snapshot.refs.length && refs.every((ref, i) => sameRef(ref, snapshot.refs[i]));
  if (!same || !snapshot.ready) publish({ ...snapshot, ready: true, refs });
}

/** Another tab changed this member's list (the storage event never fires in the tab that wrote). */
function onStorage(event: StorageEvent) {
  if (snapshot.userId && (event.key === null || event.key === favoritesStorageKey(snapshot.userId))) refresh();
}

export const favoritesStore = {
  subscribe(listener: () => void) {
    if (listeners.size === 0 && typeof window !== "undefined") window.addEventListener("storage", onStorage);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && typeof window !== "undefined") window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot: () => snapshot,
  getServerSnapshot: () => SERVER_SNAPSHOT,

  /** Called once the session is known (and again on sign-in or sign-out). Signed out means no list. */
  setUser(userId: string | null) {
    if (userId === snapshot.userId && snapshot.ready) return;
    if (!userId) {
      repository = null;
      publish({ userId: null, ready: true, refs: [] });
      return;
    }
    repository = createLocalFavoritesRepository(userId, window.localStorage);
    publish({ userId, ready: false, refs: [] });
    refresh();
  },

  toggle(ref: FavoriteRef) {
    if (!repository) return;
    if (repository.has(ref)) repository.remove(ref);
    else repository.add(ref);
    refresh();
  },
};
