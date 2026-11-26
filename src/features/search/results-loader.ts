import { FETCH_DEBOUNCE_MS } from "@/helpers/fetch-timing";
import { resultsKey } from "@/helpers/search-results";
import type { SearchParams, SearchResponse } from "@/interfaces";

/** `previous` is the last answer, kept while a new one loads so the filter options do not disappear. */
export type ResultsSnapshot =
  | { status: "idle"; previous: null }
  | { status: "loading" | "error"; key: string; previous: SearchResponse | null }
  | { status: "ready"; key: string; data: SearchResponse; previous: SearchResponse };

export type ResultsFetcher = (params: SearchParams, signal: AbortSignal) => Promise<SearchResponse>;

/**
 * Asks for the results of the search the page is showing, and nothing else. The rules:
 *  - no call without a search (`request(null)` is idle);
 *  - the same search is not asked twice: an answer is cached by its parameters, and asking again for the one in flight does nothing;
 *  - the first search of the page is sent at once; after that quick edits make one call: a new search waits `FETCH_DEBOUNCE_MS`
 *    (the booking box's delay) before it is sent;
 *  - a newer search aborts the older request and ignores its answer.
 * One instance per results page; no global state.
 */
export function createResultsLoader(fetcher: ResultsFetcher, debounceMs = FETCH_DEBOUNCE_MS) {
  let snapshot: ResultsSnapshot = { status: "idle", previous: null };
  let wanted: { key: string; params: SearchParams } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let controller: AbortController | null = null;
  let sequence = 0;
  const cache = new Map<string, SearchResponse>();
  const listeners = new Set<() => void>();

  const publish = (next: ResultsSnapshot) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };
  const cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    controller?.abort();
    controller = null;
    sequence += 1;
  };
  const last = () => snapshot.previous;

  function run({ key, params }: { key: string; params: SearchParams }) {
    timer = null;
    const id = ++sequence;
    controller = new AbortController();
    fetcher(params, controller.signal).then(
      (data) => {
        if (id !== sequence) return;
        cache.set(key, data);
        publish({ status: "ready", key, data, previous: data });
      },
      () => {
        if (id === sequence) publish({ status: "error", key, previous: last() });
      },
    );
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    /** The search to show, or null when there is none. */
    request(params: SearchParams | null) {
      if (!params) {
        cancel();
        wanted = null;
        if (snapshot.status !== "idle") publish({ status: "idle", previous: null });
        return;
      }
      const key = resultsKey(params);
      if (wanted?.key === key && snapshot.status !== "error") return;
      const first = snapshot.status === "idle";
      cancel();
      wanted = { key, params };
      const cached = cache.get(key);
      if (cached) return publish({ status: "ready", key, data: cached, previous: cached });
      publish({ status: "loading", key, previous: last() });
      if (first) run({ key, params });
      else timer = setTimeout(() => run({ key, params }), debounceMs);
    },
    /** Asks again for the search that failed, now. */
    retry() {
      if (!wanted) return;
      cancel();
      cache.delete(wanted.key);
      publish({ status: "loading", key: wanted.key, previous: last() });
      run(wanted);
    },
    cancel,
    /**
     * The page went away (or React's dev double-run of effects undid the first one): abort what is in flight and forget what was
     * wanted, so the next `request` of the same search is sent again instead of waiting for an answer that was aborted.
     */
    stop() {
      cancel();
      wanted = null;
      if (snapshot.status === "loading") publish({ status: "idle", previous: null });
    },
  };
}
