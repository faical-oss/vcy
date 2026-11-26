import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoomAvailability, RoomAvailabilityRequest } from "@/interfaces";
import { availabilityStore, type Fetcher } from "./availability-store";

const request = (overrides: Partial<RoomAvailabilityRequest> = {}): RoomAvailabilityRequest => ({ kind: "experience", id: "ubud", checkIn: "2099-12-01", checkOut: "2099-12-07", adults: 2, children: 0, childAges: [], rooms: 1, ...overrides });
const room = (id: string, available = true): RoomAvailability => ({ roomId: id, available, price: { amount: 100, currency: "USD" }, unit: "person" });
const snap = () => availabilityStore.getSnapshot();

/** A fetcher the test settles by hand. */
function controllable() {
  const calls: { request: RoomAvailabilityRequest; signal: AbortSignal; resolve: (rooms: RoomAvailability[]) => void; reject: (error: Error) => void }[] = [];
  const fetcher: Fetcher = (given, signal) => new Promise((resolve, reject) => calls.push({ request: given, signal, resolve: (rooms) => resolve({ rooms }), reject }));
  return { fetcher, calls };
}

beforeEach(() => {
  vi.useFakeTimers();
  availabilityStore.reset();
});
afterEach(() => {
  availabilityStore.reset();
  vi.useRealTimers();
});

describe("availability store", () => {
  it("makes no call without a search and stays idle", () => {
    const { fetcher, calls } = controllable();
    availabilityStore.configure({ fetcher, minLoadingMs: 0 });
    availabilityStore.request(null);
    vi.advanceTimersByTime(5000);
    expect(calls).toHaveLength(0);
    expect(snap().status).toBe("idle");
  });

  it("goes idle -> loading -> ready when rooms are available, and none when every room is sold out", async () => {
    const { fetcher, calls } = controllable();
    availabilityStore.configure({ fetcher, minLoadingMs: 0 });
    availabilityStore.request(request(), { immediate: true });
    expect(snap().status).toBe("loading");
    calls[0].resolve([room("a"), room("b", false)]);
    await vi.advanceTimersByTimeAsync(0);
    expect(snap().status).toBe("ready");
    expect(snap().rooms).toHaveLength(2);

    availabilityStore.request(request({ rooms: 2, adults: 2 }), { immediate: true });
    calls[1].resolve([room("a", false), room("b", false)]);
    await vi.advanceTimersByTimeAsync(0);
    expect(snap().status).toBe("none");
  });

  it("goes to error when the call fails, and retry asks again for the same search", async () => {
    const { fetcher, calls } = controllable();
    availabilityStore.configure({ fetcher, minLoadingMs: 0 });
    availabilityStore.request(request(), { immediate: true });
    calls[0].reject(new Error("boom"));
    await vi.advanceTimersByTimeAsync(0);
    expect(snap().status).toBe("error");

    availabilityStore.retry();
    expect(snap().status).toBe("loading");
    expect(calls).toHaveLength(2);
    calls[1].resolve([room("a")]);
    await vi.advanceTimersByTimeAsync(0);
    expect(snap().status).toBe("ready");
  });

  it("makes one call for quick edits: each change waits 400 ms and only the last search is asked", async () => {
    const { fetcher, calls } = controllable();
    availabilityStore.configure({ fetcher, minLoadingMs: 0 });
    availabilityStore.request(request({ adults: 2 }));
    vi.advanceTimersByTime(300);
    availabilityStore.request(request({ adults: 3 }));
    vi.advanceTimersByTime(300);
    availabilityStore.request(request({ adults: 4 }));
    expect(calls).toHaveLength(0);
    vi.advanceTimersByTime(399);
    expect(calls).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(calls).toHaveLength(1);
    expect(calls[0].request.adults).toBe(4);
  });

  it("asks at once when flushed (the travellers dropdown closed), and flush does nothing without a pending search", () => {
    const { fetcher, calls } = controllable();
    availabilityStore.configure({ fetcher, minLoadingMs: 0 });
    availabilityStore.flush();
    expect(calls).toHaveLength(0);
    availabilityStore.request(request());
    availabilityStore.flush();
    expect(calls).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(calls).toHaveLength(1); // the timer was consumed
  });

  it("skips an identical search, whether it is loading or done", async () => {
    const { fetcher, calls } = controllable();
    availabilityStore.configure({ fetcher, minLoadingMs: 0 });
    availabilityStore.request(request(), { immediate: true });
    availabilityStore.request(request(), { immediate: true });
    availabilityStore.request(request());
    expect(calls).toHaveLength(1);
    calls[0].resolve([room("a")]);
    await vi.advanceTimersByTimeAsync(0);
    availabilityStore.request(request());
    vi.advanceTimersByTime(1000);
    expect(calls).toHaveLength(1);
  });

  it("refetches when dates, adults, children, a child's age or rooms change", () => {
    const { fetcher, calls } = controllable();
    availabilityStore.configure({ fetcher, minLoadingMs: 0 });
    const changes: Partial<RoomAvailabilityRequest>[] = [{}, { checkIn: "2099-12-02", checkOut: "2099-12-08" }, { adults: 3 }, { adults: 3, children: 1, childAges: [4] }, { adults: 3, children: 1, childAges: [5] }, { adults: 3, children: 1, childAges: [5], rooms: 2 }];
    for (const change of changes) availabilityStore.request(request(change), { immediate: true });
    expect(calls).toHaveLength(changes.length);
  });

  it("ignores a stale response: a newer search aborts the older call and its answer never shows", async () => {
    const { fetcher, calls } = controllable();
    availabilityStore.configure({ fetcher, minLoadingMs: 0 });
    availabilityStore.request(request({ adults: 2 }), { immediate: true });
    availabilityStore.request(request({ adults: 3 }), { immediate: true });
    expect(calls[0].signal.aborted).toBe(true);
    calls[1].resolve([room("new")]);
    await vi.advanceTimersByTimeAsync(0);
    calls[0].resolve([room("old")]); // arrives late
    await vi.advanceTimersByTimeAsync(0);
    expect(snap().rooms.map((entry) => entry.roomId)).toEqual(["new"]);
    // an aborted call that rejects is not an error either
    const abort = new Error("aborted");
    abort.name = "AbortError";
    availabilityStore.request(request({ adults: 4 }), { immediate: true });
    availabilityStore.request(request({ adults: 5 }), { immediate: true });
    calls[2].reject(abort);
    await vi.advanceTimersByTimeAsync(0);
    expect(snap().status).toBe("loading");
  });

  it("caches finished searches for the session: going back to one shows it at once with no call", async () => {
    const { fetcher, calls } = controllable();
    availabilityStore.configure({ fetcher, minLoadingMs: 0 });
    availabilityStore.request(request({ adults: 2 }), { immediate: true });
    calls[0].resolve([room("a")]);
    await vi.advanceTimersByTimeAsync(0);
    availabilityStore.request(request({ adults: 3 }), { immediate: true });
    calls[1].resolve([room("b")]);
    await vi.advanceTimersByTimeAsync(0);
    availabilityStore.request(request({ adults: 2 }), { immediate: true });
    expect(snap().status).toBe("ready"); // no loading flash
    expect(snap().rooms.map((entry) => entry.roomId)).toEqual(["a"]);
    expect(calls).toHaveLength(2);
  });

  it("does not cache an error: the same search asked again after changing away calls again", async () => {
    const { fetcher, calls } = controllable();
    availabilityStore.configure({ fetcher, minLoadingMs: 0 });
    availabilityStore.request(request({ adults: 2 }), { immediate: true });
    calls[0].reject(new Error("boom"));
    await vi.advanceTimersByTimeAsync(0);
    availabilityStore.request(request({ adults: 3 }), { immediate: true });
    availabilityStore.request(request({ adults: 2 }), { immediate: true });
    expect(calls).toHaveLength(3);
  });

  it("holds a fast answer back until the minimum loading time so it does not flicker", async () => {
    const { fetcher, calls } = controllable();
    availabilityStore.configure({ fetcher, minLoadingMs: 300 });
    availabilityStore.request(request(), { immediate: true });
    calls[0].resolve([room("a")]);
    await vi.advanceTimersByTimeAsync(100);
    expect(snap().status).toBe("loading");
    await vi.advanceTimersByTimeAsync(250);
    expect(snap().status).toBe("ready");
  });

  it("goes back to idle, and cancels what is waiting, when the search stops being valid", () => {
    const { fetcher, calls } = controllable();
    availabilityStore.configure({ fetcher, minLoadingMs: 0 });
    availabilityStore.request(request());
    availabilityStore.request(null);
    vi.advanceTimersByTime(2000);
    expect(calls).toHaveLength(0);
    expect(snap().status).toBe("idle");
  });

  it("counts settled answers for the live region, and holds the reveal flag until it is consumed once", async () => {
    const { fetcher, calls } = controllable();
    availabilityStore.configure({ fetcher, minLoadingMs: 0 });
    expect(snap().updates).toBe(0);
    availabilityStore.markReveal();
    expect(snap().revealPending).toBe(true);
    availabilityStore.request(request(), { immediate: true });
    calls[0].resolve([room("a")]);
    await vi.advanceTimersByTimeAsync(0);
    expect(snap().updates).toBe(1);
    expect(availabilityStore.consumeReveal()).toBe(true);
    expect(availabilityStore.consumeReveal()).toBe(false);
  });
});
