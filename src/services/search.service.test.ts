import { describe, expect, it, vi } from "vitest";
import type { IApiClient, SearchResponse } from "@/interfaces";
import { SearchService } from "./search.service";

const emptyResponse: SearchResponse = { items: [], total: 0, page: 1, pageSize: 12, facets: { types: [], stars: [], places: [], amenities: [], board: [], duration: [], groupSize: [], difficulty: [] } };

describe("SearchService", () => {
  it("calls /search with the search as query parameters", async () => {
    const get = vi.fn().mockResolvedValue(emptyResponse);
    const api: IApiClient = { get, post: vi.fn() };

    await new SearchService(api).search({ type: "hotel", destination: "bali", guests: { rooms: 1, adults: 2, children: 0, childAges: [] }, filters: {}, sort: "recommended", page: 1, pageSize: 12 });

    expect(get).toHaveBeenCalledWith("/search", { query: expect.objectContaining({ type: "hotel", destination: "bali", adults: "2", pageSize: 12 }) });
  });
});
