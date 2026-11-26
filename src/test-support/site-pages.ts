import { readdirSync } from "node:fs";
import path from "node:path";

/** Test helpers: the public pages of the app, read from the file system (src/app/(site)). Used by the SEO contract tests only. */
export const SITE_DIR = path.resolve(import.meta.dirname, "../app/(site)");
const REPO_ROOT = path.resolve(import.meta.dirname, "../..");

/**
 * Routes allowed to skip pageSeo() and to be left out of the sitemap. Adding a route here is a visible decision: say why.
 * Every entry must be noindex (checked in page-seo-contract.test.ts) and the list must stay small.
 *  - /account: signed-in member pages, noindex,nofollow set once in account/layout.tsx.
 *  - /checkout: booking flow, noindex (not built yet).
 *  - /search: result pages, noindex (it still uses pageSeo(): canonical to /search, noindex,follow).
 */
export const NOINDEX_ALLOWLIST: readonly string[] = ["/account", "/checkout", "/search"];

export const isAllowlisted = (route: string) => NOINDEX_ALLOWLIST.some((entry) => route === entry || route.startsWith(`${entry}/`));

function findPages(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return findPages(full);
    return entry.name === "page.tsx" ? [full] : [];
  });
}

/** `(site)/hotels/[category]/page.tsx` -> `/hotels/[category]`; `(site)/page.tsx` -> `/`. */
function routeOf(file: string): string {
  const segments = path.relative(SITE_DIR, path.dirname(file)).split(path.sep).filter((segment) => segment && !/^\(.*\)$/.test(segment));
  return `/${segments.join("/")}`;
}

export interface SitePage {
  file: string;
  route: string;
  /** Path relative to the repo root, for messages. */
  relative: string;
}

export function sitePages(): SitePage[] {
  return findPages(SITE_DIR).map((file) => ({ file, route: routeOf(file), relative: path.relative(REPO_ROOT, file) }));
}
