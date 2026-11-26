import { searchParamsToQuery } from "@/helpers/search-results";
import type { SearchParams, SearchResponse } from "@/interfaces";

/**
 * The results call, as the browser makes it. Today it talks to our own route (`/api/search`), backed by the mock service;
 * `mock` forwards the dev-only `?mock=` scenario. TODO(api): point this at the real search endpoint (or keep the route as the
 * backend-for-frontend) once the contract is known. No server code and no mock is imported here.
 */
export async function getSearchResults(params: SearchParams, options: { signal?: AbortSignal; mock?: string | null } = {}): Promise<SearchResponse> {
  const query = new URLSearchParams(searchParamsToQuery(params));
  if (options.mock) query.set("mock", options.mock);
  const response = await fetch(`/api/search?${query.toString()}`, { signal: options.signal, headers: { accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error(`search failed: ${response.status}`);
  return (await response.json()) as SearchResponse;
}
