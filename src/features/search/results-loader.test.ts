import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FETCH_DEBOUNCE_MS } from "@/helpers/fetch-timing";
import type { SearchParams, SearchResponse } from "@/interfaces";
import { createResultsLoader } from "./results-loader";

const params = (page = 1): SearchParams => ({ type: "hotel", guests: { rooms: 1, adults: 2, children: 0, childAges: [] }, filters: {}, sort: "recommended", page, pageSize: 12 });
const answer = (page: number): SearchResponse => ({ items: [], total: page, page, pageSize: 12, facets: { types: [], stars: [], places: [], amenities: [], board: [], duration: [], groupSize: [], difficulty: [] } });

describe("createResultsLoader", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("does not call without a search", () => {
    const fetcher = vi.fn();
    const loader = createResultsLoader(fetcher);
    loader.request(null);
    vi.advanceTimersByTime(5000);
    expect(fetcher).not.toHaveBeenCalled();
    expect(loader.getSnapshot().status).toBe("idle");
  });

  it("sends the first search at once, then waits the shared debounce and makes one call for quick edits", async () => {
    const fetcher = vi.fn(async (p: SearchParams) => answer(p.page));
    const loader = createResultsLoader(fetcher);
    loader.request(params(1));
    expect(fetcher).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(0);
    vi.advanceTimersByTime(FETCH_DEBOUNCE_MS - 1);
    loader.request(params(2));
    vi.advanceTimersByTime(FETCH_DEBOUNCE_MS - 1);
    loader.request(params(3));
    expect(fetcher).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(FETCH_DEBOUNCE_MS);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(loader.getSnapshot()).toMatchObject({ status: "ready", data: { page: 3 } });
  });

  it("ignores a stale answer and aborts the old request", async () => {
    const resolvers: ((value: SearchResponse) => void)[] = [];
    const signals: AbortSignal[] = [];
    const fetcher = vi.fn((_p: SearchParams, signal: AbortSignal) => {
      signals.push(signal);
      return new Promise<SearchResponse>((resolve) => resolvers.push(resolve));
    });
    const loader = createResultsLoader(fetcher);
    loader.request(params(1));
    await vi.advanceTimersByTimeAsync(FETCH_DEBOUNCE_MS);
    loader.request(params(2));
    expect(signals[0].aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(FETCH_DEBOUNCE_MS);
    resolvers[1](answer(2));
    await vi.advanceTimersByTimeAsync(0);
    resolvers[0](answer(1));
    await vi.advanceTimersByTimeAsync(0);
    expect(loader.getSnapshot()).toMatchObject({ status: "ready", data: { page: 2 } });
  });

  it("serves a repeated search from the cache and does not ask twice for the one in flight", async () => {
    const fetcher = vi.fn(async (p: SearchParams) => answer(p.page));
    const loader = createResultsLoader(fetcher);
    loader.request(params(1));
    loader.request(params(1));
    await vi.advanceTimersByTimeAsync(FETCH_DEBOUNCE_MS);
    loader.request(params(2));
    await vi.advanceTimersByTimeAsync(FETCH_DEBOUNCE_MS);
    loader.request(params(1));
    expect(loader.getSnapshot()).toMatchObject({ status: "ready", data: { page: 1 } });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("sends the search again after stop (React's dev double run of effects aborts the first request)", async () => {
    const signals: AbortSignal[] = [];
    const fetcher = vi.fn(async (p: SearchParams, signal: AbortSignal) => {
      signals.push(signal);
      return answer(p.page);
    });
    const loader = createResultsLoader(fetcher);
    loader.request(params(1));
    loader.stop();
    expect(signals[0].aborted).toBe(true);
    loader.request(params(1));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(loader.getSnapshot()).toMatchObject({ status: "ready", data: { page: 1 } });
  });

  it("reports an error, keeps the last answer for the filter options, and retries now", async () => {
    let fail = true;
    const fetcher = vi.fn(async (p: SearchParams) => {
      if (fail && p.page === 2) throw new Error("down");
      return answer(p.page);
    });
    const loader = createResultsLoader(fetcher);
    loader.request(params(1));
    await vi.advanceTimersByTimeAsync(FETCH_DEBOUNCE_MS);
    loader.request(params(2));
    await vi.advanceTimersByTimeAsync(FETCH_DEBOUNCE_MS);
    expect(loader.getSnapshot()).toMatchObject({ status: "error", previous: { page: 1 } });
    fail = false;
    loader.retry();
    expect(loader.getSnapshot().status).toBe("loading");
    await vi.advanceTimersByTimeAsync(0);
    expect(loader.getSnapshot()).toMatchObject({ status: "ready", data: { page: 2 } });
  });
});
