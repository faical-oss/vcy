import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { NavMenu } from "@/interfaces";
import { CatalogNotConfiguredError } from "@/lib/catalog-errors";
import { getNavigationService } from "@/services";

/**
 * Header menus, identical for every visitor, so they are cached (never reads cookies or headers) and the header does
 * not make routes dynamic. The "days" profile refreshes at most once a day in the background (expire: one week);
 * `revalidateTag("navigation")` from a server action or route handler invalidates it on demand.
 */
async function readNavigation(): Promise<NavMenu[]> {
  "use cache";
  cacheLife("days");
  cacheTag("navigation");

  const service = await getNavigationService();
  return service.getNavigation();
}

/**
 * Header menus, or an empty list when no navigation service is configured (mocks off, no Trip Fusion client yet), so the
 * header shows logo and account button only and the rest of the site still builds (same rule as `getCurrentSession`).
 * Configuration is checked outside the cached scope: an error thrown inside `"use cache"` crosses the cache boundary and
 * loses its class, and nothing for a not-configured service must ever be cached. Any other error propagates.
 */
export async function getNavigation(): Promise<NavMenu[]> {
  try {
    await getNavigationService();
  } catch (error) {
    if (error instanceof CatalogNotConfiguredError) return [];
    throw error;
  }
  return readNavigation();
}
