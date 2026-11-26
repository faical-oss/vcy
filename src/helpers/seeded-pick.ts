/** FNV-1a (32-bit) hash of a string. Stable across runs and platforms, so it can seed deterministic picks. */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Picks up to `count` distinct items. The result depends only on the set of ids and the seed, never on the input order:
 * candidates are sorted by id, then walked from a start index with a step that is coprime with the list length, both
 * derived from the hash of `seed`. No randomness.
 */
export function seededPick<T>(candidates: readonly T[], seed: string, count: number, getId: (item: T) => string): T[] {
  const sorted = [...candidates].sort((a, b) => {
    const left = getId(a);
    const right = getId(b);
    return left < right ? -1 : left > right ? 1 : 0;
  });
  const length = sorted.length;
  const take = Math.min(count, length);
  if (take <= 0) return [];

  const hash = fnv1a(seed);
  const start = hash % length;
  let step = length === 1 ? 1 : 1 + (Math.floor(hash / length) % (length - 1));
  while (gcd(step, length) !== 1) step = (step % (length - 1)) + 1;

  return Array.from({ length: take }, (_, index) => sorted[(start + index * step) % length]);
}
