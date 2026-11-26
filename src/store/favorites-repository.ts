import type { FavoriteRef } from "@/interfaces";

/** Persistence for one member's saved items. Swap the implementation for the API later; callers only see this. */
export interface FavoritesRepository {
  add(ref: FavoriteRef): void;
  remove(ref: FavoriteRef): void;
  list(): FavoriteRef[];
  has(ref: FavoriteRef): boolean;
}

/** Bump the version when the stored shape changes. */
export const FAVORITES_STORAGE_VERSION = 1;

export const favoritesStorageKey = (userId: string) => `vku:favorites:v${FAVORITES_STORAGE_VERSION}:${userId}`;

const KINDS = new Set<FavoriteRef["kind"]>(["experience", "package", "hotel"]);

export const sameRef = (a: FavoriteRef, b: FavoriteRef) => a.kind === b.kind && a.id === b.id;

/** Parses stored JSON defensively: anything malformed is dropped, never thrown. */
export function parseStoredRefs(raw: string | null): FavoriteRef[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const refs: FavoriteRef[] = [];
    for (const entry of data) {
      if (entry && typeof entry === "object" && "kind" in entry && "id" in entry) {
        const { kind, id } = entry as { kind: unknown; id: unknown };
        if (typeof id === "string" && KINDS.has(kind as FavoriteRef["kind"]) && !refs.some((ref) => sameRef(ref, { kind: kind as FavoriteRef["kind"], id }))) {
          refs.push({ kind: kind as FavoriteRef["kind"], id });
        }
      }
    }
    return refs;
  } catch {
    return [];
  }
}

/** IDs only, one key per member. Storage can be unavailable or full (private mode): failures are swallowed. */
export function createLocalFavoritesRepository(userId: string, storage: Pick<Storage, "getItem" | "setItem">): FavoritesRepository {
  const key = favoritesStorageKey(userId);
  const read = () => {
    try {
      return parseStoredRefs(storage.getItem(key));
    } catch {
      return [];
    }
  };
  const write = (refs: FavoriteRef[]) => {
    try {
      storage.setItem(key, JSON.stringify(refs));
    } catch {
      /* storage unavailable or full: the toggle simply does not persist */
    }
  };
  return {
    list: read,
    has: (ref) => read().some((entry) => sameRef(entry, ref)),
    add(ref) {
      const refs = read();
      if (!refs.some((entry) => sameRef(entry, ref))) write([...refs, ref]);
    },
    remove(ref) {
      write(read().filter((entry) => !sameRef(entry, ref)));
    },
  };
}
