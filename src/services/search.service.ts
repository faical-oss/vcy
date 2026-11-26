import "server-only";
import { searchParamsToQuery } from "@/helpers/search-results";
import type { IApiClient, ISearchService, SearchParams, SearchResponse } from "@/interfaces";

export class SearchService implements ISearchService {
  private readonly api: IApiClient;

  constructor(api: IApiClient) {
    this.api = api;
  }

  /** TODO(api): the parameter names are ours (the results URL contract) until the Trip Fusion search docs arrive. */
  search(params: SearchParams): Promise<SearchResponse> {
    return this.api.get<SearchResponse>("/search", { query: { ...Object.fromEntries(new URLSearchParams(searchParamsToQuery(params))), pageSize: params.pageSize } });
  }
}
