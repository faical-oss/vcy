import type { MetadataRoute } from "next";
import { ROUTES, absoluteUrl } from "@/constants/routes";
import { getCatalogSitemapPaths } from "@/features/catalog/get-catalog";
import { getPackageSitemapPaths } from "@/features/packages/get-package";
import { getLifestyleSitemapPaths } from "@/features/lifestyle/get-lifestyle-page";
import { getSiteUrl, isIndexingEnabled } from "@/lib/env";

/** Only the built, indexable pages. Empty unless INDEXING_ENABLED=true (which cannot be combined with mock data). */
const STATIC_PATHS = [ROUTES.home, ROUTES.destinations, ROUTES.support, ROUTES.privacy, ROUTES.terms];

// TODO: split into a sitemap index (generateSitemaps, under 50,000 URLs each) once detail pages exist.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexingEnabled()) return [];
  const siteUrl = getSiteUrl();
  const paths = [...new Set([...STATIC_PATHS, ...getLifestyleSitemapPaths(), ...getPackageSitemapPaths(), ...(await getCatalogSitemapPaths())])];
  return paths.map((path) => ({ url: absoluteUrl(path, siteUrl), ...(path === ROUTES.home ? { changeFrequency: "daily" as const, priority: 1 } : {}) }));
}
