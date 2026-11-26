import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockReviewService } from "./review.mock";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

async function list(offset: number, limit: number) {
  const promise = mockReviewService.listReviews({ slug: "azure-spa", offset, limit });
  await vi.advanceTimersByTimeAsync(1000);
  return promise;
}

describe("mock review list", () => {
  it("makes up reviews deterministically, newest first, with unique ids and valid fields", async () => {
    const first = await list(0, 10);
    const again = await list(0, 10);
    expect(first).toEqual(again);
    expect(first.ok && first.items).toHaveLength(10);
    if (!first.ok) return;
    expect(new Set(first.items.map((item) => item.id)).size).toBe(10);
    for (const item of first.items) {
      expect(item.rating).toBeGreaterThanOrEqual(1);
      expect(item.rating).toBeLessThanOrEqual(5);
      expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    const dates = first.items.map((item) => item.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("always makes up a complete review, for many slugs and positions", async () => {
    for (const slug of ["azure-spa", "chiva-som-hua-hin", "ubud-yoga-and-detox-retreat", "x"]) {
      const result = mockReviewService.listReviews({ slug, offset: 0, limit: 60 });
      await vi.advanceTimersByTimeAsync(1000);
      const page = await result;
      if (!page.ok) throw new Error("expected ok");
      for (const item of page.items) for (const field of [item.author, item.location, item.title, item.text, item.date]) expect(typeof field).toBe("string");
    }
  });

  it("continues where the previous page stopped, without repeating", async () => {
    const a = await list(0, 10);
    const b = await list(10, 10);
    if (!a.ok || !b.ok) throw new Error("expected ok");
    expect(a.items.some((item) => b.items.some((other) => other.id === item.id))).toBe(false);
    expect(b.items[0].id).toBe("azure-spa-r11");
  });
});
