import { describe, expect, it } from "vitest";
import { MAX_TAGS_PER_ENTRY, capTags, cardTags, entityTag, revalidatableTagSchema, slugOfHref } from "./cache-tags";

describe("cache tags", () => {
  it("builds entity tags and reads the slug of a card href", () => {
    expect(entityTag("hotel", "amanpuri")).toBe("hotel:amanpuri");
    expect(slugOfHref("/hotels/wellness-resorts/amanpuri")).toBe("amanpuri");
    expect(slugOfHref("/destinations/bali-indonesia?category=x")).toBe("bali-indonesia");
    expect(slugOfHref("/")).toBe("");
  });

  it("tags the cards of a listing, skipping malformed slugs and duplicates", () => {
    const cards = [{ href: "/hotels/a/one" }, { href: "/hotels/a/one" }, { href: "/hotels/a/Two_Bad" }, { href: "/hotels" }];
    expect(cardTags("hotel", cards)).toEqual(["hotel:one", "hotel:hotels"]);
  });

  it("never exceeds the per-entry tag limit", () => {
    const cards = Array.from({ length: 500 }, (_, index) => ({ href: `/hotels/a/h-${index}` }));
    expect(cardTags("hotel", cards)).toHaveLength(MAX_TAGS_PER_ENTRY);
    expect(capTags(Array.from({ length: 300 }, (_, index) => `t${index}`))).toHaveLength(MAX_TAGS_PER_ENTRY);
  });

  it("accepts only the broad tags and well-formed entity tags for revalidation", () => {
    for (const ok of ["catalog", "navigation", "hotel:amanpuri", "destination:bali-indonesia", "category:yoga-retreats", "package:x1", "experience:abc", "lifestyle", "lifestyle:golf"]) {
      expect(revalidatableTagSchema.safeParse(ok).success, ok).toBe(true);
    }
    for (const bad of ["", "hotel:", "hotel:Bad Slug", "unknown:x", "hotel:a:b", "../etc", "catalog ", "hotel:" + "a".repeat(300)]) {
      expect(revalidatableTagSchema.safeParse(bad).success, bad).toBe(false);
    }
  });
});
