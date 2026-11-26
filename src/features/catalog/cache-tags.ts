import { z } from "zod";
import { slugSchema } from "./schemas";

/**
 * Cache tags of the catalog. `catalog` and `navigation` invalidate everything of that kind; the entity tags
 * (`hotel:<slug>`, `experience:<slug>`, `package:<slug>`, `destination:<slug>`, `category:<slug>`) let one change
 * (a hotel edited in the back office) refresh just the pages that show it.
 */
export const CATALOG_TAG = "catalog";
export const NAVIGATION_TAG = "navigation";
/** Every Lifestyle Vacations page; the entity tag `lifestyle:<slug>` refreshes one. */
export const LIFESTYLE_TAG = "lifestyle";

export type EntityKind = "hotel" | "experience" | "package" | "destination" | "category" | "lifestyle";

/** Next.js drops a tag over 256 characters and an entry over 128 tags; stay well under both. */
export const MAX_TAGS_PER_ENTRY = 100;

export function entityTag(kind: EntityKind, slug: string): string {
  return `${kind}:${slug}`;
}

/** Slug of a card from its href (the last path segment). Empty when the href has none. */
export function slugOfHref(href: string): string {
  return href.split("?")[0].split("/").filter(Boolean).pop() ?? "";
}

/** Entity tags for the cards of one listing, capped so a very large listing cannot exceed the per-entry limit. */
export function cardTags(kind: EntityKind, cards: readonly { href?: string }[]): string[] {
  const tags = new Set<string>();
  for (const card of cards) {
    const slug = slugOfHref(card.href ?? "");
    if (slugSchema.safeParse(slug).success) tags.add(entityTag(kind, slug));
    if (tags.size >= MAX_TAGS_PER_ENTRY) break;
  }
  return [...tags];
}

/** Keeps the whole set of tags of one cache entry (the entity tag first) within `MAX_TAGS_PER_ENTRY`. */
export function capTags(tags: readonly string[]): string[] {
  return tags.slice(0, MAX_TAGS_PER_ENTRY);
}

const entityTagSchema = z.string().regex(/^(hotel|experience|package|destination|category|lifestyle):[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200);

/** Tags the revalidation endpoint accepts: the two broad tags or a well-formed entity tag. Anything else is rejected. */
export const revalidatableTagSchema = z.union([z.literal(CATALOG_TAG), z.literal(NAVIGATION_TAG), z.literal(LIFESTYLE_TAG), entityTagSchema]);
