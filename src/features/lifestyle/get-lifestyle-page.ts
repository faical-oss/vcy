import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { LIFESTYLE_SLUGS, lifestyleVacation, packageDetail, type LifestyleSlug } from "@/constants/routes";
import { LIFESTYLE_TAG, entityTag } from "@/features/catalog/cache-tags";
import type { LifestylePageContent } from "@/interfaces";
import { lifestylePages, packageById } from "@/mocks/fixtures/lifestyle";

const isLifestyleSlug = (slug: string): slug is LifestyleSlug => (LIFESTYLE_SLUGS as readonly string[]).includes(slug);

/**
 * One Lifestyle Vacations page with its packages resolved from the shared package table; null for an unknown slug (the
 * page then calls `notFound()` before anything streams). Cached with the tags `lifestyle` and `lifestyle:<slug>`.
 * TODO(cms): read the page from the CMS and the packages from Trip Fusion; the return type stays the same.
 */
export async function getLifestylePage(slug: string): Promise<LifestylePageContent | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(LIFESTYLE_TAG);

  if (!isLifestyleSlug(slug)) return null;
  cacheTag(entityTag("lifestyle", slug));
  const { packageRefs, ...page } = lifestylePages[slug];
  const items = packageRefs.map((ref) => {
    const record = packageById.get(ref.id);
    if (!record) throw new Error(`Lifestyle page "${slug}" uses the unknown package "${ref.id}"`);
    return { card: { ...record, href: packageDetail(record.id), badge: ref.badge, category: ref.category, highlights: ref.highlights, images: ref.images ?? record.images }, filters: ref.filters };
  });
  return { ...page, packages: { ...page.packages, items } };
}

/** The slugs to prerender and to list in the sitemap. */
export function getLifestyleSlugs(): readonly LifestyleSlug[] {
  return LIFESTYLE_SLUGS;
}

/** Sitemap paths of the Lifestyle pages. */
export function getLifestyleSitemapPaths(): string[] {
  return LIFESTYLE_SLUGS.map(lifestyleVacation);
}
