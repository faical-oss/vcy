import "server-only";
import type { SearchResultsContent } from "@/interfaces";
import { searchResultsFixture } from "@/mocks/fixtures/search-results";

/** Copy and filter groups of the results page. Static front-end copy: it never depends on the visitor or the API. */
export async function getSearchResultsContent(): Promise<SearchResultsContent> {
  return searchResultsFixture;
}
