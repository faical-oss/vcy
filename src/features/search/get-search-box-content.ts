import "server-only";
import type { SearchBoxContent } from "@/interfaces";
import { searchBoxFixture } from "@/mocks/fixtures/search";

/**
 * The lists and labels of the search box (tabs, types, destinations, popular chips). Static: it never depends on the visitor.
 * TODO(api): types and destinations come from the catalog; the return type stays the same.
 */
export async function getSearchBoxContent(): Promise<SearchBoxContent> {
  return searchBoxFixture;
}
