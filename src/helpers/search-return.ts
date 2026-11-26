/*
 * "Back to search results": when a visitor opens a detail page from a result card, the results URL (filters, page) is kept in
 * sessionStorage together with the detail path it was opened for. The detail page offers the way back only while its own path is
 * that one, so a later visit to the same page from somewhere else (or a "You might also like" card) gets the ordinary Back.
 */
const KEY = "vku:search-return";

/** Called when a link inside the results is followed: `href` is the detail page it goes to. */
export function rememberSearchReturn(href: string): void {
  try {
    const detail = new URL(href, window.location.origin).pathname;
    sessionStorage.setItem(KEY, JSON.stringify({ results: window.location.pathname + window.location.search, detail }));
  } catch {
    // Storage blocked (private window): the detail page keeps its ordinary Back.
  }
}

/** The results URL to go back to, or null when this page was not opened from the search results. */
export function readSearchReturn(): string | null {
  try {
    const stored = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as { results?: unknown; detail?: unknown } | null;
    if (stored && typeof stored.results === "string" && stored.results.startsWith("/search") && stored.detail === window.location.pathname) return stored.results;
  } catch {
    // Nothing stored, or storage blocked.
  }
  return null;
}
