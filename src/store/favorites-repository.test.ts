import { describe, expect, it } from "vitest";
import { createLocalFavoritesRepository, favoritesStorageKey, parseStoredRefs } from "./favorites-repository";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value), data };
}

describe("favorites repository", () => {
  it("adds, lists, checks and removes ids, per user and versioned", () => {
    const storage = memoryStorage();
    const repo = createLocalFavoritesRepository("dev-1", storage);
    repo.add({ kind: "hotel", id: "h1" });
    repo.add({ kind: "hotel", id: "h1" });
    repo.add({ kind: "experience", id: "e1" });
    expect(repo.list()).toEqual([{ kind: "hotel", id: "h1" }, { kind: "experience", id: "e1" }]);
    expect(repo.has({ kind: "hotel", id: "h1" })).toBe(true);
    expect(repo.has({ kind: "package", id: "h1" })).toBe(false);
    repo.remove({ kind: "hotel", id: "h1" });
    expect(repo.list()).toEqual([{ kind: "experience", id: "e1" }]);
    expect(storage.data.has(favoritesStorageKey("dev-1"))).toBe(true);
    expect(createLocalFavoritesRepository("dev-2", storage).list()).toEqual([]);
    expect(favoritesStorageKey("dev-1")).toContain(":v1:");
  });

  it("drops malformed stored data", () => {
    expect(parseStoredRefs("not json")).toEqual([]);
    expect(parseStoredRefs('{"a":1}')).toEqual([]);
    expect(parseStoredRefs('[{"kind":"spaceship","id":"x"},{"kind":"hotel","id":3},{"kind":"hotel","id":"ok"}]')).toEqual([{ kind: "hotel", id: "ok" }]);
  });

  it("survives storage that throws", () => {
    const broken = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("full"); } };
    const repo = createLocalFavoritesRepository("u", broken);
    expect(() => repo.add({ kind: "hotel", id: "h" })).not.toThrow();
    expect(repo.list()).toEqual([]);
  });
});
