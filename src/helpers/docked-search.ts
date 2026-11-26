import { ROUTES } from "@/constants/routes";

/** "top": docked from the first pixel (results pages and detail pages). "scroll": slides in after `DOCKED_SEARCH_SCROLL_PX`. false: never. */
export type DockedSearchMode = "top" | "scroll" | false;

/** How far a page scrolls before the docked bar appears: past the hero's own search box. */
export const DOCKED_SEARCH_SCROLL_PX = 320;

/**
 * Pages WITHOUT the docked bar. A deny-list on purpose: a new page shows the bar unless it is added here.
 * Prefixes match the path itself and everything below it.
 */
const EXCLUDED_PREFIXES = [
  ROUTES.account, // the whole account area
  ROUTES.support,
  ROUTES.privacy,
  ROUTES.terms,
  ROUTES.about,
  ROUTES.checkout,
];

/**
 * Pages whose bar is there from the first pixel (the page reserves its 4rem from `md`). Results pages; and the detail pages, which
 * have no hero search of their own: their sticky tabs and booking box sit under the bar (`--docked-search-h`).
 */
const TOP_PREFIXES = [ROUTES.search, `${ROUTES.hotels}/h`, `${ROUTES.experiences}/e`, `${ROUTES.packages}/p`];

const under = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

/**
 * Where the docked search bar shows. Only the pathname is read: an unknown slug (a 404) follows the same rule as any other path,
 * and the error pages inside a section follow their section.
 */
export function showsDockedSearch(pathname: string): DockedSearchMode {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (EXCLUDED_PREFIXES.some((prefix) => under(path, prefix))) return false;
  return TOP_PREFIXES.some((prefix) => under(path, prefix)) ? "top" : "scroll";
}
