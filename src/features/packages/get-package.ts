import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { packageDetail } from "@/constants/routes";
import { STATIC_PARAMS_LIMIT } from "@/constants/site";
import { entityTag } from "@/features/catalog/cache-tags";
import { slugSchema } from "@/features/catalog/schemas";
import type { PackageCardData, PackageDetail } from "@/interfaces";
import { buildPackageDetail, packageCardOf } from "@/mocks/fixtures/catalog/package-detail-builder";
import { packageSourceById, packageSources } from "@/mocks/fixtures/catalog/package-sources";
import { fnv1a } from "@/helpers/seeded-pick";

/**
 * One package for `/packages/p/<slug>`, or null when the slug is malformed or unknown (the page then calls `notFound()` before
 * anything streams). Static content only: no price or availability (those are fetched in the browser once dates are chosen).
 * Cached with the tag `package:<slug>`. TODO(api): Trip Fusion, with the package's own detail content.
 */
export async function getPackage(slug: string): Promise<PackageDetail | null> {
  "use cache";
  cacheLife("hours");
  const parsed = slugSchema.safeParse(slug);
  const source = parsed.success ? packageSourceById.get(parsed.data) : undefined;
  if (!source) return null;
  cacheTag(entityTag("package", source.id));
  return buildPackageDetail(source);
}

/** "You might also like": three other packages, those with the same label first, then a stable pick (never the package itself). No price: prices appear once dates are chosen. */
export async function getSimilarPackages(slug: string, limit = 3): Promise<PackageCardData[]> {
  "use cache";
  cacheLife("hours");
  const current = slugSchema.safeParse(slug).success ? packageSourceById.get(slug) : undefined;
  if (!current) return [];
  cacheTag(entityTag("package", current.id));
  const others = packageSources.filter((source) => source.id !== current.id);
  const ranked = [...others.filter((source) => source.category === current.category), ...others.filter((source) => source.category !== current.category).sort((a, b) => fnv1a(`${current.id}:${a.id}`) - fnv1a(`${current.id}:${b.id}`))];
  return ranked.slice(0, limit).flatMap((source) => packageCardOf(source.id, { withPrice: false }) ?? []);
}

/** Package slugs for `generateStaticParams` (the same limit as the other detail pages) and the sitemap. */
export function getPackageSlugs(): string[] {
  return packageSources.slice(0, STATIC_PARAMS_LIMIT).map((source) => source.id);
}

export function getPackageSitemapPaths(): string[] {
  return getPackageSlugs().map(packageDetail);
}
